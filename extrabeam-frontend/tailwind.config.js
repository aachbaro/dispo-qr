// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx,html,css}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      screens: {
        landscape: { raw: "(orientation: landscape)" },
      },
      colors: {
        background: "#FFFFFF",
        foreground: "#000000",
        primary: "#00FF99",
      },
      transitionDuration: {
        2000: "2000ms",
        5000: "5000ms",
      },
    },
  },
  plugins: [],
};
