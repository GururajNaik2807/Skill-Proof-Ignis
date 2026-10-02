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
        ink: "#17201C",
        "deep-green": "#1F5C48",
        emerald: "#2E8B6F",
        "warm-ivory": "#F7F5EF",
        "soft-surface": "#EEECE5",
        "muted-text": "#69716C",
        border: "#D9DDD7",
        status: {
          proven: "#2E8B6F",
          partial: "#C58A24",
          claimed: "#8A6255",
          error: "#B94A48",
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
        subtle: "0 1px 3px 0 rgba(23, 32, 28, 0.05)",
        card: "0 4px 12px 0 rgba(23, 32, 28, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;