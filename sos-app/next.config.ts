import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads de anexos (documentos das etapas da Visão).
      bodySizeLimit: "15mb",
    },
  },
  // O pdfkit (PDF do organograma) carrega suas métricas de fonte (.afm)
  // do próprio node_modules em tempo de execução. Empacotá-lo quebra
  // esses caminhos (ENOENT em Helvetica.afm), então fica fora do bundle
  // e é carregado com require nativo do Node no servidor.
  serverExternalPackages: ["pdfkit"],
  allowedDevOrigins: ["192.168.0.117"],
};

export default nextConfig;
