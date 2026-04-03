/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cosmic-blue': '#1a1a2e',
        'cosmic-purple': '#16213e',
        'neon-blue': '#00d4ff',
        'neon-purple': '#b347ea',
      },
      fontFamily: {
        'futuristic': ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
