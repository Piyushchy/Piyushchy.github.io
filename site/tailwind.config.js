/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0c0d10", 2: "#111317", 3: "#171a1f" },
        paper: { DEFAULT: "#ece7dc", dim: "#a9a597", faint: "#8d897d" },
        signal: { DEFAULT: "#ff6a3d", deep: "#d94e24" },
        rule: "rgba(236, 231, 220, 0.14)",
      },
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      maxWidth: { page: "76rem" },
      transitionTimingFunction: { out: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [],
};
