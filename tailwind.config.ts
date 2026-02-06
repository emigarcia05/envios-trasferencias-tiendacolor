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
        "app-bg": "#0072BB",
        primary: "#0072BB",
        label: "#374151",
        border: "#E2E8F0",
        muted: "#64748B",
      },
    },
  },
  plugins: [],
};
export default config;
