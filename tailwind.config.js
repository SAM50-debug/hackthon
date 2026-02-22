/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sv: {
          bg: "var(--sv-bg)",
          surface: "var(--sv-surface)",
          elev: "var(--sv-elev)",
          text: "var(--sv-text)",
          muted: "var(--sv-muted)",
          border: "var(--sv-border)",
          accent: "var(--sv-accent)",
          accent2: "var(--sv-accent2)",
          success: "var(--sv-success)",
          warn: "var(--sv-warn)",
          danger: "var(--sv-danger)",
        },
      },
    },
  },
  plugins: [],
};
