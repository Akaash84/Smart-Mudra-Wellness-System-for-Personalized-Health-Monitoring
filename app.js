const videoElement = document.querySelector(".input-video");
const canvasElement = document.querySelector(".output-canvas");
const canvasCtx = canvasElement.getContext("2d");

const detectedMudraEl = document.getElementById("detectedMudra");
const accuracyValueEl = document.getElementById("accuracyValue");
const confidenceMeterEl = document.getElementById("confidenceMeter");
const cameraStatusEl = document.getElementById("cameraStatus");
const targetMudraEl = document.getElementById("targetMudra");
const ruleListEl = document.getElementById("ruleList");
const themeToggleEl = document.getElementById("themeToggle");

const themeKey = "smart-mudra-theme";

function setTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-mode", isLight);
  themeToggleEl.textContent = isLight ? "Dark mode" : "Light mode";
  localStorage.setItem(themeKey, theme);
}

setTheme(localStorage.getItem(themeKey) || "dark");

themeToggleEl.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("light-mode") ? "dark" : "light";
  setTheme(nextTheme);
});

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function getHandMetrics(landmarks) {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const palm = Math.max(0.001, dist(wrist, middleMcp));

  const fingerMap = {
    thumb: { tip: 4, pip: 3 },
    index: { tip: 8, pip: 6 },
    middle: { tip: 12, pip: 10 },
    ring: { tip: 16, pip: 14 },
    little: { tip: 20, pip: 18 },
  };

  const extension = {};
  Object.entries(fingerMap).forEach(([name, ids]) => {
    const tipDist = dist(wrist, landmarks[ids.tip]);
    const pipDist = dist(wrist, landmarks[ids.pip]);
    const ratio = (tipDist - pipDist) / palm;
    extension[name] = clamp((ratio - 0.02) / 0.08);
  });

  const touch = {
    thumbIndex: clamp(1 - dist(landmarks[4], landmarks[8]) / (palm * 0.35)),
    thumbMiddle: clamp(1 - dist(landmarks[4], landmarks[12]) / (palm * 0.35)),
    thumbRing: clamp(1 - dist(landmarks[4], landmarks[16]) / (palm * 0.35)),
    thumbLittle: clamp(1 - dist(landmarks[4], landmarks[20]) / (palm * 0.35)),
  };

  return { extension, touch };
}

function scoreRule(name, score) {
  return { name, score: clamp(score) };
}

function mudraScores(metrics) {
  const e = metrics.extension;
  const t = metrics.touch;

  const mudras = {
    "Gyan Mudra": [
      scoreRule("Thumb touching Index", t.thumbIndex),
      scoreRule("Middle finger extended", e.middle),
      scoreRule("Ring finger extended", e.ring),
      scoreRule("Little finger extended", e.little),
      scoreRule("Index not over-folded", 1 - clamp((0.35 - e.index) / 0.35)),
    ],
    "Apana Mudra": [
      scoreRule("Thumb touching Middle", t.thumbMiddle),
      scoreRule("Thumb touching Ring", t.thumbRing),
      scoreRule("Index finger extended", e.index),
      scoreRule("Little finger extended", e.little),
      scoreRule("Middle finger relaxed", 1 - e.middle * 0.4),
    ],
    "Prana Mudra": [
      scoreRule("Thumb touching Ring", t.thumbRing),
      scoreRule("Thumb touching Little", t.thumbLittle),
      scoreRule("Index finger extended", e.index),
      scoreRule("Middle finger extended", e.middle),
      scoreRule("Ring not fully extended", 1 - e.ring),
    ],
  };

  const result = Object.entries(mudras).map(([name, rules]) => {
    const avg = rules.reduce((s, r) => s + r.score, 0) / rules.length;
    return { name, score: avg, rules };
  });

  result.sort((a, b) => b.score - a.score);
  return result;
}

function scoreClass(score) {
  if (score >= 0.75) return "pass";
  if (score >= 0.45) return "mid";
  return "fail";
}

function renderRules(rules) {
  ruleListEl.innerHTML = "";
  rules.forEach((rule) => {
    const li = document.createElement("li");
    li.className = "rule-item";

    const name = document.createElement("span");
    name.className = "rule-name";
    name.textContent = rule.name;

    const score = document.createElement("span");
    score.className = `rule-score ${scoreClass(rule.score)}`;
    score.textContent = `${Math.round(rule.score * 100)}%`;

    li.appendChild(name);
    li.appendChild(score);
    ruleListEl.appendChild(li);
  });
}

function updateResultUI(mudraName, score, rules) {
  detectedMudraEl.textContent = mudraName;
  accuracyValueEl.textContent = `${Math.round(score * 100)}%`;
  confidenceMeterEl.style.width = `${Math.round(score * 100)}%`;
  renderRules(rules);
}

function onResults(results) {
  canvasElement.width = results.image.width;
  canvasElement.height = results.image.height;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    cameraStatusEl.textContent = "No hand detected";
    updateResultUI("Show one hand", 0, []);
    canvasCtx.restore();
    return;
  }

  const landmarks = results.multiHandLandmarks[0];
  const theme = document.body.classList.contains("light-mode") ? "light" : "dark";
  const connectorColor = theme === "light" ? "#2a8fff" : "#57d8ff";
  const landmarkColor = theme === "light" ? "#1d9f74" : "#52e396";
  const glowColor = theme === "light" ? "rgba(42, 143, 255, 0.55)" : "rgba(87, 216, 255, 0.72)";

  canvasCtx.save();
  canvasCtx.shadowBlur = 22;
  canvasCtx.shadowColor = glowColor;
  drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
    color: connectorColor,
    lineWidth: 6,
  });
  canvasCtx.shadowBlur = 16;
  canvasCtx.shadowColor = theme === "light" ? "rgba(29, 159, 116, 0.45)" : "rgba(83, 231, 165, 0.6)";
  drawLandmarks(canvasCtx, landmarks, {
    color: landmarkColor,
    fillColor: theme === "light" ? "#cbf7e8" : "#9bffcf",
    lineWidth: 1,
    radius: 5,
  });
  canvasCtx.shadowBlur = 0;
  drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
    color: connectorColor,
    lineWidth: 2,
  });
  canvasCtx.restore();

  const metrics = getHandMetrics(landmarks);
  const scores = mudraScores(metrics);

  const target = targetMudraEl.value;
  const selected = target === "auto" ? scores[0] : scores.find((m) => m.name === target) || scores[0];

  cameraStatusEl.textContent = "Hand tracking active";
  updateResultUI(selected.name, selected.score, selected.rules);

  canvasCtx.restore();
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.65,
  minTrackingConfidence: 0.55,
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});

camera
  .start()
  .then(() => {
    cameraStatusEl.textContent = "Camera ready";
  })
  .catch((err) => {
    cameraStatusEl.textContent = "Camera error. Allow permission and reload.";
    detectedMudraEl.textContent = "Camera unavailable";
    console.error(err);
  });
