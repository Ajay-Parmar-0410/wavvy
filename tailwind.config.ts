import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0A0A0F",
          secondary: "#12121A",
          tertiary: "#1A1A26",
        },
        accent: {
          primary: "#1DF27E",
          secondary: "#6366F1",
        },
        text: {
          primary: "#F0F0F5",
          secondary: "#8888A0",
          muted: "#555566",
        },
        border: "#2A2A3A",
        danger: "#FF4466",
      },
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      width: {
        sidebar: "280px",
      },
    },
  },
  plugins: [],
};
export default config;
