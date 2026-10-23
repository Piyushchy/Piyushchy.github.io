/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0a1317", 2: "#101c22", 3: "#16262d" },
        paper: { DEFAULT: "#e6eeee", dim: "#a3b3b8", faint: "#8a9ca1" },
        signal: { DEFAULT: "#7fd6e6", deep: "#5bbccf" },
        primary: "rgb(230 238 238 / <alpha-value>)",
        rule: "rgba(230, 238, 238, 0.14)",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      maxWidth: { page: "76rem" },
      transitionTimingFunction: { out: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [],
};
