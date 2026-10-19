"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DatabaseBackup,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Server,
  X,
} from "lucide-react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import PanelHeader from "@/app/components/nav/PanelHeader";

type Props = {
  actor?: string;
};

type PlacaItem = {
  placa: string;
  cuenta: string;
  servidores: string[];
};

type DetalleTabla = {
  tabla: string;
  estado: string;
  filasInsertadas?: number;
  segundos?: number;
  error?: string;
  mensaje?: string;
};

type Job = {
  jobId: string;
  estado: "EN_COLA" | "PROCESANDO" | "OK" | "PARCIAL" | "ERROR" | string;
  solicitante?: string;
  placas?: string[];
  desde?: string;
  hasta?: string;
  tablaActual?: string;
  tablasAProcesar?: string[];
  estimadoMinutos?: number;
  trabajosEnColaAntes?: number;
  progreso?: { completadas: number; total: number };
  filasInsertadas?: number;
  creado?: string;
  inicio?: string;
  fin?: string;
  detalle?: DetalleTabla[];
  error?: string;
};

const MAX_DIAS_RANGO = 62;
const STORAGE_KEY_JOB = "velsat_carga_job_activo";

const ESTADO_UI: Record<string, { label: string; color: string; fondo: string; borde: string }> = {
  EN_COLA: { label: "EN COLA", color: "#F05A28", fondo: "rgba(240,90,40,0.12)", borde: "rgba(240,90,40,0.3)" },
  PROCESANDO: { label: "PROCESANDO", color: "#F05A28", fondo: "rgba(240,90,40,0.12)", borde: "rgba(240,90,40,0.3)" },
  OK: { label: "LISTO", color: "#4ADE80", fondo: "rgba(74,222,128,0.12)", borde: "rgba(74,222,128,0.3)" },
  PARCIAL: { label: "PARCIAL", color: "#EAB308", fondo: "rgba(234,179,8,0.12)", borde: "rgba(234,179,8,0.3)" },
  ERROR: { label: "ERROR", color: "#EF4444", fondo: "rgba(239,68,68,0.12)", borde: "rgba(239,68,68,0.35)" },
};

const ESTADO_TABLA: Record<string, string> = {
  PENDIENTE: "Pendiente",
  DESCARGANDO: "Descargando",
  IMPORTANDO: "Importando",
  FILTRANDO: "Filtrando",
  OK: "Listo",
  OMITIDA: "Ya estaba disponible",
  ERROR: "Error",
};

function estadoUI(estado: string) {
  return ESTADO_UI[estado] || { label: estado, color: "#8A9099", fondo: "rgba(255,255,255,0.05)", borde: "rgba(255,255,255,0.1)" };
}

function esFinal(estado?: string) {
  return estado === "OK" || estado === "ERROR" || estado === "PARCIAL";
}

