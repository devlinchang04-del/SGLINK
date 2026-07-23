import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce8ff",
          500: "#3b6ef6",
          600: "#2952d4",
          700: "#1f3fa8",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
