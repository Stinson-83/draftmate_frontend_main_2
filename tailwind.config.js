/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Keeping these just in case your Vite structure uses them outside of src/
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E3A5F",
          900: "#1E3A8A",
        },
        ink: {
          DEFAULT: "#0F1C2E",
          light:   "#1E3A5F",
          muted:   "#475569",
          faint:   "#94A3B8",
        },
        paper: {
          DEFAULT: "#F8FAFF",
          50:      "#FFFFFF",
          100:     "#F1F5F9",
          200:     "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "marquee-left":    "marqueeLeft 35s linear infinite",
        "marquee-right":   "marqueeRight 38s linear infinite",
        "marquee-x-left":  "marqueeXLeft 40s linear infinite",
        "marquee-x-right": "marqueeXRight 44s linear infinite",
        float:             "float 7s ease-in-out infinite",
        "float-2":         "float 7s ease-in-out 2s infinite",
        "float-3":         "float 7s ease-in-out 3.5s infinite",
        "float-4":         "float 7s ease-in-out 5s infinite",
        shimmer:           "shimmer 2.5s linear infinite",
        "fade-up":         "fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards",
        "bg-breath":       "bgImageBreath 12s ease-in-out infinite",
        "feather-glow":    "featherGlow 3s ease-in-out infinite",
        "light-leak":      "lightLeak 5s ease-in-out infinite",
        "scan-line":       "scanLine 4s linear infinite",
        "writing-beam":    "writingBeam 3s ease-in-out infinite",
        "pulse-ring":      "pulseRing 3s ease-out infinite",
        "particle-drift":  "particleDrift 5s ease-in-out infinite",
      },
      keyframes: {
        marqueeLeft:    { "0%": { transform: "translateX(0)" },    "100%": { transform: "translateX(-50%)" } },
        marqueeRight:   { "0%": { transform: "translateX(-50%)" }, "100%": { transform: "translateX(0)" } },
        marqueeXLeft:   { "0%": { transform: "translateX(0)" },    "100%": { transform: "translateX(-50%)" } },
        marqueeXRight:  { "0%": { transform: "translateX(-50%)" }, "100%": { transform: "translateX(0)" } },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "30%":      { transform: "translateY(-12px) rotate(0.8deg)" },
          "70%":      { transform: "translateY(-6px) rotate(-0.5deg)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        bgImageBreath: {
          "0%, 100%": { transform: "scale(1) translateX(0px) translateY(0px)" },
          "33%":      { transform: "scale(1.02) translateX(-4px) translateY(-3px)" },
          "66%":      { transform: "scale(1.01) translateX(3px) translateY(-5px)" },
        },
        featherGlow: {
          "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(96,165,250,0.4)) brightness(1)" },
          "50%":      { filter: "drop-shadow(0 0 20px rgba(96,165,250,0.8)) brightness(1.1)" },
        },
        lightLeak: {
          "0%, 100%": { opacity: "0.6", transform: "translateX(0) scaleX(1)" },
          "50%":      { opacity: "1",   transform: "translateX(8px) scaleX(1.1)" },
        },
        scanLine: {
          "0%":   { transform: "translateY(-100%)", opacity: "0" },
          "10%":  { opacity: "0.5" },
          "90%":  { opacity: "0.5" },
          "100%": { transform: "translateY(400%)", opacity: "0" },
        },
        writingBeam: {
          "0%":   { opacity: "0.4", transform: "scaleX(1) translateY(0)" },
          "50%":  { opacity: "1",   transform: "scaleX(1.08) translateY(-2px)" },
          "100%": { opacity: "0.4", transform: "scaleX(1) translateY(0)" },
        },
        pulseRing: {
          "0%":   { transform: "scale(1)",   opacity: "0.6" },
          "70%":  { transform: "scale(1.7)", opacity: "0" },
          "100%": { transform: "scale(1)",   opacity: "0" },
        },
        particleDrift: {
          "0%":   { transform: "translateY(0) translateX(0) scale(1)",     opacity: "0.6" },
          "33%":  { transform: "translateY(-18px) translateX(6px) scale(1.2)", opacity: "1" },
          "66%":  { transform: "translateY(-10px) translateX(-4px) scale(0.9)", opacity: "0.8" },
          "100%": { transform: "translateY(0) translateX(0) scale(1)",     opacity: "0.6" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};