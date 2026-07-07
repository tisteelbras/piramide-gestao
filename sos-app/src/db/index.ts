// Conexão com o PostgreSQL da empresa.
// A string de conexão vem de DATABASE_URL (.env.local) — nunca hardcoded.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL não definida. Crie sos-app/.env.local com a string de conexão do Postgres.",
  );
}

// Uma única instância do cliente, reaproveitada entre requisições em dev
// (evita esgotar conexões no hot-reload do Next).
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const sql = globalForDb.sql ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
