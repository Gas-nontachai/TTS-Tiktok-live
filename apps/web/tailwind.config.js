/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: "#7B8B75",
          soft: "#A6BE9E"
        },
        danger: "#E63946",
        surface: "#F6F0E6",
        surfaceMuted: "#D9CBB9",
        text: "#2F352E",
        textMuted: "#6F756A",
        border: "#D9CBB9"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "page-enter": {
          from: { opacity: "0", transform: "translateY(5px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "panel-enter": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "sidebar-enter": {
          from: { opacity: "0", transform: "translateX(-14px)" },
          to: { opacity: "1", transform: "translateX(0)" }
        },
        "sidebar-toggle": {
          "0%": { opacity: "0", transform: "translateX(-8px) scale(0.94)" },
          "70%": { opacity: "1", transform: "translateX(1px) scale(1.03)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" }
        },
        "dialog-enter": {
          from: { opacity: "0", transform: "translateY(10px) scale(0.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        "toast-enter": {
          from: { opacity: "0", transform: "translateY(-10px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        "tab-content-enter": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "alert-pop": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "slide-left": {
          from: { opacity: "0", transform: "translateX(28px)" },
          to: { opacity: "1", transform: "translateX(0)" }
        },
        "slide-right": {
          from: { opacity: "0", transform: "translateX(-28px)" },
          to: { opacity: "1", transform: "translateX(0)" }
        },
        "stack-pop": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.92)" },
          "70%": { opacity: "1", transform: "translateY(0) scale(1.03)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        "soft-drop": {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "alert-bounce": {
          "0%": { opacity: "0", transform: "translateY(24px) scale(0.9)" },
          "60%": { opacity: "1", transform: "translateY(-8px) scale(1.04)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        "alert-zoom": {
          from: { opacity: "0", transform: "scale(0.72)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        "alert-flip": {
          from: { opacity: "0", transform: "perspective(700px) rotateX(72deg)" },
          to: { opacity: "1", transform: "perspective(700px) rotateX(0)" }
        },
        "alert-glow-pulse": {
          "0%": { opacity: "0", transform: "scale(0.96)", filter: "drop-shadow(0 0 0 rgba(121,224,212,0))" },
          "55%": { opacity: "1", transform: "scale(1.02)", filter: "drop-shadow(0 0 24px rgba(121,224,212,0.55))" },
          "100%": { opacity: "1", transform: "scale(1)", filter: "drop-shadow(0 0 10px rgba(121,224,212,0.22))" }
        },
        "viewer-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" }
        },
        "float-heart": {
          from: { opacity: "0", transform: "translateY(0) scale(0.8)" },
          "15%": { opacity: "1" },
          to: { opacity: "0", transform: "translateY(-220px) translateX(-28px) scale(1.25)" }
        },
        "heart-burst": {
          "0%": { opacity: "0", transform: "translateY(0) scale(0.6) rotate(0deg)" },
          "15%": { opacity: "1" },
          "70%": { opacity: "1", transform: "translateY(-150px) translateX(-44px) scale(1.25) rotate(-12deg)" },
          "100%": { opacity: "0", transform: "translateY(-220px) translateX(18px) scale(0.9) rotate(18deg)" }
        },
        "heart-spiral": {
          "0%": { opacity: "0", transform: "translate(0,0) scale(0.7) rotate(0deg)" },
          "15%": { opacity: "1" },
          "50%": { opacity: "1", transform: "translate(-54px,-120px) scale(1.15) rotate(180deg)" },
          "100%": { opacity: "0", transform: "translate(20px,-240px) scale(0.8) rotate(360deg)" }
        },
        "heart-side-float": {
          "0%": { opacity: "0", transform: "translateX(0) translateY(0) scale(0.75)" },
          "15%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateX(-160px) translateY(-90px) scale(1.15)" }
        },
        "heart-confetti": {
          "0%": { opacity: "0", transform: "translateY(0) translateX(0) rotate(0deg) scale(0.6)" },
          "20%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-260px) translateX(-90px) rotate(95deg) scale(0.95)" }
        }
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out both",
        "page-enter": "page-enter 180ms ease-out both",
        "panel-enter": "panel-enter 180ms ease-out both",
        "sidebar-enter": "sidebar-enter 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "sidebar-toggle": "sidebar-toggle 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "dialog-overlay": "fade-in 180ms ease-out both",
        "dialog-enter": "dialog-enter 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "toast-enter": "toast-enter 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "tab-content-enter": "tab-content-enter 160ms ease-out both",
        "alert-pop": "alert-pop 300ms ease-out both",
        "slide-up": "slide-up 300ms ease-out both",
        "slide-left": "slide-left 300ms ease-out both",
        "slide-right": "slide-right 300ms ease-out both",
        "stack-pop": "stack-pop 320ms ease-out both",
        "soft-drop": "soft-drop 360ms ease-out both",
        "alert-bounce": "alert-bounce 300ms cubic-bezier(0.22, 1.2, 0.36, 1) both",
        "alert-zoom": "alert-zoom 300ms ease-out both",
        "alert-flip": "alert-flip 300ms ease-out both",
        "alert-glow-pulse": "alert-glow-pulse 300ms ease-out both",
        "viewer-pulse": "viewer-pulse 1400ms ease-in-out infinite",
        "count-pop": "stack-pop 420ms ease-out both",
        "float-heart": "float-heart 1800ms ease-out both",
        "heart-burst": "heart-burst 1800ms ease-out both",
        "heart-spiral": "heart-spiral 1800ms ease-out both",
        "heart-side-float": "heart-side-float 1800ms ease-out both",
        "heart-confetti": "heart-confetti 1800ms ease-out both"
      }
    }
  },
  plugins: []
};

