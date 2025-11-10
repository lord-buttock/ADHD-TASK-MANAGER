/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Eisenhower Matrix colors
        'urgent-important': '#EF4444',     // Red - Do First
        'urgent-not-important': '#F59E0B', // Orange - Schedule
        'not-urgent-important': '#3B82F6', // Blue - Delegate
        'not-urgent-not-important': '#6B7280', // Gray - Eliminate
      },
    },
  },
  plugins: [],
}
