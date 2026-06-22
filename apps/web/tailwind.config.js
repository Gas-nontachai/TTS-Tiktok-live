/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: "#7B8B75",
          soft: "#A6BE9E"
        },
        danger: "#E63946",
        surface: "#F6F0E6",
        surfaceMuted: "#D9CBB9",
        text: "#2F352E",
        textMuted: "#6F756A",
        border: "#D9CBB9"
      }
    }
  },
  plugins: []
};

