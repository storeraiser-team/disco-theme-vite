/** @type {import('tailwindcss').Config} */

import remToPxPlugin from "tailwindcss-rem-to-px";

export default {
  prefix: "d-",
  content: ['./**/*.liquid', './frontend/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: "320px",
      md: "750px",
      lg: "990px",
      xlg: "1440px",
      x2lg: "1920px",
      pageMaxWidth: "1440px",
    },
  },
  plugins: [
    remToPxPlugin({
      baseFontSize: 16,
    }),
    require("@tailwindcss/forms"),
  ],
};
