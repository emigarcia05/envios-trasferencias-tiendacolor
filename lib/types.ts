/** Envío (entrega a domicilio) */
export interface EnvioData {
  fecha: string;
  horaDesde: string;
  horaHasta: string;
  sucursalEnvia: string;
  sucursalFactura: string;
}

export interface ClienteData {
  nombre: string;
  telefono?: string;
  direccion?: string;
  urlMapa?: string;
  referencia?: string;
}

export interface MercaderiaData {
  pdfBase64?: string;
  pdfNombre?: string;
  metodoPago?: string;
}

/** Item de tipo envío (guardado en lista/Neo4j) */
export interface ItemEnvio {
  id: string;
  envio: EnvioData;
  cliente: ClienteData;
  mercaderia?: MercaderiaData;
  comentarios?: string;
  entregado?: boolean;
  mercaderiaTransferida?: boolean;
  createdAt?: number;
}

/** Item de tipo transferencia entre sucursales */
export interface ItemTransferencia {
  id: string;
  tipo: "transferencia";
  fecha: string;
  sucursalDesde: string;
  sucursalHasta: string;
  comentarios?: string;
  detalle?: string;
  pdfBase64?: string;
  pdfNombre?: string;
  completada?: boolean;
  createdAt?: number;
}

export type Item = ItemEnvio | ItemTransferencia;

export function isTransferencia(item: Item): item is ItemTransferencia {
  if (!item) return false;
  if ("tipo" in item && item.tipo === "transferencia") return true;
  return (
    "sucursalDesde" in item &&
    "sucursalHasta" in item &&
    typeof (item as ItemTransferencia).sucursalDesde === "string" &&
    !("envio" in item)
  );
}