function hoyISO(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

function formatFecha(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------
// Rango pedido: la API acepta "2025-06-29" (día completo) y
// "2025-06-29T08:00" (hora exacta) en los mismos campos.
// ---------------------------------------------------------------

function tieneHora(valor?: string) {
  return !!valor && valor.includes("T");
}

/** Instante en milisegundos. Sin hora: 00:00:00 en 'desde' y 23:59:59 en 'hasta'. */
function instanteMs(valor: string, extremo: "desde" | "hasta"): number {
  if (!valor) return NaN;
  if (!tieneHora(valor)) {
    return Date.parse(`${valor}T${extremo === "desde" ? "00:00:00" : "23:59:59"}`);
  }
  // "2025-06-29T08:00" llega sin segundos desde el input datetime-local
  return Date.parse(valor.length === 16 ? `${valor}:00` : valor);
}

/** "2025-06-29T08:00:00" → "2025-06-29 08:00". Sin hora lo deja igual. */
function textoFecha(valor?: string) {
  if (!valor) return "—";
  if (!tieneHora(valor)) return valor;
  const [fecha, hora] = valor.split("T");
  return `${fecha} ${hora.slice(0, 5)}`;
}

function textoRango(desde?: string, hasta?: string) {
  return `${textoFecha(desde)} → ${textoFecha(hasta)}`;
}

/** Duración del rango en palabras: "3 días", "4 horas", "1 día 6 horas". */
function textoDuracion(desdeMs: number, hastaMs: number, conHora: boolean) {
  if (!conHora) {
    const dias = Math.round((hastaMs - desdeMs) / 86400000);
    return `${dias} día${dias === 1 ? "" : "s"}`;
  }
  const totalMin = Math.round((hastaMs - desdeMs) / 60000);
  const dias = Math.floor(totalMin / 1440);
  const horas = Math.floor((totalMin % 1440) / 60);
  const minutos = totalMin % 60;
  const partes: string[] = [];
  if (dias > 0) partes.push(`${dias} día${dias === 1 ? "" : "s"}`);
  if (horas > 0) partes.push(`${horas} hora${horas === 1 ? "" : "s"}`);
  if (minutos > 0) partes.push(`${minutos} min`);
  return partes.length > 0 ? partes.join(" ") : "0 min";
}

function duracion(inicio?: string, fin?: string) {
  if (!inicio || !fin) return null;
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  if (isNaN(ms) || ms < 0) return null;
  const min = Math.floor(ms / 60000);
  const seg = Math.round((ms % 60000) / 1000);
  return min > 0 ? `${min} min ${seg} s` : `${seg} s`;
}

export default function CargaClient({ actor }: Props) {
  // Catálogo de placas (los tres servidores)
  const [placasCatalogo, setPlacasCatalogo] = useState<PlacaItem[]>([]);
  const [cargandoPlacas, setCargandoPlacas] = useState(false);

  // Formulario
  const [busquedaPlaca, setBusquedaPlaca] = useState("");
  const [placasElegidas, setPlacasElegidas] = useState<string[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [desde, setDesde] = useState(hoyISO(-1));
  const [hasta, setHasta] = useState(hoyISO(-1));
  const [conHora, setConHora] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Trabajo en curso e historial
  const [job, setJob] = useState<Job | null>(null);
  const [historial, setHistorial] = useState<Job[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const buscadorRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------------
  // Catálogo de placas e historial
  // ------------------------------------------------------------------
  useEffect(() => {
    const cargarPlacas = async () => {
      setCargandoPlacas(true);
      try {
        const res = await axios.get("/api/placas");
        if (Array.isArray(res.data?.placas)) setPlacasCatalogo(res.data.placas);
        if (res.data?.error) toast.error(res.data.error);
      } catch {
        toast.error("No se pudo cargar la lista de placas. Puedes escribirlas a mano.");
      } finally {
        setCargandoPlacas(false);
      }
    };
    cargarPlacas();
  }, []);

  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true);
    try {
      const res = await axios.get("/api/restauracion");
      if (Array.isArray(res.data?.jobs)) setHistorial(res.data.jobs);
      setHealth(res.data?.health ?? null);
    } catch {
      // El historial es informativo: si falla, no interrumpimos al operador
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // Cierra el desplegable de sugerencias al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target as Node)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ------------------------------------------------------------------
  // Seguimiento del trabajo activo (cada 10 s, el límite del servicio)
  // ------------------------------------------------------------------
  const consultarJob = useCallback(async (jobId: string) => {
    try {
      const res = await axios.get(`/api/restauracion/${jobId}`);
      if (res.data?.success && res.data.job) {
        setJob(res.data.job);
        return res.data.job as Job;
      }
    } catch (err: any) {
      const msg = err.response?.data?.error;
      if (err.response?.status === 404) {
        localStorage.removeItem(STORAGE_KEY_JOB);
        setJob(null);
        if (msg) toast.error(msg);
      }
    }
    return null;
  }, []);

  // Al entrar, retoma el trabajo que se estaba siguiendo antes de recargar
  useEffect(() => {
    const guardado = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_JOB) : null;
    if (guardado) consultarJob(guardado);
  }, [consultarJob]);

  useEffect(() => {
    if (!job || esFinal(job.estado)) return;

    const interval = setInterval(async () => {
      const actualizado = await consultarJob(job.jobId);
      if (actualizado && esFinal(actualizado.estado)) {
        localStorage.removeItem(STORAGE_KEY_JOB);
        cargarHistorial();
        if (actualizado.estado === "OK") {
          const filas = actualizado.filasInsertadas ?? 0;
          if (filas > 0) {
            toast.success(`Restauración lista: ${filas.toLocaleString("es-PE")} registros. Ya puedes avisar al cliente.`, { duration: 8000 });
          } else {
            toast(`Restauración terminada, pero no hubo registros para esas placas en ese rango.`, { icon: "ℹ️", duration: 8000 });
          }
        } else if (actualizado.estado === "PARCIAL") {
          toast(`Restauración parcial: algunas tablas fallaron, revisa el detalle.`, { icon: "⚠️", duration: 8000 });
        } else {
          toast.error(actualizado.error || "La restauración falló.", { duration: 8000 });
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [job, consultarJob, cargarHistorial]);

  // ------------------------------------------------------------------
  // Placas
  // ------------------------------------------------------------------
  const sugerencias = useMemo(() => {
    const q = busquedaPlaca.trim().toLowerCase();
    if (!q) return [];
    return placasCatalogo
      .filter((p) => p.placa.includes(q) && !placasElegidas.includes(p.placa))
      .slice(0, 8);
  }, [busquedaPlaca, placasCatalogo, placasElegidas]);

  const agregarPlaca = (placa: string) => {
    const limpia = placa.trim().toLowerCase();
    if (!limpia) return;
    if (placasElegidas.includes(limpia)) {
      toast(`La placa ${limpia} ya está en la lista`, { icon: "ℹ️" });
      return;
    }
    setPlacasElegidas((prev) => [...prev, limpia]);
    setBusquedaPlaca("");
    setMostrarSugerencias(false);
  };

  const quitarPlaca = (placa: string) => {
    setPlacasElegidas((prev) => prev.filter((p) => p !== placa));
  };

  const existeEnCatalogo = (placa: string) =>
    placasCatalogo.some((p) => p.placa === placa.trim().toLowerCase());

  /** Conserva la fecha elegida: al activar la hora arranca en 00:00 y 23:59. */
  const alternarHora = (activar: boolean) => {
    setConHora(activar);
    if (activar) {
      setDesde((v) => (tieneHora(v) ? v : `${v}T00:00`));
      setHasta((v) => (tieneHora(v) ? v : `${v}T23:59`));
    } else {
      setDesde((v) => v.slice(0, 10));
      setHasta((v) => v.slice(0, 10));
    }
  };

  // ------------------------------------------------------------------
  // Rango de fechas
  // ------------------------------------------------------------------
  const rango = useMemo(() => {
    const desdeMs = instanteMs(desde, "desde");
    const hastaMs = instanteMs(hasta, "hasta");
    if (isNaN(desdeMs) || isNaN(hastaMs)) return null;

    // Días de calendario que abarca: de eso depende cuántas tablas toca el servicio
    const diaDesde = Date.parse(`${desde.slice(0, 10)}T00:00:00`);
    const diaHasta = Date.parse(`${hasta.slice(0, 10)}T00:00:00`);

    return {
      desdeMs,
      hastaMs,
      duracionMs: hastaMs - desdeMs,
      diasCalendario: Math.round((diaHasta - diaDesde) / 86400000) + 1,
    };
  }, [desde, hasta]);

  const errorFormulario = useMemo(() => {
    if (placasElegidas.length === 0) return "Agrega al menos una placa.";
    if (!desde || !hasta) return conHora ? "Indica el rango de fechas y horas." : "Indica el rango de fechas.";
    if (!rango) return "Las fechas ingresadas no son válidas.";
    if (rango.duracionMs <= 0) {
      return conHora
        ? "El inicio debe ser anterior al fin del rango."
        : "La fecha 'desde' no puede ser mayor que la fecha 'hasta'.";
    }
    if (rango.duracionMs > MAX_DIAS_RANGO * 86400000) {
      return `El rango no puede superar ${MAX_DIAS_RANGO} días (estás pidiendo ${Math.ceil(
        rango.duracionMs / 86400000
      )}).`;
    }
    return null;
  }, [placasElegidas, desde, hasta, conHora, rango]);

  // Referencia para el operador: cada semana pedida tarda entre 2 y 12 minutos.
  // No depende de las horas: el servicio importa la tabla completa del periodo.
  const estimado = useMemo(() => {
    if (!rango || rango.diasCalendario < 1) return null;
    const semanas = Math.max(1, Math.ceil(rango.diasCalendario / 7));
    return { min: semanas * 2, max: semanas * 12 };
  }, [rango]);

  // ------------------------------------------------------------------
  // Iniciar restauración
  // ------------------------------------------------------------------
  const iniciarRestauracion = async () => {
    if (errorFormulario) {
      toast.error(errorFormulario);
      return;
    }
    if (job && !esFinal(job.estado)) {
      toast.error("Ya hay una restauración en curso. Espera a que termine.");
      return;
    }

    const resumen =
      `Vas a restaurar ${placasElegidas.length} placa(s) desde ${textoFecha(desde)} hasta ${textoFecha(hasta)}` +
      `${rango ? ` (${textoDuracion(rango.desdeMs, rango.hastaMs, conHora)})` : ""}.\n\n` +
      (estimado ? `Puede tomar entre ${estimado.min} y ${estimado.max} minutos.\n` : "") +
      `La data queda disponible hasta medianoche: el cron la borra a las 5am.\n\n¿Continuar?`;

    if (!confirm(resumen)) return;

    setEnviando(true);
    const t = toast.loading("Enviando solicitud al servidor de restauración...");
    try {
      const res = await axios.post("/api/restauracion", {
        placas: placasElegidas,
        desde,
        hasta,
        // Queda en el historial del servicio para saber quién pidió cada carga
        solicitante: actor || "",
      });

      if (res.data?.success && res.data.job?.jobId) {
        const nuevo: Job = {
          ...res.data.job,
          placas: placasElegidas,
          desde,
          hasta,
          solicitante: actor || "",
        };
        setJob(nuevo);
        localStorage.setItem(STORAGE_KEY_JOB, nuevo.jobId);
        toast.success(`Trabajo ${nuevo.jobId} creado. Sigue el avance abajo.`, { id: t });
        cargarHistorial();
      } else {
        toast.error(res.data?.error || "No se pudo iniciar la restauración.", { id: t });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "No se pudo iniciar la restauración.", { id: t });
    } finally {
      setEnviando(false);
    }
  };

  const ui = job ? estadoUI(job.estado) : null;
  const porcentaje =
    job?.progreso && job.progreso.total > 0
      ? Math.round((job.progreso.completadas / job.progreso.total) * 100)
      : 0;

  return (
    <div className="flex flex-col">
      <PanelHeader
        title={
          <span>
            Carga de <span className="text-[#F05A28]">Data</span>
          </span>
        }
        subtitle="Restauración de data histórica de GPS para descarga desde la web de rastreo"
        rightContent={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161719] border border-[#26272B] text-xs text-[#CFCFD3]">
            <Server size={14} className={health?.listo ? "text-[#4ADE80]" : "text-[#F05A28]"} />
            {health ? (
              <span>
                Servicio{" "}
                <strong className={health.listo ? "text-[#4ADE80]" : "text-[#F05A28]"}>
                  {health.listo ? "activo" : "no disponible"}
                </strong>
                {typeof health.colaPendientes === "number" && (
                  <> · {health.colaPendientes} en cola</>
                )}
                {typeof health.discoLibreGb === "number" && (
                  <> · {health.discoLibreGb} GB libres</>
                )}
              </span>
            ) : (
              <span>Consultando servicio...</span>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-5 px-6 pt-5 pb-6">
      {/* ---------- Formulario ---------- */}
      <div
        style={{
          background: "#161719",
          border: "1px solid #26272B",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
            color: "#ECECEE",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <DatabaseBackup size={16} className="text-[#F05A28]" />
          Nueva solicitud de restauración
        </div>

        <div className="flex flex-wrap gap-5">
          {/* Buscador de placas */}
          <div style={{ flex: "1 1 320px", minWidth: 280 }} ref={buscadorRef}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#9B9CA1",
              }}
            >
              Placas <span className="text-[#F05A28]">*</span>
            </label>

            <div style={{ position: "relative", marginTop: 4 }}>
              <input
                value={busquedaPlaca}
                onChange={(e) => {
                  setBusquedaPlaca(e.target.value);
                  setMostrarSugerencias(true);
                }}
                onFocus={() => setMostrarSugerencias(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (sugerencias.length > 0) agregarPlaca(sugerencias[0].placa);
                    else if (busquedaPlaca.trim()) agregarPlaca(busquedaPlaca);
                  }
                }}
                placeholder={cargandoPlacas ? "Cargando placas..." : "Escribe la placa (ej: bam-754) y Enter"}
                style={{
                  width: "100%",
                  fontSize: 13,
                  padding: "8px 34px 8px 12px",
                  borderRadius: 8,
                  background: "#121214",
                  border: "1px solid #2D2E32",
                  color: "#ECECEE",
                  outline: "none",
                }}
              />
              <Search
                size={14}
                style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "#76777C" }}
              />

              {/* Autocompletado */}
              {mostrarSugerencias && busquedaPlaca.trim() && (
                <div
                  style={{
                    position: "absolute",
                    zIndex: 30,
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "#161719",
                    border: "1px solid #26272B",
                    borderRadius: 8,
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                  }}
                >
                  {sugerencias.length > 0 ? (
                    sugerencias.map((p) => (
                      <button
                        key={p.placa}
                        onClick={() => agregarPlaca(p.placa)}
                        style={{
                          display: "flex",
                          width: "100%",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "8px 12px",
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid #222327",
                          color: "#ECECEE",
                          fontSize: 13,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#1D1E21")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ fontFamily: "monospace", textTransform: "uppercase" }}>{p.placa}</span>
                        <span style={{ fontSize: 11, color: "#9B9CA1" }}>
                          {p.cuenta} · {p.servidores.join(", ")}
                        </span>
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() => agregarPlaca(busquedaPlaca)}
                      style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "transparent",
                        border: "none",
                        color: "#CFCFD3",
                        fontSize: 12.5,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <Plus size={13} className="text-[#F05A28]" />
                      No está en la lista. Agregar &quot;{busquedaPlaca.trim().toLowerCase()}&quot; igual
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Placas elegidas */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, minHeight: 28 }}>
              {placasElegidas.length === 0 ? (
                <span style={{ fontSize: 12, color: "#76777C" }}>Ninguna placa agregada todavía</span>
              ) : (
                placasElegidas.map((p) => {
                  const conocida = existeEnCatalogo(p);
                  return (
                    <span
                      key={p}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        background: conocida ? "rgba(240,90,40,0.12)" : "rgba(234,179,8,0.12)",
                        border: `1px solid ${conocida ? "rgba(240,90,40,0.3)" : "rgba(234,179,8,0.35)"}`,
                        color: conocida ? "#F05A28" : "#EAB308",
                      }}
                      title={conocida ? undefined : "Esta placa no aparece en ningún servidor"}
                    >
                      {p}
                      <button
                        onClick={() => quitarPlaca(p)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: 0 }}
                        aria-label={`Quitar ${p}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Fechas (con hora opcional) */}
          <div style={{ flex: "0 0 auto" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {[
                { label: "Desde", value: desde, set: setDesde },
                { label: "Hasta", value: hasta, set: setHasta },
              ].map((campo) => (
                <div key={campo.label}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#9B9CA1",
                    }}
                  >
                    {campo.label} <span className="text-[#F05A28]">*</span>
                  </label>
                  <input
                    type={conHora ? "datetime-local" : "date"}
                    value={campo.value}
                    max={conHora ? `${hoyISO()}T23:59` : hoyISO()}
                    onChange={(e) => campo.set(e.target.value)}
                    style={{
                      display: "block",
                      marginTop: 4,
                      fontSize: 13,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "#121214",
                      border: "1px solid #2D2E32",
                      color: "#ECECEE",
                      outline: "none",
                      colorScheme: "dark",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Por defecto se pide el día completo; marcando esto se elige la hora exacta */}
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                marginTop: 10,
                fontSize: 12,
                color: conHora ? "#F05A28" : "#9B9CA1",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={conHora}
                onChange={(e) => alternarHora(e.target.checked)}
                style={{ accentColor: "#F05A28", width: 14, height: 14, cursor: "pointer" }}
              />
              Especificar hora
            </label>
          </div>

        </div>

        {/* Pie del formulario */}
        <div
          className="flex flex-wrap items-center justify-between gap-3"
          style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #26272B" }}
        >
          <div style={{ fontSize: 12, color: errorFormulario ? "#EAB308" : "#9B9CA1", display: "flex", alignItems: "center", gap: 6 }}>
            {errorFormulario ? (
              <>
                <AlertTriangle size={13} /> {errorFormulario}
              </>
            ) : (
              <>
                <Clock size={13} />
                {placasElegidas.length} placa(s) · {rango ? textoDuracion(rango.desdeMs, rango.hastaMs, conHora) : "—"}
                {estimado && <> · estimado {estimado.min}–{estimado.max} min</>}
                {" · "}la data se borra automáticamente a las 5am
              </>
            )}
          </div>

          <ButtonBase
            variant="primary"
            onClick={iniciarRestauracion}
            disabled={enviando || !!errorFormulario || !!(job && !esFinal(job.estado))}
          >
            <DatabaseBackup size={14} />
            {enviando ? "Enviando..." : "Iniciar restauración"}
          </ButtonBase>
        </div>
      </div>

      {/* ---------- Trabajo en curso ---------- */}
      {job && ui && (
        <div
          style={{
            background: "#161719",
            border: `1px solid ${ui.borde}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #26272B",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {esFinal(job.estado) ? (
                job.estado === "OK" ? (
                  <CheckCircle2 size={16} style={{ color: ui.color }} />
                ) : (
                  <AlertTriangle size={16} style={{ color: ui.color }} />
                )
              ) : (
                <Loader2 size={16} style={{ color: ui.color }} className="animate-spin" />
              )}
              <span style={{ color: "#ECECEE", fontWeight: 600, fontSize: 14 }}>
                Trabajo <span className="font-mono">{job.jobId}</span>
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  padding: "2px 8px",
                  borderRadius: 5,
                  background: ui.fondo,
                  border: `1px solid ${ui.borde}`,
                  color: ui.color,
                }}
              >
                {ui.label}
              </span>
            </div>

            <span style={{ fontSize: 12, color: "#9B9CA1" }}>
              {textoRango(job.desde, job.hasta)}
              {job.placas && job.placas.length > 0 && <> · {job.placas.length} placa(s)</>}
              {!esFinal(job.estado) && <> · se actualiza cada 10 s</>}
            </span>
          </div>

          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Barra de progreso */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#CFCFD3", marginBottom: 6 }}>
                <span>
                  {job.estado === "EN_COLA"
                    ? `En cola${job.trabajosEnColaAntes ? ` · ${job.trabajosEnColaAntes} trabajo(s) antes` : ""}`
                    : job.tablaActual
                    ? `Procesando ${job.tablaActual}`
                    : "Progreso"}
                </span>
                <span className="font-mono">
                  {job.progreso ? `${job.progreso.completadas}/${job.progreso.total} tablas` : "—"}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 6, background: "#121214", border: "1px solid #26272B", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${porcentaje}%`,
                    height: "100%",
                    background: ui.color,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>

            {/* Resumen */}
            <div className="flex flex-wrap gap-x-8 gap-y-2" style={{ fontSize: 12.5, color: "#CFCFD3" }}>
              <span>
                Registros insertados:{" "}
                <strong style={{ color: (job.filasInsertadas ?? 0) > 0 ? "#4ADE80" : "#EAB308" }} className="font-mono">
                  {(job.filasInsertadas ?? 0).toLocaleString("es-PE")}
                </strong>
              </span>
              {job.solicitante && <span>Solicitante: {job.solicitante}</span>}
              {job.inicio && <span>Inicio: <span className="font-mono">{formatFecha(job.inicio)}</span></span>}
              {job.fin && <span>Fin: <span className="font-mono">{formatFecha(job.fin)}</span></span>}
              {duracion(job.inicio, job.fin) && <span>Duración: {duracion(job.inicio, job.fin)}</span>}
            </div>

            {/* Mensajes finales */}
            {job.estado === "OK" && (job.filasInsertadas ?? 0) === 0 && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(234,179,8,0.1)",
                  border: "1px solid rgba(234,179,8,0.3)",
                  color: "#EAB308",
                  fontSize: 12.5,
                }}
              >
                Terminó bien, pero no se insertó ningún registro: esas placas no tuvieron data en ese rango.
                Avísale eso al cliente.
              </div>
            )}
            {job.estado === "OK" && (job.filasInsertadas ?? 0) > 0 && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(74,222,128,0.1)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  color: "#4ADE80",
                  fontSize: 12.5,
                }}
              >
                Listo. El cliente ya puede descargar desde la web de rastreo. La data se borra a las 5am,
                así que dale plazo hasta medianoche.
              </div>
            )}
            {job.error && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#EF4444",
                  fontSize: 12.5,
                }}
              >
                {job.error}
              </div>
            )}

            {/* Detalle por tabla */}
            {job.detalle && job.detalle.length > 0 && (
              <div style={{ border: "1px solid #26272B", borderRadius: 8, overflow: "hidden" }}>
                {job.detalle.map((d) => (
                  <div
                    key={d.tabla}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 12px",
                      borderBottom: "1px solid #222327",
                      fontSize: 12.5,
                    }}
                  >
                    <span style={{ fontFamily: "monospace", color: "#ECECEE" }}>{d.tabla}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 12, color: "#9B9CA1" }}>
                      {typeof d.filasInsertadas === "number" && (
                        <span className="font-mono">{d.filasInsertadas.toLocaleString("es-PE")} filas</span>
                      )}
                      {typeof d.segundos === "number" && <span className="font-mono">{d.segundos} s</span>}
                      <span
                        style={{
                          color: d.estado === "OK" ? "#4ADE80" : d.estado === "ERROR" ? "#EF4444" : "#F05A28",
                        }}
                      >
                        {ESTADO_TABLA[d.estado] || d.estado}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Historial ---------- */}
      <div
        style={{
          background: "#161719",
          border: "1px solid #26272B",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #26272B",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "#ECECEE", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <History size={15} className="text-[#F05A28]" />
            Trabajos recientes
          </span>
          <button
            onClick={cargarHistorial}
            disabled={cargandoHistorial}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 6,
              background: "#121214",
              border: "1px solid #2D2E32",
              color: "#CFCFD3",
              fontSize: 12,
              cursor: cargandoHistorial ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={12} className={cargandoHistorial ? "animate-spin text-[#F05A28]" : undefined} />
            Actualizar
          </button>
        </div>

        {historial.length === 0 ? (
          <div style={{ padding: "18px 20px", fontSize: 13, color: "#76777C" }}>
            {cargandoHistorial ? "Cargando trabajos..." : "Todavía no hay trabajos registrados."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg, #7A3A10 0%, #6A310D 100%)", color: "#FFFFFF", textAlign: "left" }}>
                  {["Trabajo", "Estado", "Placas", "Rango", "Registros", "Solicitante", "Creado"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "9px 14px",
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => {
                  const hui = estadoUI(h.estado);
                  return (
                    <tr
                      key={h.jobId}
                      onClick={() => {
                        setJob(h);
                        if (!esFinal(h.estado)) localStorage.setItem(STORAGE_KEY_JOB, h.jobId);
                      }}
                      style={{ color: "#CFCFD3", cursor: "pointer" }}
                      className="hover:bg-[#1D1E21] transition-colors"
                    >
                      <td style={{ padding: "9px 14px", borderBottom: "1px solid #222327", fontFamily: "monospace", color: "#ECECEE" }}>
                        {h.jobId}
                      </td>
                      <td style={{ padding: "9px 14px", borderBottom: "1px solid #222327" }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 5,
                            background: hui.fondo,
                            border: `1px solid ${hui.borde}`,
                            color: hui.color,
                          }}
                        >
                          {hui.label}
                        </span>
                      </td>
                      <td style={{ padding: "9px 14px", borderBottom: "1px solid #222327", textTransform: "uppercase", fontFamily: "monospace" }}>
                        {(h.placas || []).slice(0, 3).join(", ")}
                        {(h.placas || []).length > 3 && ` +${(h.placas || []).length - 3}`}
                      </td>
                      <td style={{ padding: "9px 14px", borderBottom: "1px solid #222327", whiteSpace: "nowrap" }} className="font-mono text-[11px]">
                        {textoRango(h.desde, h.hasta)}
                      </td>
                      <td style={{ padding: "9px 14px", borderBottom: "1px solid #222327" }} className="font-mono">
                        {(h.filasInsertadas ?? 0).toLocaleString("es-PE")}
                      </td>
                      <td style={{ padding: "9px 14px", borderBottom: "1px solid #222327" }}>
                        {h.solicitante || "—"}
                      </td>
                      <td style={{ padding: "9px 14px", borderBottom: "1px solid #222327", whiteSpace: "nowrap" }} className="font-mono text-[11px]">
                        {formatFecha(h.creado)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
