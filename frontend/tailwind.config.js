export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: "var(--bg-main)",
        sidebar: "var(--bg-sidebar)",
        surface: "var(--bg-surface)",
        accent: {
          DEFAULT: "var(--color-accent)",
          soft: "var(--bg-accent-soft)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          soft: "var(--bg-success-soft)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          soft: "var(--bg-warning-soft)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          soft: "var(--bg-danger-soft)",
        },
        text: {
          primary: "var(--text-primary)",
          muted: "var(--text-muted)",
        },
        border: {
          subtle: "var(--border-subtle)",
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
