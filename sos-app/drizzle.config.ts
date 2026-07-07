import { defineConfig } from "drizzle-kit";

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
