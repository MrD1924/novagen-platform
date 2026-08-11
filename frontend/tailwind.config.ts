import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0A1628",
          900: "#0B3D91",
          800: "#123B7A",
          700: "#1B4B94",
        },
        emerald: {
          600: "#059669",
          500: "#10B981",
          400: "#34D399",
        },
        // Dark theme: surface tokens now describe elevation on a dark base
        // (surface.gray = page background, surface.white = elevated card
        // surface, i.e. "the lightest thing you'd naturally reach for" in
        // each theme) rather than literal light/white colors. Every
        // component already composes these tokens rather than raw
        // Tailwind grays, so redefining them here re-themes the whole app.
        surface: {
          white: "#101F38",
          gray: "#0A1628",
          border: "#233350",
        },
        ink: {
          900: "#F1F5F9",
          700: "#C3D0E0",
          500: "#8FA0B3",
          300: "#54677E",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(#E3E8EF 1px, transparent 1px), linear-gradient(90deg, #E3E8EF 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        scanline: "scanline 3.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 40s linear infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
