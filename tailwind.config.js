/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        space: {
          950: "#05020C",
          900: "#100A1F",
        },
        pulse: {
          violet: "#A855F7",
          magenta: "#D946EF",
          green: "#78DDB3",
          amber: "#F59E0B",
          red: "#EF4444",
          "text-dim": "rgba(245, 240, 255, 0.60)",
          "text-faint": "rgba(245, 240, 255, 0.38)",
        },
      },
      borderRadius: {
        card: "24px",
        capsule: "9999px",
      },
      boxShadow: {
        "plasma-soft": "0 0 24px -8px rgba(168, 85, 247, 0.42)",
        "plasma-active": "0 0 28px -6px rgba(168, 85, 247, 0.58)",
      },
      keyframes: {
        "alert-pulse": {
          "0%, 100%": { borderColor: "rgba(239, 68, 68, 0.38)" },
          "50%": { borderColor: "rgba(239, 68, 68, 0.82)" },
        },
      },
      animation: {
        "alert-pulse": "alert-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
