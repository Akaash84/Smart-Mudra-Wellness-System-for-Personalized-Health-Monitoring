"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "", age: "28", goal: "Stress relief" });
  const [message, setMessage] = useState("Fill the form to create your wellness profile.");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("Working...");

    const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, age: Number(form.age) }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "Authentication failed.");
      return;
    }

    localStorage.setItem("mudrahealth-user", JSON.stringify(data.user));
    setMessage(`${mode === "signup" ? "Profile created" : "Welcome back"}. Redirecting to dashboard...`);
    router.push("/dashboard");
  }

  return (
    <div className="auth-shell">
      <section className="hero">
        <span className="pill">Authentication</span>
        <h1>{mode === "signup" ? "Create your wellness profile" : "Welcome back"}</h1>
        <p>
          Store your profile, wellness goal, and age so the recommendation engine can personalize mudra guidance.
        </p>
        <div className="hero-actions">
          <button type="button" className="button-secondary" onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className="button" onClick={() => setMode("signup")}>
            Signup
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">{mode === "signup" ? "Signup" : "Login"}</h2>
        <p className="section-subtitle">{message}</p>
        <form className="form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label className="field">
              Name
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
          )}
          <label className="field">
            Email
            <input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="field">
            Password
            <input type="password" minLength={4} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>
          {mode === "signup" && (
            <>
              <label className="field">
                Age
                <input type="number" min={1} value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
              </label>
              <label className="field">
                Primary goal
                <select value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })}>
                  <option>Stress relief</option>
                  <option>Focus</option>
                  <option>Energy</option>
                </select>
              </label>
            </>
          )}
          <button className="button" disabled={loading} type="submit">
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Login"}
          </button>
        </form>
        <p className="helper">Profiles are stored in a local JSON file for demo purposes.</p>
      </section>
    </div>
  );
}
