import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1440px"
      }
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      backgroundImage: {
        "aurora-dark":
          "radial-gradient(circle at top left, rgba(72, 132, 255, 0.28), transparent 28%), radial-gradient(circle at 85% 16%, rgba(38, 230, 196, 0.14), transparent 24%), linear-gradient(180deg, rgba(7, 10, 18, 0.98) 0%, rgba(9, 13, 24, 0.94) 100%)",
        "aurora-light":
          "radial-gradient(circle at top left, rgba(76, 125, 255, 0.18), transparent 30%), radial-gradient(circle at 85% 16%, rgba(32, 217, 184, 0.12), transparent 24%), linear-gradient(180deg, rgba(244, 248, 255, 1) 0%, rgba(237, 244, 255, 1) 100%)",
        "mesh-gradient":
          "linear-gradient(135deg, rgba(64, 116, 255, 0.18), rgba(19, 211, 181, 0.04) 42%, rgba(255,255,255,0) 70%)"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(10, 15, 31, 0.14)",
        glass: "0 20px 80px rgba(15, 20, 35, 0.28)",
        glow: "0 0 0 1px rgba(125, 154, 255, 0.18), 0 24px 64px rgba(38, 102, 255, 0.22)"
      },
      borderRadius: {
        "4xl": "1.75rem"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        pulseGlow: "pulseGlow 6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
