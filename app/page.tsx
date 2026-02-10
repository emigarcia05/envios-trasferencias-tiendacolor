"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Truck,
  ArrowLeftRight,
  X,
  User,
  MapPin,
  Calendar,
  Clock,
  Store,
  MessageSquare,
  FileText,
  Phone,
  Tag,
  Check,
  Search,
} from "lucide-react";
import type { Item, ItemEnvio, ItemTransferencia } from "@/lib/types";
import { isTransferencia } from "@/lib/types";

const HORAS: string[] = [];
for (let h = 8; h <= 19; h++) {
  for (let m = 0; m < 60; m += 30) {
    if (h === 19 && m === 30) break;
    HORAS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

const SUCURSALES = ["Guaymallén", "Maipú"];

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function formatDDMMYYYY(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return [d!.padStart(2, "0"), m!.padStart(2, "0"), y].join("/");
}

function formatFechaConDia(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso + "T12:00:00");
  const day = date.toLocaleDateString("es-AR", { weekday: "long" });
  const cap = day.charAt(0).toUpperCase() + day.slice(1);
  return cap + ", " + formatDDMMYYYY(iso);
}

function visibleEnVistaPrincipal(item: Item): boolean {
  if (isTransferencia(item)) return true;
  const envio = item as ItemEnvio;
  if (!envio.envio) return false;
  if (!envio.entregado) return true;
  const req = envio.envio.sucursalEnvia !== envio.envio.sucursalFactura;
  return req && !envio.mercaderiaTransferida;
}

function esCompleto(item: Item): boolean {
  if (isTransferencia(item)) return false;
  const envio = item as ItemEnvio;
  if (!envio.envio || !envio.entregado) return false;
  const req = envio.envio.sucursalEnvia !== envio.envio.sucursalFactura;
  return !req || !!envio.mercaderiaTransferida;
}

function isAtrasado(envio: ItemEnvio): boolean {
  if (!envio.envio?.fecha || !envio.envio?.horaHasta || envio.entregado) return false;
  const fin = new Date(envio.envio.fecha + "T" + envio.envio.horaHasta);
  return fin < new Date();
}

function isAtrasadoTransfer(t: ItemTransferencia): boolean {
  if (!t.fecha) return false;
  const hoy = new Date().toISOString().slice(0, 10);
  return t.fecha < hoy;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState("todo");
  const [filterSucursal, setFilterSucursal] = useState("todo");
  const [filterEstado, setFilterEstado] = useState("pendientes");
  const [filterFecha, setFilterFecha] = useState("hoy");
  const [dashboardFilter, setDashboardFilter] = useState("todos");
  const [searchCliente, setSearchCliente] = useState("");
  const [modalSelector, setModalSelector] = useState(false);
  const [modalEnvio, setModalEnvio] = useState(false);
  const [modalTransferencia, setModalTransferencia] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [verItem, setVerItem] = useState<Item | null>(null);
  const [editEnvio, setEditEnvio] = useState<ItemEnvio | null>(null);
  const [editTransferencia, setEditTransferencia] = useState<ItemTransferencia | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formTransferenciaError, setFormTransferenciaError] = useState("");
  const [sucursalesError, setSucursalesError] = useState(false);

  const [formEnvio, setFormEnvio] = useState({
    fecha: "",
    horaDesde: "08:00",
    horaHasta: "12:00",
    sucursalEnvia: SUCURSALES[0] ?? "",
    sucursalFactura: SUCURSALES[0] ?? "",
    nombre: "",
    telefono: "",
    direccion: "",
    urlMapa: "",
    referencia: "",
    metodoPago: "",
    pdfBase64: "",
    pdfNombre: "",
  });
  const [formTransferencia, setFormTransferencia] = useState({
    fecha: "",
    sucursalDesde: SUCURSALES[0] ?? "",
    sucursalHasta: SUCURSALES[1] ?? "",
    comentarios: "",
    pdfBase64: "",
    pdfNombre: "",
  });

  useEffect(() => {
    if (modalEnvio) {
      if (editEnvio) {
        setFormEnvio({
          fecha: editEnvio.envio?.fecha ?? "",
          horaDesde: editEnvio.envio?.horaDesde ?? "08:00",
          horaHasta: editEnvio.envio?.horaHasta ?? "12:00",
          sucursalEnvia: editEnvio.envio?.sucursalEnvia ?? SUCURSALES[0] ?? "",
          sucursalFactura: editEnvio.envio?.sucursalFactura ?? SUCURSALES[0] ?? "",
          nombre: editEnvio.cliente?.nombre ?? "",
          telefono: editEnvio.cliente?.telefono ?? "",
          direccion: editEnvio.cliente?.direccion ?? "",
          urlMapa: editEnvio.cliente?.urlMapa ?? "",
          referencia: editEnvio.cliente?.referencia ?? "",
          metodoPago: editEnvio.mercaderia?.metodoPago ?? "",
          pdfBase64: editEnvio.mercaderia?.pdfBase64 ?? "",
          pdfNombre: editEnvio.mercaderia?.pdfNombre ?? "",
        });
      } else {
        const hoy = new Date().toISOString().slice(0, 10);
        setFormEnvio({
          fecha: hoy,
          horaDesde: "08:00",
          horaHasta: "12:00",
          sucursalEnvia: SUCURSALES[0] ?? "",
          sucursalFactura: SUCURSALES[0] ?? "",
          nombre: "",
          telefono: "",
          direccion: "",
          urlMapa: "",
          referencia: "",
          metodoPago: "",
          pdfBase64: "",
          pdfNombre: "",
        });
      }
      setFormError("");
    }
  }, [modalEnvio, editEnvio]);

  useEffect(() => {
    if (modalTransferencia) {
      if (editTransferencia) {
        setFormTransferencia({
          fecha: editTransferencia.fecha ?? "",
          sucursalDesde: editTransferencia.sucursalDesde ?? SUCURSALES[0] ?? "",
          sucursalHasta: editTransferencia.sucursalHasta ?? SUCURSALES[1] ?? "",
          comentarios: editTransferencia.comentarios ?? editTransferencia.detalle ?? "",
          pdfBase64: editTransferencia.pdfBase64 ?? "",
          pdfNombre: editTransferencia.pdfNombre ?? "",
        });
      } else {
        const hoy = new Date().toISOString().slice(0, 10);
        setFormTransferencia({
          fecha: hoy,
          sucursalDesde: SUCURSALES[0] ?? "",
          sucursalHasta: SUCURSALES[1] ?? "",
          comentarios: "",
          pdfBase64: "",
          pdfNombre: "",
        });
      }
      setFormTransferenciaError("");
      setSucursalesError(false);
    }
  }, [modalTransferencia, editTransferencia]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/envios");
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    let list = items;
    if (filterEstado === "pendientes") list = list.filter((i) => isTransferencia(i) || visibleEnVistaPrincipal(i));
    else if (filterEstado === "completo") list = list.filter((i) => isTransferencia(i) || esCompleto(i));
    if (filterTipo === "envio") list = list.filter((i) => !isTransferencia(i));
    else if (filterTipo === "transferencia") list = list.filter(isTransferencia);
    if (filterSucursal !== "todo") {
      list = list.filter((i) => {
        if (isTransferencia(i)) return i.sucursalDesde === filterSucursal;
        return (i as ItemEnvio).envio?.sucursalEnvia === filterSucursal;
      });
    }
    if (filterFecha === "hoy") {
      list = list.filter((i) => {
        if (isTransferencia(i)) return (i.fecha || "") === hoy;
        return (i as ItemEnvio).envio?.fecha === hoy;
      });
    }
    if (dashboardFilter === "atrasados") list = list.filter((i) => (isTransferencia(i) ? isAtrasadoTransfer(i) : isAtrasado(i as ItemEnvio)));
    if (dashboardFilter === "transf-pend") list = list.filter((i) => !isTransferencia(i) && (i as ItemEnvio).envio && (i as ItemEnvio).envio!.sucursalEnvia !== (i as ItemEnvio).envio!.sucursalFactura && !(i as ItemEnvio).mercaderiaTransferida);
    if (filterEstado === "completo" && searchCliente.trim()) {
      const q = searchCliente.trim().toLowerCase();
      list = list.filter((i) => !isTransferencia(i) && (i as ItemEnvio).cliente?.nombre?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      if (isTransferencia(a) && isTransferencia(b)) return new Date((a.fecha || "") + "T12:00:00").getTime() - new Date((b.fecha || "") + "T12:00:00").getTime();
      if (isTransferencia(a)) return 1;
      if (isTransferencia(b)) return -1;
      const ae = (a as ItemEnvio).envio;
      const be = (b as ItemEnvio).envio;
      return new Date((ae?.fecha || "") + "T" + (ae?.horaHasta || "")).getTime() - new Date((be?.fecha || "") + "T" + (be?.horaHasta || "")).getTime();
    });
  }, [items, filterTipo, filterSucursal, filterEstado, filterFecha, dashboardFilter, searchCliente]);

  const resumen = useMemo(() => {
    const list = items;
    const pendientes = list.length;
    const atrasados = list.filter((e) => (isTransferencia(e) ? isAtrasadoTransfer(e) : isAtrasado(e as ItemEnvio))).length;
    const transfPend = list.filter((e) => !isTransferencia(e) && (e as ItemEnvio).envio && (e as ItemEnvio).envio!.sucursalEnvia !== (e as ItemEnvio).envio!.sucursalFactura && !(e as ItemEnvio).mercaderiaTransferida).length;
    return { pendientes, atrasados, transfPend };
  }, [items]);

  const saveItem = useCallback(
    async (item: Item) => {
      const res = await fetch("/api/envios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
      if (res.ok) await fetchItems();
      return res.ok;
    },
    [fetchItems]
  );

  const deleteItemById = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/envios/${id}`, { method: "DELETE" });
      if (res.ok) await fetchItems();
      return res.ok;
    },
    [fetchItems]
  );

  const openVer = (item: Item) => {
    setVerItem(item);
    setModalVer(true);
  };

  const markEntregado = async (ev: ItemEnvio) => {
    const updated = { ...ev, entregado: true };
    const ok = await saveItem(updated);
    if (ok) {
      await fetchItems();
      setVerItem(updated);
    }
  };

  const markMercaderiaTransferida = async (ev: ItemEnvio) => {
    const updated = { ...ev, mercaderiaTransferida: true };
    const ok = await saveItem(updated);
    if (ok) {
      await fetchItems();
      setVerItem(updated);
    }
  };

  const markTransferenciaCompletada = async (t: ItemTransferencia) => {
    const updated = { ...t, completada: true };
    const ok = await saveItem(updated);
    if (ok) {
      await fetchItems();
      setVerItem(updated);
    }
  };

  const confirmDelete = async () => {
    if (idToDelete) {
      await deleteItemById(idToDelete);
      setIdToDelete(null);
      setModalDelete(false);
      await fetchItems();
    }
  };

  const submitEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEnvio.nombre?.trim()) {
      setFormError("El nombre del cliente es obligatorio.");
      return;
    }
    const item: ItemEnvio = {
      id: editEnvio?.id ?? crypto.randomUUID(),
      envio: {
        fecha: formEnvio.fecha,
        horaDesde: formEnvio.horaDesde,
        horaHasta: formEnvio.horaHasta,
        sucursalEnvia: formEnvio.sucursalEnvia,
        sucursalFactura: formEnvio.sucursalFactura,
      },
      cliente: {
        nombre: formEnvio.nombre.trim(),
        telefono: formEnvio.telefono || undefined,
        direccion: formEnvio.direccion || undefined,
        urlMapa: formEnvio.urlMapa || undefined,
        referencia: formEnvio.referencia || undefined,
      },
      mercaderia:
        formEnvio.metodoPago || formEnvio.pdfBase64
          ? { metodoPago: formEnvio.metodoPago || undefined, pdfBase64: formEnvio.pdfBase64 || undefined, pdfNombre: formEnvio.pdfNombre || undefined }
          : undefined,
    };
    const ok = await saveItem(item);
    if (ok) {
      setModalEnvio(false);
      setEditEnvio(null);
    }
  };

  const submitTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formTransferencia.sucursalDesde === formTransferencia.sucursalHasta) {
      setFormTransferenciaError("La sucursal de origen y destino deben ser distintas.");
      setSucursalesError(true);
      return;
    }
    const item: ItemTransferencia = {
      id: editTransferencia?.id ?? crypto.randomUUID(),
      tipo: "transferencia",
      fecha: formTransferencia.fecha,
      sucursalDesde: formTransferencia.sucursalDesde,
      sucursalHasta: formTransferencia.sucursalHasta,
      comentarios: formTransferencia.comentarios || undefined,
      detalle: formTransferencia.comentarios || undefined,
      pdfBase64: formTransferencia.pdfBase64 || undefined,
      pdfNombre: formTransferencia.pdfNombre || undefined,
      completada: editTransferencia?.completada,
    };
    const ok = await saveItem(item);
    if (ok) {
      setModalTransferencia(false);
      setEditTransferencia(null);
    }
  };

  return (
    <div className="bg-app-bg min-h-screen text-slate-900 safe-bottom pb-24">
      <div className="w-[95%] md:w-1/2 mx-auto min-h-full">
        <header className="pt-4 pb-2">
          {/* Imagen en public/encabeazdo.png (copiar desde la raíz del proyecto si no existe) */}
          <img src="/encabeazdo.png" alt="Envíos & Transferencias - TiendaColor Pinturerías" className="w-full h-auto object-contain rounded-lg" />
        </header>

        <section className="pt-1 pb-2">
          <div className="rounded-xl shadow-sm p-2 space-y-2 bg-[#338EC9]">
            <div>
              <label htmlFor="filter-tipo" className="block text-xs font-medium text-white/90 uppercase tracking-wide mb-0.5">Tipo</label>
              <select id="filter-tipo" value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); setDashboardFilter("todos"); }} className="w-full rounded-lg bg-white px-2.5 py-2 text-sm text-slate-900 dropdown-arrow appearance-none pr-9 border-0 shadow-sm">
                <option value="todo">Todo</option>
                <option value="envio">Envío</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="filter-sucursal" className="block text-xs font-medium text-white/90 uppercase tracking-wide mb-0.5">Sucursal</label>
                <select id="filter-sucursal" value={filterSucursal} onChange={(e) => { setFilterSucursal(e.target.value); setDashboardFilter("todos"); }} className="w-full rounded-lg bg-white px-2.5 py-2 text-sm text-slate-900 dropdown-arrow appearance-none pr-9 border-0 shadow-sm">
                  <option value="todo">Todo</option>
                  {SUCURSALES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-estado" className="block text-xs font-medium text-white/90 uppercase tracking-wide mb-0.5">Estado</label>
                <select id="filter-estado" value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setDashboardFilter("todos"); }} className="w-full rounded-lg bg-white px-2.5 py-2 text-sm text-slate-900 dropdown-arrow appearance-none pr-9 border-0 shadow-sm">
                  <option value="pendientes">Pendientes</option>
                  <option value="completo">Completados</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-fecha" className="block text-xs font-medium text-white/90 uppercase tracking-wide mb-0.5">Fecha</label>
                <select id="filter-fecha" value={filterFecha} onChange={(e) => { setFilterFecha(e.target.value); setDashboardFilter("todos"); }} className="w-full rounded-lg bg-white px-2.5 py-2 text-sm text-slate-900 dropdown-arrow appearance-none pr-9 border-0 shadow-sm">
                  <option value="hoy">Hoy</option>
                  <option value="todo">Todo</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {filterEstado === "completo" && (
          <section className="pt-2 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="search" value={searchCliente} onChange={(e) => setSearchCliente(e.target.value)} placeholder="Buscar por nombre de cliente..." className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]" />
            </div>
          </section>
        )}

        <section className="pt-2 pb-2 sticky top-0 z-20 bg-[#0072BB]">
          <div className="grid grid-cols-3 gap-2">
            {(["todos", "atrasados", "transf-pend"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => { setDashboardFilter(key); setFilterEstado("pendientes"); }}
                className={`rounded-lg px-2 py-2 text-center border-2 border-transparent transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/80 bg-[#338EC9] ${dashboardFilter === key ? "dashboard-btn-active" : ""}`}
                style={{ backgroundColor: "#338EC9" }}
              >
                <p className="text-[10px] font-medium text-white/90 uppercase">
                  {key === "todos" ? "Pendientes" : key === "atrasados" ? "Atrasados" : "Transf. Pend."}
                </p>
                <p className="text-lg font-bold text-white">
                  {key === "todos" ? resumen.pendientes : key === "atrasados" ? resumen.atrasados : resumen.transfPend}
                </p>
              </button>
            ))}
          </div>
          <div className="h-0.5 w-full bg-[#FFC107] mt-2" aria-hidden />
        </section>

        <main className="space-y-4">
          {loading ? (
            <p className="text-white text-center py-8">Cargando...</p>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <Truck className="w-14 h-14 mx-auto text-slate-300 mb-3" />
              <h2 className="text-lg font-bold text-slate-900">Sin resultados</h2>
              <p className="text-sm text-slate-600 mt-1">No hay ítems con los filtros actuales.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => {
                if (isTransferencia(item)) {
                  const t = item as ItemTransferencia;
                  const atrasado = isAtrasadoTransfer(t);
                  const desde = t.sucursalDesde || "";
                  const hasta = t.sucursalHasta || "";
                  const fechaStr = t.fecha ? formatFechaConDia(t.fecha) : "—";
                  const [diaSemana, ...resto] = fechaStr.split(", ");
                  const ddmm = resto.length ? resto.join(", ").split("/").slice(0, 2).join("/") : "—";
                  return (
                    <article key={t.id} className="card-fixed bg-slate-50 rounded-2xl border-2 border-[#FFC107] overflow-hidden shadow-md" data-id={t.id}>
                      <div className={`card-sidebar w-12 min-w-[3rem] flex-shrink-0 flex flex-col items-center justify-center py-3 px-1 border-r-2 ${atrasado ? "card-sidebar-atrasado" : ""}`}>
                        <ArrowLeftRight className="w-6 h-6 text-white shrink-0" />
                        <span className="text-xs font-bold text-white uppercase mt-1.5 text-center">TRANSF.</span>
                      </div>
                      <div className="card-row-header grid grid-cols-3 bg-[#FFC107] relative">
                        <div className="flex items-center justify-center p-1.5 text-center"><span className="text-slate-900 text-sm font-bold truncate">{desde}</span></div>
                        <div className="flex flex-col items-center justify-center p-1.5 text-center">
                          <span className="block text-slate-900 text-xs font-normal">{ddmm}</span>
                          <span className="block text-slate-900 text-xs font-bold mt-0.5">{t.fecha ? diaSemana : "—"}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1.5 text-center min-w-0">
                          <span className="block text-[10px] font-bold text-slate-900 uppercase mb-0.5">Mercadería</span>
                          <span className="inline-flex items-center gap-1 flex-wrap justify-center">
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 text-xs font-medium truncate max-w-[4.5rem]">{desde}</span>
                            <span className="text-slate-700 shrink-0">→</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 text-xs font-medium truncate max-w-[4.5rem]">{hasta}</span>
                          </span>
                        </div>
                      </div>
                      <div className="card-row-body bg-slate-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <MessageSquare className="w-4 h-4 text-slate-900 shrink-0" />
                          <h3 className="font-bold text-slate-900 text-sm truncate">{t.comentarios || t.detalle || "-"}</h3>
                        </div>
                      </div>
                      <div className="card-row-actions">
                        {atrasado && <span className="card-badge-atrasado shrink-0">ATRASADO</span>}
                        <button type="button" onClick={() => { setIdToDelete(t.id); setModalDelete(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-900">Eliminar</button>
                        <button type="button" onClick={() => { setEditTransferencia(t); setModalTransferencia(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-900">Editar</button>
                        <button type="button" onClick={() => openVer(t)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-[#338EC9]">Ver Transferencia</button>
                      </div>
                    </article>
                  );
                }
                const e = item as ItemEnvio;
                const requiereTransferencia = e.envio && e.envio.sucursalEnvia !== e.envio.sucursalFactura;
                const atrasado = isAtrasado(e);
                const pendienteTransferencia = e.entregado && requiereTransferencia && !e.mercaderiaTransferida;
                const esteticaAlerta = atrasado || pendienteTransferencia;
                const fechaConDia = e.envio?.fecha ? formatFechaConDia(e.envio.fecha) : "";
                const [diaSemana, ...resto] = fechaConDia.split(", ");
                const ddmm = resto.length ? resto.join(", ").split("/").slice(0, 2).join("/") : "—";
                const horaRango = e.envio ? `${e.envio.horaDesde} - ${e.envio.horaHasta}` : "";
                return (
                  <article key={e.id} className="card-fixed bg-slate-50 rounded-2xl border-2 border-[#FFC107] overflow-hidden shadow-md" data-id={e.id}>
                    <div className={`card-sidebar w-12 min-w-[3rem] flex-shrink-0 flex flex-col items-center justify-center py-3 px-1 border-r-2 ${esteticaAlerta ? "card-sidebar-atrasado" : ""}`}>
                      <Truck className="w-6 h-6 text-white shrink-0" />
                      <span className="text-xs font-bold text-white uppercase mt-1.5 text-center">ENVÍO</span>
                    </div>
                    <div className="card-row-header grid grid-cols-3 bg-[#FFC107] relative">
                      <div className="flex items-center justify-center p-1.5 text-center"><span className="text-slate-900 text-sm font-bold truncate">{e.envio?.sucursalEnvia}</span></div>
                      <div className="flex flex-col items-center justify-center p-1.5 text-center">
                        <span className="block text-slate-900 text-xs font-normal">{ddmm}</span>
                        <span className="block text-xs font-bold text-slate-900 mt-0.5">{diaSemana}</span>
                        <span className="block text-xs font-bold text-slate-900 mt-0.5 truncate">{horaRango}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-1.5 text-center min-w-0">
                        <span className="block text-[10px] font-bold text-slate-900 uppercase mb-0.5">Mercadería</span>
                        {requiereTransferencia ? (
                          <span className="inline-flex items-center gap-1 flex-wrap justify-center">
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 text-xs font-medium truncate max-w-[4.5rem]">{e.envio?.sucursalEnvia}</span>
                            <span className="text-slate-700 shrink-0">→</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 text-xs font-medium truncate max-w-[4.5rem]">{e.envio?.sucursalFactura}</span>
                          </span>
                        ) : (
                          <span className="text-slate-900 text-xs">—</span>
                        )}
                      </div>
                    </div>
                    <div className="card-row-body bg-slate-50">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-4 h-4 text-slate-900 shrink-0" />
                        <h3 className="font-bold text-slate-900 text-sm truncate">{e.cliente?.nombre}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 min-w-0">
                        <MapPin className="w-4 h-4 text-slate-900 shrink-0" />
                        <p className="text-sm text-slate-900 truncate">{e.cliente?.direccion || "-"}</p>
                      </div>
                    </div>
                      <div className="card-row-actions">
                        {atrasado && <span className="card-badge-atrasado shrink-0">ATRASADO</span>}
                        {pendienteTransferencia && <span className="card-badge-atrasado shrink-0">Merc.Pendiente de Transferencia</span>}
                        <button type="button" onClick={() => { setIdToDelete(e.id); setModalDelete(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-900">Eliminar</button>
                        <button type="button" onClick={() => { setEditEnvio(e); setModalEnvio(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-900">Editar</button>
                        <button type="button" onClick={() => openVer(e)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-[#338EC9]">Ver Envío</button>
                      </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <button type="button" onClick={() => setModalSelector(true)} className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-white text-app-bg font-bold text-2xl flex items-center justify-center shadow-lg active:scale-95 safe-bottom" aria-label="Nuevo">+</button>

      {/* Modal selector tipo */}
      {modalSelector && (
        <div className="fixed inset-0 z-40 bg-slate-900/80 flex items-center justify-center p-4" onClick={() => setModalSelector(false)}>
          <div className="w-full max-w-sm bg-slate-50 rounded-2xl shadow-2xl border-2 border-[#FFC107] p-5 animate-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 text-center mb-4">¿Qué desea crear?</h2>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => { setModalSelector(false); setEditEnvio(null); setModalEnvio(true); }} className="flex items-center gap-3 w-full p-4 rounded-xl bg-white border-2 border-[#FFC107]/50 hover:border-[#FFC107] text-slate-900 font-bold text-sm">
                <Truck className="w-8 h-8 text-[#0072BB]" /><span>Nuevo Envío</span>
              </button>
              <button type="button" onClick={() => { setModalSelector(false); setEditTransferencia(null); setModalTransferencia(true); }} className="flex items-center gap-3 w-full p-4 rounded-xl bg-white border-2 border-[#FFC107]/50 hover:border-[#FFC107] text-slate-900 font-bold text-sm">
                <ArrowLeftRight className="w-8 h-8 text-[#0072BB]" /><span>Nueva Transferencia</span>
              </button>
            </div>
            <button type="button" onClick={() => setModalSelector(false)} className="w-full mt-3 py-2.5 rounded-xl border-2 border-slate-300 text-slate-600 font-medium text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal formulario Envío */}
      {modalEnvio && (
        <div className="fixed inset-0 z-40 bg-slate-900/80 flex items-end sm:items-center justify-center p-4 overflow-y-auto" onClick={() => { setModalEnvio(false); setEditEnvio(null); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-50 rounded-2xl shadow-2xl border-2 border-[#FFC107] my-4" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0072BB] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white">{editEnvio ? "Editar envío" : "Nuevo envío"}</h2>
              <button type="button" onClick={() => { setModalEnvio(false); setEditEnvio(null); }} className="p-2 rounded-full hover:bg-white/20 text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitEnvio} className="p-5 space-y-3">
              {formError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{formError}</p>}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Fecha *</label>
                <input type="date" value={formEnvio.fecha} onChange={(e) => setFormEnvio((f) => ({ ...f, fecha: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Desde</label>
                  <select value={formEnvio.horaDesde} onChange={(e) => setFormEnvio((f) => ({ ...f, horaDesde: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    {HORAS.map((h) => (<option key={h} value={h}>{h}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Hasta</label>
                  <select value={formEnvio.horaHasta} onChange={(e) => setFormEnvio((f) => ({ ...f, horaHasta: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    {HORAS.map((h) => (<option key={h} value={h}>{h}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Sucursal envía</label>
                  <select value={formEnvio.sucursalEnvia} onChange={(e) => setFormEnvio((f) => ({ ...f, sucursalEnvia: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    {SUCURSALES.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Sucursal factura</label>
                  <select value={formEnvio.sucursalFactura} onChange={(e) => setFormEnvio((f) => ({ ...f, sucursalFactura: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    {SUCURSALES.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Nombre cliente *</label>
                <input type="text" value={formEnvio.nombre} onChange={(e) => setFormEnvio((f) => ({ ...f, nombre: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Nombre completo" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Teléfono</label>
                <input type="tel" value={formEnvio.telefono} onChange={(e) => setFormEnvio((f) => ({ ...f, telefono: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Ej. 261 123 4567" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Dirección</label>
                <input type="text" value={formEnvio.direccion} onChange={(e) => setFormEnvio((f) => ({ ...f, direccion: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Calle, número, localidad" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Referencia</label>
                <input type="text" value={formEnvio.referencia} onChange={(e) => setFormEnvio((f) => ({ ...f, referencia: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Referencia del pedido" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">URL mapa</label>
                <input type="url" value={formEnvio.urlMapa} onChange={(e) => setFormEnvio((f) => ({ ...f, urlMapa: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Método de pago</label>
                <input type="text" value={formEnvio.metodoPago} onChange={(e) => setFormEnvio((f) => ({ ...f, metodoPago: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Efectivo, transferencia, etc." />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setModalEnvio(false); setEditEnvio(null); }} className="flex-1 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#0072BB] text-white font-bold text-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal formulario Transferencia */}
      {modalTransferencia && (
        <div className="fixed inset-0 z-40 bg-slate-900/80 flex items-end sm:items-center justify-center p-4 overflow-y-auto" onClick={() => { setModalTransferencia(false); setEditTransferencia(null); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-50 rounded-2xl shadow-2xl border-2 border-[#FFC107] my-4" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0072BB] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white">{editTransferencia ? "Editar transferencia" : "Nueva transferencia"}</h2>
              <button type="button" onClick={() => { setModalTransferencia(false); setEditTransferencia(null); }} className="p-2 rounded-full hover:bg-white/20 text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitTransferencia} className="p-5 space-y-3">
              {(formTransferenciaError || sucursalesError) && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{formTransferenciaError}</p>}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Fecha *</label>
                <input type="date" value={formTransferencia.fecha} onChange={(e) => setFormTransferencia((f) => ({ ...f, fecha: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Sucursal desde *</label>
                <select value={formTransferencia.sucursalDesde} onChange={(e) => setFormTransferencia((f) => ({ ...f, sucursalDesde: e.target.value }))} className={`w-full rounded-lg border px-3 py-2 text-sm ${sucursalesError ? "border-red-500" : "border-slate-300"}`}>
                  {SUCURSALES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Sucursal hasta *</label>
                <select value={formTransferencia.sucursalHasta} onChange={(e) => setFormTransferencia((f) => ({ ...f, sucursalHasta: e.target.value }))} className={`w-full rounded-lg border px-3 py-2 text-sm ${sucursalesError ? "border-red-500" : "border-slate-300"}`}>
                  {SUCURSALES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Comentarios</label>
                <textarea value={formTransferencia.comentarios} onChange={(e) => setFormTransferencia((f) => ({ ...f, comentarios: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]" placeholder={"Ej:\n1 - LATEX INT COLORIN EMOCION BLANCO MATE 20 LTS"} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">PDF (opcional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#0072BB] file:text-white"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result as string;
                        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";
                        setFormTransferencia((f) => ({ ...f, pdfBase64: base64, pdfNombre: file.name }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {formTransferencia.pdfNombre && <p className="text-xs text-slate-500 mt-1">Adjunto: {formTransferencia.pdfNombre}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setModalTransferencia(false); setEditTransferencia(null); }} className="flex-1 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#0072BB] text-white font-bold text-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {modalDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-100 rounded-2xl shadow-xl border-2 border-[#FFC107] p-5">
            <p className="text-slate-800 font-medium text-center">¿Eliminar este ítem?</p>
            <p className="text-slate-600 text-sm text-center mt-1">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => { setModalDelete(false); setIdToDelete(null); }} className="flex-1 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm">Cancelar</button>
              <button type="button" onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-[#0072BB] text-white font-bold text-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver detalle (simplificado: solo muestra datos y cierra) */}
      {modalVer && verItem && (
        <div className="fixed inset-0 z-40 bg-slate-900/80 flex items-end sm:items-center justify-center p-4" onClick={() => setModalVer(false)}>
          <div className="w-full max-w-lg max-h-[90vh] bg-slate-50 rounded-2xl overflow-hidden flex flex-col shadow-2xl border-2 border-[#FFC107]" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 bg-[#0072BB] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{isTransferencia(verItem) ? "Detalle de la transferencia" : "Detalle del envío"}</h2>
              <button type="button" onClick={() => setModalVer(false)} className="p-2 rounded-full hover:bg-white/20 text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              {isTransferencia(verItem) ? (
                <>
                  <p className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-[#0072BB]" /><span className="font-bold">Fecha:</span> {formatDDMMYYYY(verItem.fecha)}</p>
                  <p className="text-sm flex items-center gap-2"><Store className="w-4 h-4 text-[#0072BB]" /><span className="font-bold">Desde:</span> {verItem.sucursalDesde}</p>
                  <p className="text-sm flex items-center gap-2"><Store className="w-4 h-4 text-[#0072BB]" /><span className="font-bold">Hasta:</span> {verItem.sucursalHasta}</p>
                  <p className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#0072BB]" /><span className="font-bold">Comentarios:</span> {verItem.comentarios || verItem.detalle || "-"}</p>
                  {verItem.pdfBase64 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => window.open(`data:application/pdf;base64,${verItem.pdfBase64}`, "_blank")}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0072BB] text-white font-bold text-sm"
                      >
                        <FileText className="w-4 h-4" /> Ver PDF
                      </button>
                    </div>
                  )}
                </>
              ) : (
                (() => {
                  const ev = verItem as ItemEnvio;
                  const requiereTransferencia = ev.envio && ev.envio.sucursalEnvia !== ev.envio.sucursalFactura;
                  return (
                    <>
                      <p className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-[#0072BB]" /><span className="font-bold">Nombre:</span> {ev.cliente?.nombre}</p>
                      <p className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-[#0072BB]" /><span className="font-bold">Dirección:</span> {ev.cliente?.direccion || "-"}</p>
                      <p className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-[#0072BB]" /><span className="font-bold">Fecha:</span> {ev.envio?.fecha ? formatDDMMYYYY(ev.envio.fecha) : "-"}</p>
                      <p className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-[#0072BB]" /><span className="font-bold">Horario:</span> {ev.envio?.horaDesde} - {ev.envio?.horaHasta}</p>
                      <p className="text-sm flex items-center gap-2"><Store className="w-4 h-4 text-[#0072BB]" /><span className="font-bold">Sucursal:</span> {ev.envio?.sucursalEnvia}{requiereTransferencia ? ` (Factura: ${ev.envio?.sucursalFactura})` : ""}</p>
                      <p className="text-sm flex items-center gap-2"><Tag className="w-4 h-4 text-[#0072BB]" /><span className="font-bold">Referencia:</span> {ev.cliente?.referencia || "-"}</p>
                      {(ev.cliente?.telefono || ev.cliente?.urlMapa) && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {ev.cliente?.telefono && (
                            <a href={`tel:${ev.cliente.telefono}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0072BB] text-white font-bold text-sm">
                              <Phone className="w-4 h-4" /> Llamar
                            </a>
                          )}
                          {ev.cliente?.urlMapa && (
                            <a href={ev.cliente.urlMapa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0072BB] text-white font-bold text-sm">
                              <MapPin className="w-4 h-4" /> Ubicación
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>
            <div className="p-5 border-t border-slate-200 space-y-2">
              {!isTransferencia(verItem) && (() => {
                const ev = verItem as ItemEnvio;
                const requiereTransferencia = ev.envio && ev.envio.sucursalEnvia !== ev.envio.sucursalFactura;
                return (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={ev.entregado ? () => {} : () => markEntregado(ev)}
                      className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 ${ev.entregado ? "bg-slate-300 text-slate-500" : "bg-[#0072BB] text-white"}`}
                    >
                      <Check className="w-4 h-4" /> {ev.entregado ? "Entregado ✓" : "Entregado"}
                    </button>
                    {requiereTransferencia && (
                      <button
                        type="button"
                        onClick={ev.mercaderiaTransferida ? () => {} : () => markMercaderiaTransferida(ev)}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 ${ev.mercaderiaTransferida ? "bg-slate-300 text-slate-500" : "bg-[#0072BB] text-white"}`}
                      >
                        <Truck className="w-4 h-4" /> {ev.mercaderiaTransferida ? "Mercadería Transferida ✓" : "Mercadería Transferida"}
                      </button>
                    )}
                  </div>
                );
              })()}
              {isTransferencia(verItem) && (() => {
                const t = verItem as ItemTransferencia;
                return (
                  <button
                    type="button"
                    onClick={t.completada ? () => {} : () => markTransferenciaCompletada(t)}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 ${t.completada ? "bg-slate-300 text-slate-500" : "bg-[#0072BB] text-white"}`}
                  >
                    <Truck className="w-4 h-4" /> {t.completada ? "Mercadería Transferida ✓" : "Mercadería Transferida"}
                  </button>
                );
              })()}
              <button type="button" onClick={() => setModalVer(false)} className="w-full py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
