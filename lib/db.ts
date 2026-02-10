import { Client } from "pg";
import type { Item } from "./types";

/** En Vercel: configurar DATABASE_URL en Environment Variables (Neon proporciona esta URL). */
const DATABASE_URL = process.env.DATABASE_URL;

const TABLE = "items";

function getClient(): Client {
  if (!DATABASE_URL) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
  }
  return new Client({ connectionString: DATABASE_URL });
}

/** Crea la tabla de ítems si no existe (se ejecuta al inicio de cada operación que use la tabla). */
async function ensureTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'
    )
  `);
}

/** Devuelve todos los ítems (envíos y transferencias) desde PostgreSQL */
export async function getAllItems(): Promise<Item[]> {
  const client = getClient();
  try {
    await client.connect();
    await ensureTable(client);
    const result = await client.query<{ id: string; data: object }>(
      `SELECT id, data FROM ${TABLE} ORDER BY id`
    );
    const items: Item[] = [];
    for (const row of result.rows) {
      if (!row.id) continue;
      try {
        const data = row.data ?? {};
        items.push({ id: row.id, ...data } as Item);
      } catch {
        // skip malformed
      }
    }
    return items;
  } finally {
    await client.end();
  }
}

/** Guarda o actualiza un ítem en PostgreSQL */
export async function saveItem(item: Item): Promise<void> {
  const client = getClient();
  try {
    await client.connect();
    await ensureTable(client);
    const { id, ...rest } = item as Item & { id: string };
    const data = JSON.stringify(rest);
    await client.query(
      `
      INSERT INTO ${TABLE} (id, data) VALUES ($1, $2::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
      `,
      [id, data]
    );
  } finally {
    await client.end();
  }
}

/** Elimina un ítem por id */
export async function deleteItem(id: string): Promise<boolean> {
  const client = getClient();
  try {
    await client.connect();
    await ensureTable(client);
    const result = await client.query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  } finally {
    await client.end();
  }
}
