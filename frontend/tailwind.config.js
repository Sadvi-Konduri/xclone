import daisyui from "daisyui";
import daisyUIThemes from "daisyui/src/theming/themes";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],

  daisyui: {
    themes: [
      "light", // default light theme
      "dark", // default dark theme from daisyUI
      {
        bright: {
          ...daisyUIThemes["light"],
          primary: "#00bfff", // A bright cyan primary color
          secondary: "#f5f5f5", // Bright secondary background
          accent: "#ffd700", // A bright accent (gold)
          neutral: "#ffffff", // Bright neutral color
          "base-100": "#fafafa", // Light background base
          "base-content": "#000000", // Dark text on light backgrounds
        },
      },
    ],
  },
};