"use client";

import { useEffect, useMemo, useState } from "react";
import { MiniChart } from "../../components/MiniChart";
import { StatCard } from "../../components/StatCard";
import {
  deriveDashboardViewModel,
  loadPracticeProgress,
  subscribePracticeProgress,
  type PracticeProgressState,
} from "../../lib/progress-store";

export default function DashboardPage() {
  const [progress, setProgress] = useState<PracticeProgressState>({ sessions: [] });
  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    setProgress(loadPracticeProgress());

    const unsubscribe = subscribePracticeProgress((next) => {
      setProgress(next);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveTick((tick) => tick + 1);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const viewModel = useMemo(() => deriveDashboardViewModel(progress, liveTick), [progress, liveTick]);

  const heartRateValue = viewModel.metrics ? `${viewModel.metrics.heartRate} bpm` : "--";
  const spo2Value = viewModel.metrics ? `${viewModel.metrics.spo2}%` : "--";
  const stressValue = viewModel.metrics ? `${viewModel.metrics.stress}%` : "--";
  const activityValue = viewModel.metrics ? `${viewModel.metrics.activity}%` : "--";

  return (
    <div className="page-grid">
      <section>
        <h1 className="section-title">Dashboard</h1>
        <p className="section-subtitle">
          {viewModel.hasData
            ? "Live health data synced from your completed practice sessions."
            : "Start a practice session to unlock live scores and activity insights."}
        </p>
      </section>

      <section className="dashboard-grid">
        <StatCard label="Heart Rate" value={heartRateValue} subtext="Live reading" tone="rose" />
        <StatCard label="SpO2" value={spo2Value} subtext="Oxygen saturation" tone="blue" />
        <StatCard label="Stress Level" value={stressValue} subtext="Recovery trend" tone="amber" />
        <StatCard label="Daily Activity" value={activityValue} subtext="Practice + movement" tone="green" />
      </section>

      <section className="panel-grid">
        <article className="card">
          <h2 className="section-title">Weekly Progress</h2>
          <p className="section-subtitle">
            {viewModel.hasData ? "Practice trend for the week." : "No sessions yet. Bars fill after your first practice."}
          </p>
          <MiniChart data={viewModel.weeklyProgress} />
        </article>
        <article className="card">
          <h2 className="section-title">Recent Sessions</h2>
          <div className="list">
            {viewModel.recentSessions.map((session) => (
              <div className="list-item" key={session.id}>
                <div>
                  <strong>{session.mudra}</strong>
                  <div className="meta">{session.duration} • {session.time}</div>
                </div>
                <strong>{session.score}%</strong>
              </div>
            ))}
            {!viewModel.recentSessions.length ? (
              <div className="list-item">
                <div>
                  <strong>No practice yet</strong>
                  <div className="meta">Complete a detection session to populate this feed.</div>
                </div>
                <strong>--</strong>
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
