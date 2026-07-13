import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads de anexos (documentos das etapas da Visão).
      bodySizeLimit: "15mb",
    },
  },
  allowedDevOrigins: ["192.168.0.117"],
};

export default nextConfig;
