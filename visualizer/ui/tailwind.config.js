/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#fbfaf8",
          100: "#f7f5f2",
          200: "#ebe8e2",
          300: "#d7d2ca",
        },
        severity: {
          healthy: "#57ba77",
          degraded: "#dfbf55",
          critical: "#da6a71",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "display": ["3rem", { lineHeight: "1.02", letterSpacing: "-0.045em", fontWeight: "600" }],
        "display-sm": ["2rem", { lineHeight: "1.06", letterSpacing: "-0.035em", fontWeight: "600" }],
        "stat": ["2.35rem", { lineHeight: "1.02", letterSpacing: "-0.045em", fontWeight: "600" }],
        "stat-sm": ["1.65rem", { lineHeight: "1.06", letterSpacing: "-0.03em", fontWeight: "600" }],
      },
      boxShadow: {
        "card": "0 16px 34px rgba(120,112,100,0.08)",
        "card-hover": "0 20px 40px rgba(120,112,100,0.11)",
        "pill": "0 1px 2px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        "2xl": "18px",
        "3xl": "24px",
        "4xl": "28px",
      },
    },
  },
  plugins: [],
};
