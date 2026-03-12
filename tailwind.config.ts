import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sea-blue primary — Optro-inspired enterprise palette
        primary: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#b9dfff",
          300: "#7ac5ff",
          400: "#36a9f7",
          500: "#0b8de8",
          600: "#0070c7",
          700: "#005aa1",
          800: "#044d85",
          900: "#0a3f6e",
          950: "#062849",
        },
        // Citron accent — used sparingly for highlights & indicators
        accent: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
        },
        // Surface tokens
        surface: {
          DEFAULT: "#f8f9fb",   // off-white page bg
          card: "#ffffff",
          muted: "#f1f3f7",
          hover: "#f4f5f9",
        },
      },
      borderRadius: {
        card: "0.875rem",     // 14px — default card radius
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
        card: "0 2px 8px -2px rgb(0 0 0 / 0.06), 0 1px 3px -1px rgb(0 0 0 / 0.04)",
        "card-hover": "0 4px 12px -4px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
