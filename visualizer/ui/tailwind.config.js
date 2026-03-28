/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        glass: {
          50: "rgba(255,255,255,0.95)",
          100: "rgba(255,255,255,0.85)",
          200: "rgba(255,255,255,0.7)",
          300: "rgba(255,255,255,0.52)",
          400: "rgba(255,255,255,0.35)",
        },
        violet: {
          50: "#f5edff",
          100: "#e8d6ff",
          200: "#c9a0ff",
          300: "#a96aff",
          400: "#9945FF",
          500: "#7201FF",
          600: "#5a00cc",
          700: "#420099",
        },
        neon: {
          300: "#b8ff66",
          400: "#8FFE01",
          500: "#7ae000",
        },
        surface: {
          50: "#f8f8fa",
          100: "#f0f0f4",
          200: "#e8e8ee",
          300: "#dcdce4",
          400: "#D3D3D3",
        },
        ink: {
          50: "#999999",
          100: "#777777",
          200: "#555555",
          300: "#333333",
          400: "#1a1a1a",
          500: "#000000",
        },
        severity: {
          healthy: "#22c55e",
          degraded: "#f59e0b",
          critical: "#ef4444",
        },
      },
      fontFamily: {
        sans: ['"Urbanist"', "system-ui", "-apple-system", "sans-serif"],
        display: ['"Urbanist"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        hero: ["3.2rem", { lineHeight: "1", letterSpacing: "-0.04em", fontWeight: "800" }],
        display: ["2.6rem", { lineHeight: "1.02", letterSpacing: "-0.04em", fontWeight: "700" }],
        "display-sm": ["1.8rem", { lineHeight: "1.06", letterSpacing: "-0.03em", fontWeight: "600" }],
        stat: ["2.4rem", { lineHeight: "1", letterSpacing: "-0.05em", fontWeight: "800" }],
        "stat-sm": ["1.5rem", { lineHeight: "1.06", letterSpacing: "-0.03em", fontWeight: "700" }],
      },
      boxShadow: {
        glass: "0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)",
        "glass-hover": "0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        "glass-strong": "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
        pill: "0 1px 4px rgba(0,0,0,0.04)",
        glow: "0 0 24px rgba(114,1,255,0.15)",
        "neon-glow": "0 0 16px rgba(143,254,1,0.3)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
    },
  },
  plugins: [],
};
