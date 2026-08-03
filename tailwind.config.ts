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
          subtle: "#9CA3AF",
        },

        /**
         * Tokens semanticos de estado.
         *
         * Antes cada banner/alerta elegia su propio tono: convivian 4 rojos
         * distintos para "error" y 3 verdes para "exito" repartidos en ~60
         * sitios. Estos tokens dan un unico origen de verdad.
         *
         * Escala por estado:
         *   DEFAULT -> texto legible sobre fondo claro   (text-danger)
         *   subtle  -> fondo de banner                    (bg-danger-subtle)
         *   muted   -> fondo de chip/badge                (bg-danger-muted)
         *   border  -> borde de banner                    (border-danger-border)
         *   icon    -> color de icono                     (text-danger-icon)
         *
         * Los valores replican la paleta Tailwind que ya estaba en uso, asi
         * que migrar a estos tokens no cambia un solo pixel.
         */
        success: {
          DEFAULT: "#15803D", // green-700
          subtle: "#F0FDF4",  // green-50
          muted: "#DCFCE7",   // green-100
          border: "#BBF7D0",  // green-200
          icon: "#22C55E",    // green-500
        },
        danger: {
          DEFAULT: "#B91C1C", // red-700
          subtle: "#FEF2F2",  // red-50
          muted: "#FEE2E2",   // red-100
          border: "#FECACA",  // red-200
          icon: "#EF4444",    // red-500
        },
        warning: {
          DEFAULT: "#B45309", // amber-700
          subtle: "#FFFBEB",  // amber-50
          muted: "#FEF3C7",   // amber-100
          border: "#FDE68A",  // amber-200
          icon: "#F59E0B",    // amber-500
        },
        info: {
          DEFAULT: "#1E40AF", // blue-800
          subtle: "#EFF6FF",  // blue-50
          muted: "#DBEAFE",   // blue-100
          border: "#BFDBFE",  // blue-200
          icon: "#3B82F6",    // blue-500
        },
      },
      boxShadow: {
        "glow-accent": "0 0 20px rgba(157, 1, 42, 0.3)",
        "dark-md": "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
        "dark-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
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
      },
    },
  },
  plugins: [],
} satisfies Config;
