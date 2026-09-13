import Link from "next/link";
import { getMudraLibrary } from "../../lib/mudra";

type PracticePageProps = {
  searchParams?: { mudra?: string };
};

export default function PracticePage({ searchParams }: PracticePageProps) {
  const mudraName = searchParams?.mudra ?? "Gyan Mudra";
  const library = getMudraLibrary();
  const selected =
    library.find((item) => item.name.toLowerCase() === mudraName.toLowerCase()) ?? library[0];

  return (
    <div className="page-grid">
      <section className="hero">
        <span className="pill">Practice Session</span>
        <h1>{selected.name}</h1>
        <p>{selected.description}</p>
        <div className="hero-actions">
          <Link
            className="button"
            href={`/detection?mudra=${encodeURIComponent(selected.name)}`}
          >
            Open Live Practice
          </Link>
          <Link
            className="button-secondary"
            href={`/library?mudra=${encodeURIComponent(selected.name)}`}
          >
            Read Full Guide
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="card">
          <h2 className="section-title">How To Practice</h2>
          <ol>
            {selected.howTo.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="section-subtitle">Suggested duration: {selected.duration}</p>
        </article>

        <article className="card">
          <h2 className="section-title">Expected Benefits</h2>
          <ul>
            {selected.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
          <p className="section-subtitle">Difficulty: {selected.difficulty}</p>
        </article>
      </section>
    </div>
  );
}
