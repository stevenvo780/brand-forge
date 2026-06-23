// Applies db/schema.sql to the database in DATABASE_URL.
// Usage: DATABASE_URL=... npm run db:init
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL no está configurada.");
    process.exit(1);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const sql = readFileSync(join(here, "..", "db", "schema.sql"), "utf8");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Schema aplicado correctamente.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
