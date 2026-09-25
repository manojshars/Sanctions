import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        navy: { DEFAULT: "#0B1426", 900: "#070D19", 800: "#0B1426", 700: "#12203A", 600: "#193B68", 500: "#24508A" },
        gold: { DEFAULT: "#D6B66B", 50: "#FBF7EC", 100: "#F5ECD2", 200: "#EBD9A6", 300: "#E1C788", 400: "#D6B66B", 500: "#C49F48", 600: "#A07F33", 700: "#7A6127" },
        slate: { 450: "#7B8599" },
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        brand: "rgb(var(--brand) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["'Inter Variable'", "Inter", "system-ui", "sans-serif"],
        display: ["'Manrope Variable'", "Manrope", "'Inter Variable'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(11 20 38 / 0.04), 0 1px 3px rgb(11 20 38 / 0.06)",
        lift: "0 10px 30px -12px rgb(11 20 38 / 0.18)",
        glow: "0 0 0 1px rgb(214 182 107 / 0.35), 0 12px 32px -12px rgb(214 182 107 / 0.35)",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.125rem" },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        drift: { "0%,100%": { transform: "translate3d(0,0,0)" }, "50%": { transform: "translate3d(0,-10px,0)" } },
        "pulse-line": { "0%": { strokeDashoffset: "400" }, "100%": { strokeDashoffset: "0" } },
      },
      animation: {
        "fade-up": "fade-up .45s ease-out both",
        drift: "drift 9s ease-in-out infinite",
        "pulse-line": "pulse-line 6s linear infinite",
      },
    },
  },
  plugins: [typography],
};

export default config;
