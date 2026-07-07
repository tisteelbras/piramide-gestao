import { defineConfig } from "drizzle-kit";
import { readFileSync } from "node:fs";

// Carrega DATABASE_URL de .env.local (o drizzle-kit não faz isso sozinho).
if (!process.env.DATABASE_URL) {
  try {
    const env = readFileSync(".env.local", "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^\s*([\w]+)\s*=\s*(.+)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* .env.local ausente — segue com variáveis de ambiente do sistema */
  }
}

// Configuração do Drizzle Kit: onde está o schema, para onde vão as
// migrations e como conectar ao Postgres da empresa.
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
