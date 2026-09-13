"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildRecommendations, generateMetrics } from "../../lib/mudra";
import {
  deriveDashboardViewModel,
  getAverageScoreByMudra,
  loadPracticeProgress,
  subscribePracticeProgress,
  type PracticeProgressState,
} from "../../lib/progress-store";

export default function RecommendationsPage() {
  const [progress, setProgress] = useState<PracticeProgressState>({ sessions: [] });

  useEffect(() => {
    setProgress(loadPracticeProgress());
    const unsubscribe = subscribePracticeProgress((next) => {
      setProgress(next);
    });
    return unsubscribe;
  }, []);

  const dashboardModel = useMemo(() => deriveDashboardViewModel(progress, 0), [progress]);

  const recommendations = useMemo(() => {
    const fallbackMetrics = generateMetrics("mudrahealth-demo");
    const metrics = dashboardModel.metrics ?? fallbackMetrics;
    const base = buildRecommendations(metrics, "Stress relief");

    if (!dashboardModel.hasData) {
      return base.map((item) => ({ ...item, score: null as number | null }));
    }

    const averages = getAverageScoreByMudra(progress);
    return base.map((item) => {
      const key = item.mudra.toLowerCase();
      const practicedScore = averages.get(key);
      const liveScore = practicedScore
        ? Math.round(item.score * 0.65 + practicedScore * 0.35)
        : item.score;

      return {
        ...item,
        score: Math.max(0, Math.min(100, liveScore)),
      };
    });
  }, [dashboardModel.hasData, dashboardModel.metrics, progress]);

  return (
    <div className="page-grid">
      <section>
        <h1 className="section-title">AI Recommendations</h1>
        <p className="section-subtitle">
          {dashboardModel.hasData
            ? "Personalized mudra suggestions based on your live practice performance."
            : "Scores start empty. Complete one practice session to generate live recommendation scores."}
        </p>
      </section>

      <section className="recommendation-grid">
        {recommendations.map((item) => (
          <article className="recommendation-card" key={item.id}>
            <header>
              <div>
                <span className="pill">{item.mudra}</span>
                <h2>{item.score === null ? "--/100" : `${item.score}/100`}</h2>
              </div>
              <strong>{item.duration}</strong>
            </header>
            <p className="section-subtitle">{item.reason}</p>
            <ul>
              {item.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <p>{item.routine}</p>
            <div className="hero-actions">
              <Link
                className="button"
                href={`/practice?mudra=${encodeURIComponent(item.mudra)}`}
              >
                Start Practice
              </Link>
              <Link
                className="button-secondary"
                href={`/library?mudra=${encodeURIComponent(item.mudra)}`}
              >
                Learn More
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
