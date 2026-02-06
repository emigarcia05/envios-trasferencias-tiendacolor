import neo4j, { Driver } from "neo4j-driver";
import type { Item } from "./types";

const NEO4J_URI = process.env.NEO4J_URI ?? "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER ?? "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? "password";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  }
  return driver;
}

const ITEM_LABEL = "Item";

/** Crea el índice/constraint en Neo4j si no existe (ejecutar una vez) */
export async function initNeo4jSchema(session: ReturnType<Driver["session"]>) {
  await session.run(`
    CREATE CONSTRAINT item_id IF NOT EXISTS
    FOR (n:${ITEM_LABEL}) REQUIRE n.id IS UNIQUE
  `);
}

/** Devuelve todos los ítems (envíos y transferencias) desde Neo4j */
export async function getAllItems(): Promise<Item[]> {
  const sess = getDriver().session();
  try {
    const result = await sess.run(
      `MATCH (n:${ITEM_LABEL}) RETURN n.id AS id, n.data AS data`
    );
    const items: Item[] = [];
    for (const record of result.records) {
      const id = record.get("id") as string;
      const dataStr = record.get("data") as string | null;
      if (!id) continue;
      try {
        const data = dataStr ? JSON.parse(dataStr) : {};
        items.push({ id, ...data } as Item);
      } catch {
        // skip malformed
      }
    }
    return items;
  } finally {
    await sess.close();
  }
}

/** Guarda o actualiza un ítem en Neo4j */
export async function saveItem(item: Item): Promise<void> {
  const sess = getDriver().session();
  try {
    const { id, ...rest } = item as Item & { id: string };
    const data = JSON.stringify(rest);
    await sess.run(
      `
      MERGE (n:${ITEM_LABEL} {id: $id})
      SET n.data = $data
      `,
      { id, data }
    );
  } finally {
    await sess.close();
  }
}

/** Elimina un ítem por id */
export async function deleteItem(id: string): Promise<boolean> {
  const sess = getDriver().session();
  try {
    const result = await sess.run(
      `MATCH (n:${ITEM_LABEL} {id: $id}) DELETE n RETURN count(n) AS deleted`,
      { id }
    );
    const deleted = result.records[0]?.get("deleted")?.toNumber?.() ?? 0;
    return deleted > 0;
  } finally {
    await sess.close();
  }
}
