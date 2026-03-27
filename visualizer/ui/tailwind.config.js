/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#faf9f7",
          100: "#f7f6f3",
          200: "#ece9e4",
          300: "#d6d3cd",
        },
        severity: {
          healthy: "#22c55e",
          degraded: "#f59e0b",
          critical: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "display": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-sm": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "stat": ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "stat-sm": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        "card-hover": "0 8px 30px rgba(0,0,0,0.06)",
        "pill": "0 1px 2px rgba(0,0,0,0.05)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      gridTemplateColumns: {
        "dashboard": "5fr 3fr 4fr",
      },
      gridTemplateRows: {
        "dashboard": "1fr auto 0.7fr",
      },
    },
  },
  plugins: [],
};
