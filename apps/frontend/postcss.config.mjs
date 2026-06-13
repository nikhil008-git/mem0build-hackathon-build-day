import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

/** Pin Tailwind/PostCSS to the frontend app dir (not turbopack monorepo root). */
const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: configDir,
    },
  },
};

export default config;
