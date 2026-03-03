/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Uses system preference
  theme: {
    extend: {
      colors: {
        // Todoist-inspired color palette
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc4c3e', // Todoist red
          600: '#c53727',
          700: '#a32d20',
          800: '#87251a',
          900: '#6f2017',
        },
        // Course colors for calendar
        course: {
          red: '#dc4c3e',
          orange: '#ff9933',
          yellow: '#ffd43b',
          green: '#299438',
          teal: '#158fad',
          blue: '#4073ff',
          purple: '#884dff',
          pink: '#eb96eb',
          gray: '#808080',
        },
        // UI colors
        surface: {
          light: '#ffffff',
          dark: '#1e1e1e',
        },
        sidebar: {
          light: '#fafafa',
          dark: '#282828',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
