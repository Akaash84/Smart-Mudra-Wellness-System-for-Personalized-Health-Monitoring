import Link from "next/link";

const features = [
  ["AI mudra analysis", "Detect and score mudra practice in real time."],
  ["Physiology monitoring", "Track heart rate, SpO2, stress, and activity."],
  ["Personalized guidance", "Get wellness recommendations and practice routines."],
];

export default function HomePage() {
  return (
    <div className="page-grid">
      <section className="hero">
        <span className="pill">MudraHealth</span>
        <h1>AI-powered wellness monitoring with mudra guidance.</h1>
        <p>
          A modern wellness platform that combines traditional mudra practice with simulated
          health tracking, AI recommendations, and guided routines.
        </p>
        <div className="hero-actions">
          <Link href="/auth" className="button">
            Get Started
          </Link>
          <Link href="/dashboard" className="button-secondary">
            Open Dashboard
          </Link>
        </div>
      </section>

      <section className="dashboard-grid">
        {features.map(([title, description]) => (
          <article className="stat-card tone-green" key={title}>
            <p>{title}</p>
            <h3>Ready</h3>
            <span>{description}</span>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <article className="card">
          <h2 className="section-title">Why it works</h2>
          <p className="section-subtitle">
            The app simulates sensor data, detects mudra alignment, and suggests personalized
            wellness routines without needing hardware.
          </p>
        </article>
        <article className="card">
          <h2 className="section-title">Included pages</h2>
          <p className="section-subtitle">
            Dashboard, detection, recommendations, mudra library, assistant, profile, and auth.
          </p>
        </article>
      </section>
    </div>
  );
}
