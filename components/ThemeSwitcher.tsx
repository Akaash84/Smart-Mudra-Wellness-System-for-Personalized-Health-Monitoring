"use client";

import { useEffect, useState } from "react";

type ThemeMode = "auto" | "aurora" | "twilight";

const STORAGE_KEY = "mudrahealth.theme-mode";

function resolveTheme(mode: ThemeMode): "aurora" | "twilight" {
  if (mode === "aurora" || mode === "twilight") {
    return mode;
  }

  const hour = new Date().getHours();
  return hour >= 18 || hour < 6 ? "twilight" : "aurora";
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const theme = resolveTheme(mode);
  document.body.dataset.theme = theme;
}

export function ThemeSwitcher() {
  const [mode, setMode] = useState<ThemeMode>("auto");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const nextMode: ThemeMode =
      saved === "aurora" || saved === "twilight" || saved === "auto" ? saved : "auto";

    setMode(nextMode);
  }, []);

  useEffect(() => {
    applyTheme(mode);

    if (mode !== "auto") {
      return;
    }

    const timer = window.setInterval(() => {
      applyTheme("auto");
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, [mode]);

  function changeMode(nextMode: ThemeMode) {
    setMode(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    applyTheme(nextMode);
  }

  return (
    <div className="theme-switch" aria-label="Theme mode switcher">
      <button
        type="button"
        className={`theme-chip ${mode === "auto" ? "active" : ""}`}
        onClick={() => changeMode("auto")}
      >
        Auto
      </button>
      <button
        type="button"
        className={`theme-chip ${mode === "aurora" ? "active" : ""}`}
        onClick={() => changeMode("aurora")}
      >
        Aurora
      </button>
      <button
        type="button"
        className={`theme-chip ${mode === "twilight" ? "active" : ""}`}
        onClick={() => changeMode("twilight")}
      >
        Twilight
      </button>
    </div>
  );
}
