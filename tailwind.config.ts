import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#F5F7FB",
        "deep-green": "#2F6BFF",
        emerald: "#27C281",
        tangerine: "#FF7A3D",
        "warm-ivory": "#0B1020",
        "soft-surface": "#182235",
        paper: "#111827",
        "muted-text": "#9AA7B8",
        border: "#28354A",
        status: {
          proven: "#27C281",
          partial: "#F2B84B",
          claimed: "#F05D5E",
          error: "#F05D5E",
        },
      },
      fontFamily: {
        heading: ["var(--font-manrope)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "14px",
        sm: "10px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.24)",
        card: "0 12px 32px 0 rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;