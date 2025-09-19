/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "dark-2": "#1e1e2e",
        "dark-3": "#14141f",
        "sky-1": "#00bcd4",
        "sky-2": "#81d4fa",
        "orange-1": "#ffa500",
        "blue-1": "#3b82f6",
        "purple-1": "#8b5cf6",
        "yellow-1": "#facc15",
      },
      backgroundImage: {
        hero: "url('/images/back2.jpg')",
      },
    },
  },
  plugins: [],
};
