import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        eb: {
          page: "#FAFAF8",
          panel: "#0F1117",
          primary: "#2563EB",
          success: "#16A34A",
          google: "#EF4444",
          text: "#0F1117",
          secondary: "#6B7280",
          muted: "#9CA3AF",
          input: "#D1D5DB",
          layout: "#E5E7EB"
        }
      },
      borderRadius: {
        eb: "4px",
        "eb-card": "12px"
      },
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        logo: ['"DM Serif Display"', "serif"]
      }
    }
  },
  plugins: []
} satisfies Config;

