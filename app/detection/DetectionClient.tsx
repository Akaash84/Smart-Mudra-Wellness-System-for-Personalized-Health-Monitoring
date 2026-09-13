"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recordPracticeSession } from "../../lib/progress-store";
import { getMudraLibrary } from "../../lib/mudra";

const mudras = [
  { name: "Gyan Mudra", color: "#22c55e", rule: "Thumb and index finger touch" },
  { name: "Prana Mudra", color: "#14b8a6", rule: "Thumb touches ring and little fingers" },
  { name: "Apana Mudra", color: "#10b981", rule: "Thumb touches middle and ring fingers" },
  { name: "Surya Mudra", color: "#f59e0b", rule: "Thumb presses ring finger" },
];

type DetectionClientProps = {
  requestedMudra: string;
};

type Point = {
  x: number;
  y: number;
};

type LiveMeasurement = {
  distances: Array<{ label: string; normalized: number; pixels: number }>;
  angles: Array<{ label: string; degrees: number }>;
};

export default function DetectionClient({ requestedMudra }: DetectionClientProps) {
  const [running, setRunning] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [score, setScore] = useState(0);
  const [detectedMudra, setDetectedMudra] = useState("Waiting for hand...");
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [liveMeasurement, setLiveMeasurement] = useState<LiveMeasurement | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [selectedMudra, setSelectedMudra] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const runningRef = useRef(false);

  const referenceMeasurements = useMemo(() => {
    if (!selectedMudra) return null;
    const library = getMudraLibrary();
    const mudra = library.find((m) => m.name === selectedMudra);
    return mudra?.referenceMeasurements || null;
  }, [selectedMudra]);

  const targetMudra = useMemo(() => {
    const found = mudras.find((mudra) => mudra.name.toLowerCase() === requestedMudra.toLowerCase());
    return found?.name ?? "";
  }, [requestedMudra]);

  async function startCamera() {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setCameraError("Camera needs a secure context. Open this app on https:// or localhost.");
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support camera access. Try latest Chrome or Edge.");
      return false;
    }

    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      return true;
    } catch {
      setCameraError("Camera blocked. Allow camera permission in browser site settings and try again.");
      setCameraOn(false);
      return false;
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setRunning(false);
    setSessionStartedAt(null);
    setLiveMeasurement(null);
  }

  function clamp(value: number, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function distPixels(a: Point, b: Point, width: number, height: number) {
    const dx = (a.x - b.x) * width;
    const dy = (a.y - b.y) * height;
    return Math.hypot(dx, dy);
  }

  function toDegrees(radians: number) {
    return (radians * 180) / Math.PI;
  }

  function angleBetween(origin: Point, a: Point, b: Point) {
    const ax = a.x - origin.x;
    const ay = a.y - origin.y;
    const bx = b.x - origin.x;
    const by = b.y - origin.y;

    const magA = Math.hypot(ax, ay);
    const magB = Math.hypot(bx, by);

    if (magA < 1e-5 || magB < 1e-5) {
      return 0;
    }

    const cosine = clamp((ax * bx + ay * by) / (magA * magB), -1, 1);
    return toDegrees(Math.acos(cosine));
  }

  function calculateLiveMeasurement(landmarks: Point[], width: number, height: number): LiveMeasurement {
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const palmPixels = Math.max(1, distPixels(wrist, middleMcp, width, height));

    const makeDistance = (label: string, from: number, to: number) => {
      const pixels = distPixels(landmarks[from], landmarks[to], width, height);
      return {
        label,
        pixels,
        normalized: pixels / palmPixels,
      };
    };

    return {
      distances: [
        makeDistance("Thumb-Index", 4, 8),
        makeDistance("Thumb-Middle", 4, 12),
        makeDistance("Thumb-Ring", 4, 16),
        makeDistance("Thumb-Little", 4, 20),
        makeDistance("Index-Middle", 8, 12),
        makeDistance("Middle-Ring", 12, 16),
        makeDistance("Ring-Little", 16, 20),
      ],
      angles: [
        { label: "Index-Middle", degrees: angleBetween(wrist, landmarks[8], landmarks[12]) },
        { label: "Middle-Ring", degrees: angleBetween(wrist, landmarks[12], landmarks[16]) },
        { label: "Ring-Little", degrees: angleBetween(wrist, landmarks[16], landmarks[20]) },
      ],
    };
  }

  function getMetrics(landmarks: Array<{ x: number; y: number }>) {
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const palm = Math.max(0.001, dist(wrist, middleMcp));

    const extension = {
      index: clamp((dist(wrist, landmarks[8]) - dist(wrist, landmarks[6])) / (palm * 0.12)),
      middle: clamp((dist(wrist, landmarks[12]) - dist(wrist, landmarks[10])) / (palm * 0.12)),
      ring: clamp((dist(wrist, landmarks[16]) - dist(wrist, landmarks[14])) / (palm * 0.12)),
      little: clamp((dist(wrist, landmarks[20]) - dist(wrist, landmarks[18])) / (palm * 0.12)),
    };

    const touch = {
      thumbIndex: clamp(1 - dist(landmarks[4], landmarks[8]) / (palm * 0.4)),
      thumbMiddle: clamp(1 - dist(landmarks[4], landmarks[12]) / (palm * 0.4)),
      thumbRing: clamp(1 - dist(landmarks[4], landmarks[16]) / (palm * 0.4)),
      thumbLittle: clamp(1 - dist(landmarks[4], landmarks[20]) / (palm * 0.4)),
    };

    return { extension, touch };
  }

  function scoreMudras(landmarks: Array<{ x: number; y: number }>) {
    const m = getMetrics(landmarks);
    const e = m.extension;
    const t = m.touch;

    const scores = [
      {
        name: "Gyan Mudra",
        value: (t.thumbIndex + e.middle + e.ring + e.little) / 4,
      },
      {
        name: "Prana Mudra",
        value: (t.thumbRing + t.thumbLittle + e.index + e.middle + (1 - e.ring)) / 5,
      },
      {
        name: "Apana Mudra",
        value: (t.thumbMiddle + t.thumbRing + e.index + e.little) / 4,
      },
      {
        name: "Surya Mudra",
        value: (t.thumbRing + e.index + e.middle + e.little + (1 - e.ring)) / 5,
      },
    ];

    scores.sort((a, b) => b.value - a.value);
    return scores;
  }

  async function loadMediaPipe() {
    const scripts = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
    ];

    await Promise.all(
      scripts.map(
        (src) =>
          new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(`script[src='${src}']`) as HTMLScriptElement | null;
            if (existing) {
              resolve();
              return;
            }

            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.body.appendChild(script);
          }),
      ),
    );
  }

  async function setupHands() {
    if (handsRef.current) {
      return;
    }

    await loadMediaPipe();

    const Hands = (window as any).Hands;
    const drawConnectors = (window as any).drawConnectors;
    const drawLandmarks = (window as any).drawLandmarks;
    const HAND_CONNECTIONS = (window as any).HAND_CONNECTIONS;

    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6,
    });

    hands.onResults((results: any) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        setDetectedMudra("No hand detected");
        setScore(0);
        setLiveMeasurement(null);
        setHandDetected(false);
        return;
      }

      setHandDetected(true);
      const landmarks = results.multiHandLandmarks[0] as Array<{ x: number; y: number }>;

      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(0, 255, 170, 0.8)";
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color: "#22f6a6",
        lineWidth: 8,
      });
      drawLandmarks(ctx, landmarks, {
        color: "#15c97b",
        fillColor: "#a6ffd9",
        lineWidth: 2,
        radius: 9,
      });
      ctx.restore();

      const ranked = scoreMudras(landmarks);
      const selected = targetMudra
        ? ranked.find((item) => item.name === targetMudra) ?? ranked[0]
        : ranked[0];
      const measured = calculateLiveMeasurement(landmarks, canvas.width, canvas.height);

      setDetectedMudra(selected.name);
      setScore(Math.round(clamp(selected.value) * 100));
      setLiveMeasurement(measured);
    });

    handsRef.current = hands;
  }

  async function detectFrame() {
    if (!runningRef.current || !handsRef.current || processingRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      return;
    }

    processingRef.current = true;
    try {
      await handsRef.current.send({ image: video });
    } finally {
      processingRef.current = false;
    }
  }

  function startDetectionLoop() {
    const loop = async () => {
      if (!runningRef.current) {
        return;
      }
      await detectFrame();
      rafRef.current = window.requestAnimationFrame(loop);
    };

    if (!rafRef.current) {
      rafRef.current = window.requestAnimationFrame(loop);
    }
  }

  function stopDetectionLoop() {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    runningRef.current = false;
    processingRef.current = false;
  }

  useEffect(() => {
    return () => {
      stopDetectionLoop();
      stopCamera();
    };
  }, []);

  useEffect(() => {
    runningRef.current = running;
    if (running && cameraOn) {
      startDetectionLoop();
    } else {
      stopDetectionLoop();
    }
  }, [running, cameraOn]);

  async function handleDetectionClick() {
    if (running) {
      setRunning(false);
      return;
    }

    if (!cameraOn) {
      const cameraReady = await startCamera();
      if (!cameraReady) {
        return;
      }
    }

    try {
      await setupHands();
    } catch {
      setCameraError("Could not load hand tracking model. Check internet and try again.");
      return;
    }

    setSaveMessage("");
    setSessionStartedAt(Date.now());
    setRunning(true);
  }

  function handleCompletePractice() {
    if (score <= 0) {
      setSaveMessage("Hold your mudra until a score appears, then save the session.");
      return;
    }

    const durationMinutes = sessionStartedAt
      ? Math.max(1, Math.round((Date.now() - sessionStartedAt) / 60000))
      : 1;

    const mudraName = targetMudra || (detectedMudra.includes("Mudra") ? detectedMudra : "Gyan Mudra");

    recordPracticeSession({
      mudra: mudraName,
      score,
      durationMinutes,
    });

    setRunning(false);
    setSaveMessage(`Practice saved: ${mudraName} at ${score}% accuracy.`);
  }

  return (
    <div className="detection-grid">
      <section>
        <h1 className="section-title">Mudra Detection</h1>
        <p className="section-subtitle">
          Live camera preview with hand landmark tracking and mudra accuracy scoring.
        </p>
        <p className="status-line" style={{ marginTop: 8 }}>
          <span className="live-pill">
            <span className="pulse-dot" />
            {running ? "Live" : "Idle"}
          </span>
          <span>{running ? "Tracking in real time" : "Start detection to begin live scoring"}</span>
        </p>
      </section>

      <section className="full-detection-layout">
        <div className="camera-container">
          <div className="sim-screen live-screen">
            <video ref={videoRef} className="camera-feed" playsInline muted autoPlay />
            <canvas ref={canvasRef} className="hand-overlay" />
          </div>
          <div className="hero-actions" style={{ marginTop: 16 }}>
            <button className="button-secondary" onClick={cameraOn ? stopCamera : startCamera}>
              {cameraOn ? "Stop Camera" : "Start Camera"}
            </button>
            <button className="button" onClick={handleDetectionClick}>
              {running ? "Stop Detection" : "Start Detection"}
            </button>
            <button className="button" onClick={handleCompletePractice}>
              Complete Practice
            </button>
            <button className="button-secondary" onClick={() => setScore(0)}>
              Reset Score
            </button>
          </div>
          {saveMessage ? <p className="helper" style={{ marginTop: 10 }}>{saveMessage}</p> : null}
          {cameraError ? <p className="camera-error" style={{ marginTop: 10 }}>{cameraError}</p> : null}
        </div>

        <aside className="detection-sidebar">
          {handDetected && !selectedMudra ? (
            <div className="card mudra-selection-panel">
              <h3 className="section-title">Select Mudra</h3>
              <p className="section-subtitle">Hand detected! Choose which mudra you want to practice:</p>
              <div className="mudra-button-grid">
                {mudras.map((mudra) => (
                  <button
                    key={mudra.name}
                    className="mudra-select-btn"
                    style={{
                      borderTop: `4px solid ${mudra.color}`,
                      background: `linear-gradient(135deg, ${mudra.color}22, ${mudra.color}11)`,
                    }}
                    onClick={() => setSelectedMudra(mudra.name)}
                  >
                    <strong style={{ color: mudra.color }}>{mudra.name}</strong>
                    <p className="meta">{mudra.rule}</p>
                  </button>
                ))}
              </div>
              <button className="button-secondary" onClick={() => setSelectedMudra("")} style={{ marginTop: 12, width: "100%" }}>
                Clear Selection
              </button>
            </div>
          ) : selectedMudra ? (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedMudra}</h3>
                  <p className="helper" style={{ margin: "4px 0 0" }}>Accuracy</p>
                </div>
                <strong style={{ fontSize: "1.8rem" }}>{running ? `${score}%` : "--"}</strong>
              </div>
              <div className="progress" style={{ marginBottom: 18 }}>
                <span style={{ width: `${running ? score : 0}%` }} />
              </div>
              <button className="button-secondary" onClick={() => setSelectedMudra("")} style={{ width: "100%", marginBottom: 12 }}>
                Change Mudra
              </button>

              {liveMeasurement ? (
                <>
                  <div className="reference-vs-live">
                    <div className="measurement-column">
                      <h4>Live Angles</h4>
                      <div className="comparison-list">
                        {liveMeasurement.angles.map((angle) => (
                          <div key={angle.label} className="comparison-row">
                            <span className="comparison-label">{angle.label}</span>
                            <div className="comparison-values">
                              <span className="live-value">{angle.degrees.toFixed(1)}°</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="measurement-column">
                      <h4>Live Distances</h4>
                      <div className="comparison-list">
                        {liveMeasurement.distances.slice(0, 4).map((dist) => (
                          <div key={dist.label} className="comparison-row">
                            <span className="comparison-label">{dist.label}</span>
                            <div className="comparison-values">
                              <span className="live-value">{dist.normalized.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {referenceMeasurements && (
                    <div className="reference-vs-live" style={{ marginTop: 14 }}>
                      <div className="measurement-column">
                        <h4>Original Angles</h4>
                        <div className="comparison-list">
                          {referenceMeasurements.angles.map((angle) => (
                            <div key={angle.label} className="comparison-row">
                              <span className="comparison-label">{angle.label}</span>
                              <div className="comparison-values">
                                <span className="reference-value">{angle.value}°</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="measurement-column">
                        <h4>Original Distances</h4>
                        <div className="comparison-list">
                          {referenceMeasurements.distances.map((dist) => (
                            <div key={dist.label} className="comparison-row">
                              <span className="comparison-label">{dist.label}</span>
                              <div className="comparison-values">
                                <span className="reference-value">{dist.value.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="helper" style={{ marginTop: 12 }}>
                  Keep your hand steady in the camera to see live measurements.
                </p>
              )}
            </div>
          ) : (
            <div className="card">
              <h3 style={{ margin: 0 }}>Waiting for hand...</h3>
              <p className="helper" style={{ margin: "8px 0 0" }}>
                Show your hand to the camera to get started. Once detected, select which mudra you'd like to practice.
              </p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
