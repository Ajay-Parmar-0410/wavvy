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
        // Spotify-parity palette (plan2 §3.8).
        bg: {
          root: "#000000",
          primary: "#000000",
          secondary: "#121212",
          tertiary: "#181818",
          hover: "#282828",
          pressed: "#3E3E3E",
          elevated: "#1A1A1A",
        },
        accent: {
          primary: "#1ED760",
          hover: "#1FDF64",
          secondary: "#6366F1",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
          muted: "#7A7A7A",
        },
        border: "#2A2A2A",
        danger: "#FF4466",
      },
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      width: {
        sidebar: "320px",
        "right-panel": "360px",
      },
      borderRadius: {
        card: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
