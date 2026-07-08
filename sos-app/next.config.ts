import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads de anexos (documentos das etapas da Visão).
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
