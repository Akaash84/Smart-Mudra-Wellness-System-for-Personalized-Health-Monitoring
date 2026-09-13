import { generateAchievements, generateMetrics } from "../../lib/mudra";

const user = {
  name: "Demo User",
  email: "demo@mudrahealth.app",
  goal: "Stress relief",
  age: 28,
};

const metrics = generateMetrics("mudrahealth-profile");
const achievements = generateAchievements("mudrahealth-profile");

export default function ProfilePage() {
  return (
    <div className="profile-grid">
      <section className="profile-card">
        <h1 className="section-title">Profile</h1>
        <p className="section-subtitle">User details, preferences, and activity tracking.</p>
        <div className="list" style={{ marginTop: 18 }}>
          <div className="list-item"><strong>Name</strong><span>{user.name}</span></div>
          <div className="list-item"><strong>Email</strong><span>{user.email}</span></div>
          <div className="list-item"><strong>Goal</strong><span>{user.goal}</span></div>
          <div className="list-item"><strong>Age</strong><span>{user.age}</span></div>
        </div>
      </section>

      <div className="panel-stack">
        <section className="profile-card">
          <h2 className="section-title">Achievements</h2>
          <div className="list" style={{ marginTop: 16 }}>
            {achievements.map((achievement) => (
              <div className="list-item" key={achievement.name}>
                <div>
                  <strong>{achievement.name}</strong>
                  <div className="meta">{achievement.description}</div>
                </div>
                <strong>{achievement.unlocked ? "Unlocked" : "Locked"}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="profile-card">
          <h2 className="section-title">Activity Tracking</h2>
          <div className="list" style={{ marginTop: 16 }}>
            <div className="list-item"><strong>Heart rate</strong><span>{metrics.heartRate} bpm</span></div>
            <div className="list-item"><strong>SpO2</strong><span>{metrics.spo2}%</span></div>
            <div className="list-item"><strong>Stress</strong><span>{metrics.stress}%</span></div>
            <div className="list-item"><strong>Activity</strong><span>{metrics.activity}%</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}
