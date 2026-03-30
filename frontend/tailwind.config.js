/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blurple: "#5865F2",
        dark: {
          900: "#090a0b",
          800: "#18191c",
          700: "#1e1f22",
          600: "#2b2d31",
          500: "#313338",
          400: "#383a40",
        },
        text: {
          primary: "#ffffff",
          secondary: "#b5bac1",
          muted: "#949ba4",
        }
      },
    },
  },
  plugins: [],
}
