import { getMudraLibrary } from "../../lib/mudra";

const library = getMudraLibrary();

export default function LibraryPage() {
  return (
    <div className="page-grid">
      <section>
        <h1 className="section-title">Mudra Library</h1>
        <p className="section-subtitle">Descriptions, benefits, difficulty, and how to perform each mudra.</p>
      </section>

      <section className="library-grid">
        {library.map((mudra) => (
          <article className="library-card" key={mudra.id}>
            <header>
              <div>
                <span className="pill">{mudra.icon} {mudra.name}</span>
                <p className="meta">{mudra.description}</p>
              </div>
              <strong>{mudra.difficulty}</strong>
            </header>
            <p className="meta">Practice time: {mudra.duration}</p>
            <h3>Benefits</h3>
            <ul>
              {mudra.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <h3>How to practice</h3>
            <ol>
              {mudra.howTo.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <h3>Original Reference Distances</h3>
            <ul>
              {mudra.referenceMeasurements.distances.map((distance) => (
                <li key={distance.label}>
                  {distance.label}: {distance.value.toFixed(2)} {distance.unit}
                </li>
              ))}
            </ul>
            <h3>Original Reference Angles</h3>
            <ul>
              {mudra.referenceMeasurements.angles.map((angle) => (
                <li key={angle.label}>
                  The angle between {angle.label} fingers is {angle.value} {angle.unit}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
