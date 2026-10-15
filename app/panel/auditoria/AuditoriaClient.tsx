"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import axios from "axios";
import { Role } from "@/app/constants/roles";
import { getAuditoriaApi } from "@/app/services/auditoriaApi";
import ImputBuscar from "@/app/components/ui/ImputBuscar";
import PanelHeader from "@/app/components/nav/PanelHeader";

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
  fontSize: 12.5,
  color: "#CFCFD3",
  borderBottom: "1px solid #222327",
  verticalAlign: "middle",
  textAlign: "left",
};

const HEADER: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#FFFFFF",
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
    Crear: { bg: "rgba(74,222,128,0.12)", fg: "#4ADE80", border: "rgba(74,222,128,0.3)" },
    Habilitar: { bg: "rgba(74,222,128,0.12)", fg: "#4ADE80", border: "rgba(74,222,128,0.3)" },
    Actualizar: { bg: "rgba(234,179,8,0.12)", fg: "#EAB308", border: "rgba(234,179,8,0.3)" },
    Eliminar: { bg: "rgba(240,90,40,0.12)", fg: "#F05A28", border: "rgba(240,90,40,0.3)" },
    Deshabilitar: { bg: "rgba(240,90,40,0.12)", fg: "#F05A28", border: "rgba(240,90,40,0.3)" },
  };
  const c = colores[accion] ?? { bg: "rgba(255,255,255,0.06)", fg: "#9B9CA1", border: "rgba(255,255,255,0.12)" };
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
    <div className="flex flex-col gap-5">
      {/* Título */}
      <PanelHeader
        title={
          <span>
            Registro de <span className="text-[#F05A28]">Auditoría</span>
          </span>
        }
        subtitle="Historial de operaciones y cambios de usuarios en la plataforma"
      />

      {/* Filtros */}
      <div
        style={{
          background: "#161719",
          border: "1px solid #26272B",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div style={{ width: 340 }}>
            <ImputBuscar
              placeholder="Buscar por usuario, módulo, acción o detalle"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#9B9CA1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Módulo
            </label>
            <select
              value={moduloFiltro}
              onChange={(e) => setModuloFiltro(e.target.value)}
              style={{
                background: "#121214",
                border: "1px solid #2D2E32",
                color: "#ECECEE",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                minWidth: 190,
                outline: "none",
              }}
            >
              <option value="" className="bg-[#121214] text-[#76777C]">Todos los módulos</option>
              {MODULOS.map((m) => (
                <option key={m} value={m} className="bg-[#121214] text-[#ECECEE]">{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
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
          <span style={{ color: "#ECECEE", fontWeight: 600, fontSize: 14 }}>
            Movimientos recientes
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#9B9CA1",
              background: "#121214",
              border: "1px solid #26272B",
              padding: "2px 10px",
              borderRadius: 20,
              fontFamily: "monospace",
            }}
          >
            {isLoading ? "..." : `${registrosFiltrados.length} ${registrosFiltrados.length === 1 ? "registro" : "registros"}`}
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#76777C", fontSize: 13 }}>
            Cargando movimientos de auditoría...
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#76777C", fontSize: 13 }}>
            No hay movimientos registrados.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg, #7A3A10 0%, #6A310D 100%)" }}>
                  <th style={HEADER}>Fecha</th>
                  <th style={HEADER}>Usuario</th>
                  <th style={HEADER}>Módulo</th>
                  <th style={HEADER}>Acción</th>
                  <th style={HEADER}>Entidad</th>
                  <th style={HEADER}>Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222327]">
                {registrosFiltrados.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[#1D1E21] transition-colors"
                  >
                    <td style={{ ...CELL, whiteSpace: "nowrap", fontFamily: "monospace", color: "#9B9CA1", fontSize: 11.5 }}>
                      {formatDate(r.fecharegistro)}
                    </td>
                    <td style={{ ...CELL, color: "#ECECEE", fontWeight: 600 }}>{r.usuario}</td>
                    <td style={{ ...CELL, color: "#CFCFD3" }}>{r.modulo}</td>
                    <td style={CELL}><AccionBadge accion={r.accion} /></td>
                    <td style={{ ...CELL, fontFamily: "monospace", color: "#ECECEE" }}>{r.entidad ?? "—"}</td>
                    <td style={{ ...CELL, maxWidth: 360, whiteSpace: "normal", wordBreak: "break-word", color: "#9B9CA1" }}>
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
