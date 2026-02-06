import { NextResponse } from "next/server";
import { getAllItems, saveItem } from "@/lib/neo4j";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET: listar todos los ítems (envíos + transferencias) */
export async function GET() {
  try {
    const items = await getAllItems();
    return NextResponse.json(items);
  } catch (e) {
    console.error("GET /api/envios", e);
    return NextResponse.json(
      { error: "Error al obtener la lista" },
      { status: 500 }
    );
  }
}

/** POST: crear o actualizar un ítem */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = body as Item;
    if (!item.id) {
      return NextResponse.json(
        { error: "Falta id del ítem" },
        { status: 400 }
      );
    }
    await saveItem(item);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/envios", e);
    return NextResponse.json(
      { error: "Error al guardar" },
      { status: 500 }
    );
  }
}
