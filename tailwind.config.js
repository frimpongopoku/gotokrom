/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF6EC",
        paperDim: "#F1EBDB",
        ink: "#1F2A24",
        inkSoft: "#4B564E",
        pine: "#2F6E52",
        pineDark: "#204C3A",
        yolk: "#E8A93B",
        yolkDark: "#C98A1E",
        clay: "#C4573B",
        mist: "#D8D2C2",
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
