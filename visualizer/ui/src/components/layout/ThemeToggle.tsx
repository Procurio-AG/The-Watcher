"use client";

import { useEffect, useState } from "react";

type ThemeMode = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "watcher-theme-mode";

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "light" || mode === "dark") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initialMode: ThemeMode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setMode(initialMode);
    document.documentElement.setAttribute("data-theme", resolveTheme(initialMode));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) as ThemeMode | null) !== "system") return;
      document.documentElement.setAttribute("data-theme", media.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setThemeMode = (nextMode: ThemeMode) => {
    setMode(nextMode);
    localStorage.setItem(STORAGE_KEY, nextMode);
    document.documentElement.setAttribute("data-theme", resolveTheme(nextMode));
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Theme mode">
      <button
        type="button"
        onClick={() => setThemeMode("system")}
        aria-pressed={mode === "system"}
        className={`theme-toggle-btn ${mode === "system" ? "theme-toggle-btn-active" : ""}`}
      >
        Auto
      </button>
      <button
        type="button"
        onClick={() => setThemeMode("light")}
        aria-pressed={mode === "light"}
        className={`theme-toggle-btn ${mode === "light" ? "theme-toggle-btn-active" : ""}`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => setThemeMode("dark")}
        aria-pressed={mode === "dark"}
        className={`theme-toggle-btn ${mode === "dark" ? "theme-toggle-btn-active" : ""}`}
      >
        Dark
      </button>
    </div>
  );
}
