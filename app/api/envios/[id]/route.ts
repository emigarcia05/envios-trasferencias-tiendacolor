import { NextResponse } from "next/server";
import { getAllItems, deleteItem } from "@/lib/neo4j";

export const dynamic = "force-dynamic";

/** GET: obtener un ítem por id */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await getAllItems();
    const item = items.find((e) => e.id === id);
    if (!item) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(item);
  } catch (e) {
    console.error("GET /api/envios/[id]", e);
    return NextResponse.json(
      { error: "Error al obtener el ítem" },
      { status: 500 }
    );
  }
}

/** DELETE: eliminar un ítem */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteItem(id);
    if (!deleted) return NextResponse.json(null, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/envios/[id]", e);
    return NextResponse.json(
      { error: "Error al eliminar" },
      { status: 500 }
    );
  }
}
