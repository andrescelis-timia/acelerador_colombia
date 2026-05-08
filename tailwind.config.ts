import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // TIMIA Design System
        timia: {
          black: "#000000",
          surface: "#0A0A0F",
          elevated: "#141419",
          accent: {
            DEFAULT: "#9D012A",
            hover: "#B8013A",
            light: "rgba(157, 1, 42, 0.15)",
          },
          blue: {
            DEFAULT: "#2E5BFF",
            light: "rgba(46, 91, 255, 0.15)",
          },
          border: "rgba(255, 255, 255, 0.08)",
          "border-strong": "rgba(255, 255, 255, 0.15)",
          muted: "#6B7280",
          subtle: "#9CA3AF",
        },
      },
      boxShadow: {
        "glow-accent": "0 0 20px rgba(157, 1, 42, 0.3)",
        "glow-blue": "0 0 20px rgba(46, 91, 255, 0.3)",
        "glow-accent-lg": "0 0 40px rgba(157, 1, 42, 0.2)",
        "glow-blue-lg": "0 0 40px rgba(46, 91, 255, 0.2)",
        "dark-sm": "0 1px 2px rgba(0, 0, 0, 0.3)",
        "dark-md": "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
        "dark-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        "timia-gradient": "linear-gradient(135deg, #9D012A 0%, #2E5BFF 100%)",
        "timia-gradient-subtle": "linear-gradient(135deg, rgba(157,1,42,0.1) 0%, rgba(46,91,255,0.1) 100%)",
        "timia-radial": "radial-gradient(ellipse at 20% 50%, rgba(157,1,42,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(46,91,255,0.1) 0%, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(157, 1, 42, 0.2)" },
          "50%": { boxShadow: "0 0 25px rgba(157, 1, 42, 0.4)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
