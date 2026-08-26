"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import axios from "axios";
import { History } from "lucide-react";
import { Role } from "@/app/constants/roles";
import { getAuditoriaApi } from "@/app/services/auditoriaApi";
import ImputBuscar from "@/app/components/ui/ImputBuscar";

type Props = {
  role: Role;
};

type AuditoriaGeneral = {
  id: number;
  usuario: string;
  modulo: string;
  accion: string;
  entidad: string | null;
  detalle: string | null;
  fecharegistro: string;
};

const MODULOS = ["Usuarios", "SubUsuarios", "Unidades", "Sutran", "Goldcar", "Osinergmin"];

const CELL: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 12,
  color: "#ADB5BD",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  verticalAlign: "middle",
  textAlign: "left",
};

const HEADER: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "#8A9099",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  whiteSpace: "nowrap",
  textAlign: "left",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function AccionBadge({ accion }: { accion: string }) {
  const colores: Record<string, { bg: string; fg: string; border: string }> = {
    Crear: { bg: "rgba(46,204,113,0.12)", fg: "#2ecc71", border: "rgba(46,204,113,0.3)" },
    Habilitar: { bg: "rgba(46,204,113,0.12)", fg: "#2ecc71", border: "rgba(46,204,113,0.3)" },
    Actualizar: { bg: "rgba(232,180,47,0.12)", fg: "#E8B42F", border: "rgba(232,180,47,0.3)" },
    Eliminar: { bg: "rgba(232,93,47,0.12)", fg: "#E85D2F", border: "rgba(232,93,47,0.3)" },
    Deshabilitar: { bg: "rgba(232,93,47,0.12)", fg: "#E85D2F", border: "rgba(232,93,47,0.3)" },
  };
  const c = colores[accion] ?? { bg: "rgba(255,255,255,0.06)", fg: "#ADB5BD", border: "rgba(255,255,255,0.15)" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
      }}
    >
      {accion}
    </span>
  );
}

export default function AuditoriaClient({ role }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState<string>("");

  const api = getAuditoriaApi(role);

  const fetchAuditoria = async () => {
    const res = await axios.get<AuditoriaGeneral[]>(api.list(300, moduloFiltro || undefined));
    return res.data;
  };

  const { data: registros = [], isLoading } = useSWR(
    ["auditoria", role, moduloFiltro],
    fetchAuditoria,
    { revalidateOnFocus: false, keepPreviousData: true, refreshInterval: 30000 }
  );

  const registrosFiltrados = useMemo(() => {
    if (!busqueda) return registros;
    return registros.filter((r) =>
      [r.usuario, r.modulo, r.accion, r.entidad, r.detalle]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [busqueda, registros]);

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Título */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#F4F5F7" }}>
            <History size={22} style={{ color: "#E85D2F" }} />
            Auditoría
          </h1>
          <p style={{ color: "#8A9099", fontSize: 13, marginTop: 4 }}>
            Registro de movimientos del sistema — quién hizo qué y cuándo
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div
        style={{
          background: "#1C1F26",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div style={{ width: 320 }}>
            <ImputBuscar
              placeholder="Buscar por usuario, módulo, acción o detalle"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#8A9099", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Módulo
            </label>
            <select
              value={moduloFiltro}
              onChange={(e) => setModuloFiltro(e.target.value)}
              style={{
                background: "#0A0C0F",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F4F5F7",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                minWidth: 180,
              }}
            >
              <option value="">Todos los módulos</option>
              {MODULOS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div
        style={{
          background: "#1C1F26",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "#F4F5F7", fontWeight: 600, fontSize: 14 }}>
            Movimientos recientes
          </span>
          <span
            style={{
              fontSize: 12,
              color: "#8A9099",
              background: "rgba(255,255,255,0.05)",
              padding: "2px 10px",
              borderRadius: 20,
            }}
          >
            {isLoading ? "..." : `${registrosFiltrados.length} ${registrosFiltrados.length === 1 ? "registro" : "registros"}`}
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#8A9099", fontSize: 13 }}>
            Cargando...
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#8A9099", fontSize: 13 }}>
            No hay movimientos registrados.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                  <th style={HEADER}>Fecha</th>
                  <th style={HEADER}>Usuario</th>
                  <th style={HEADER}>Módulo</th>
                  <th style={HEADER}>Acción</th>
                  <th style={HEADER}>Entidad</th>
                  <th style={HEADER}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((r) => (
                  <tr
                    key={r.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                  >
                    <td style={{ ...CELL, whiteSpace: "nowrap" }}>{formatDate(r.fecharegistro)}</td>
                    <td style={{ ...CELL, color: "#F4F5F7", fontWeight: 600 }}>{r.usuario}</td>
                    <td style={CELL}>{r.modulo}</td>
                    <td style={CELL}><AccionBadge accion={r.accion} /></td>
                    <td style={CELL}>{r.entidad ?? "—"}</td>
                    <td style={{ ...CELL, maxWidth: 360, whiteSpace: "normal", wordBreak: "break-word" }}>
                      {r.detalle ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
