import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite enviar fotos de até ~5 MB pelo painel admin.
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
