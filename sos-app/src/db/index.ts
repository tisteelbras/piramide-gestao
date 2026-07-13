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

const connectionUrl = new URL(connectionString);
const sslMode = connectionUrl.searchParams.get("sslmode")?.toLowerCase();
let ssl: boolean | "allow" | "prefer" | { rejectUnauthorized: boolean } = false;

if (sslMode) {
  switch (sslMode) {
    case "disable":
      ssl = false;
      break;
    case "allow":
      ssl = "allow";
      break;
    case "prefer":
      ssl = "prefer";
      break;
    case "require":
      ssl = { rejectUnauthorized: false };
      break;
    case "verify-full":
      ssl = { rejectUnauthorized: true };
      break;
    default:
      ssl = sslMode as any;
  }
} else if (
  process.env.NODE_ENV === "production" &&
  /(?:^|\.)supabase\.com$/i.test(connectionUrl.hostname)
) {
  ssl = { rejectUnauthorized: false };
}

const postgresOptions = { max: 10, ssl };

// Uma única instância do cliente, reaproveitada entre requisições em dev
// (evita esgotar conexões no hot-reload do Next).
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const sql = globalForDb.sql ?? postgres(connectionString, postgresOptions);
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
