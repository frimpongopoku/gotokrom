/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        paperDim: "rgb(var(--color-paper-dim) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        inkSoft: "rgb(var(--color-ink-soft) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        pine: "rgb(var(--color-pine) / <alpha-value>)",
        pineDark: "rgb(var(--color-pine-dark) / <alpha-value>)",
        yolk: "#E8A93B",
        yolkDark: "rgb(var(--color-yolk-dark) / <alpha-value>)",
        clay: "#C4573B",
        scrim: "rgb(var(--color-scrim) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        paper: "0 1px 2px rgba(31,42,36,0.06), 0 6px 16px -8px rgba(31,42,36,0.18)",
        lift: "0 2px 4px rgba(31,42,36,0.08), 0 12px 24px -10px rgba(31,42,36,0.22)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
