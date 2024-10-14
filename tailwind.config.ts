import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/primereact/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        pink: "#FFC3FE",
        purple: "#9883FD",
        lightPurple: "#E9E0FF",
        darkPurple:"#6557A6",
        skyBlue: "#B5F5FC",
        black: "#000000",
      },
      fontFamily: {
        Loubag: ['LoubagBold', 'sans-serif'],
        Poppins: ['Poppins', 'sans-serif']
      },
    },
  },
  plugins: [],
};

export default config;
