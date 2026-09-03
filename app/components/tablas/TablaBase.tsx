"use client";

import { Loader2 } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";

type Column<T> = {
  key: keyof T | string;
  label: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
};

type TablaBaseProps<T> = {
  columns: Column<T>[];
  data: T[];
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  loading?: boolean;
  filasPorPagina?: number;
  cellColor?: string;
};

export default function TablaBase<T>({
  columns,
  data,
  leftActions,
  rightActions,
  loading,
  filasPorPagina = 50,
  cellColor = "#ADB5BD",
}: TablaBaseProps<T>) {
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(filasPorPagina);

  useEffect(() => { setPaginaActual(1); }, [registrosPorPagina]);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(data.length / registrosPorPagina));
    if (paginaActual > total) setPaginaActual(total);
  }, [data, registrosPorPagina, paginaActual]);

  const totalPaginas = Math.max(1, Math.ceil(data.length / registrosPorPagina));

  const dataPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return data.slice(inicio, inicio + registrosPorPagina);
  }, [paginaActual, data, registrosPorPagina]);

  const paginasVisibles = useMemo(() => {
    if (totalPaginas <= 7)
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    const r: (number | "...")[] = [];
    const add = (n: number) => !r.includes(n) && r.push(n);
    add(1);
    if (paginaActual > 3) r.push("...");
    for (let i = Math.max(2, paginaActual - 1); i <= Math.min(totalPaginas - 1, paginaActual + 1); i++) add(i);
    if (paginaActual < totalPaginas - 2) r.push("...");
    add(totalPaginas);
    return r;
  }, [paginaActual, totalPaginas]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, gap: 10, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ---------- ACCIONES ---------- */}
      {(leftActions || rightActions) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>{leftActions}</div>
          <div>{rightActions}</div>
        </div>
      )}

      {/* ---------- TABLA ---------- */}
      <div style={{ flex: 1, minHeight: 0, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "#1C1F26", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* CABECERA FIJA */}
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#643100" }}>
              <th style={{ width: 44, padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#f7eddb", fontSize: 11 }}>N°</th>
              {columns.map((col) => (
                <th key={String(col.key)} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#f7eddb", fontSize: 11 }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* BODY SCROLLABLE */}
        <div className="velsat-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ padding: "40px 0", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#8A9099" }}>
                      <Loader2 style={{ width: 22, height: 22, color: "#E85D2F", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: 13 }}>Cargando datos...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ padding: "40px 0", textAlign: "center", color: "#8A9099", fontSize: 13 }}>
                    No hay registros
                  </td>
                </tr>
              ) : (
                dataPagina.map((row, i) => (
                  <tr
                    key={i}
                    style={{ transition: "background 0.12s" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(232,93,47,0.05)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                  >
                    <td style={{ width: 44, padding: "5px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#8A9099", fontSize: 11 }}>
                      {i + 1 + (paginaActual - 1) * registrosPorPagina}
                    </td>
                    {columns.map((col) => (
                      <td key={String(col.key)} style={{ padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: cellColor, wordBreak: "break-word", whiteSpace: "normal" }}>
                        {col.render ? col.render(row, i) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- PAGINACIÓN ---------- */}
      {data.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 2px", fontSize: 12, color: "#8A9099", flexWrap: "wrap", gap: 8 }}>
          <span>Total registros: <strong style={{ color: "#F4F5F7" }}>{data.length}</strong></span>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <PagBtn onClick={() => setPaginaActual(1)} disabled={paginaActual === 1}>«</PagBtn>
            {paginasVisibles.map((p, i) =>
              p === "..." ? (
                <span key={i} style={{ padding: "0 6px", color: "#8A9099" }}>...</span>
              ) : (
                <PagBtn key={`${p}-${i}`} onClick={() => setPaginaActual(p as number)} active={p === paginaActual}>{p}</PagBtn>
              )
            )}
            <PagBtn onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas}>»</PagBtn>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ whiteSpace: "nowrap", color: "#8A9099" }}>Registros por página:</span>
            <select
              value={registrosPorPagina}
              onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
              style={{ borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "#1C1F26", padding: "4px 8px", fontSize: 12, color: "#F4F5F7", outline: "none", cursor: "pointer" }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Scrollbar personalizado Velsat ── */
        .velsat-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .velsat-scroll::-webkit-scrollbar-track {
          background: #0A0C0F;
          border-radius: 99px;
        }
        .velsat-scroll::-webkit-scrollbar-thumb {
          background: #643100;
          border-radius: 99px;
        }
        .velsat-scroll::-webkit-scrollbar-thumb:hover {
          background: #E85D2F;
        }
        /* Firefox */
        .velsat-scroll {
          scrollbar-width: thin;
          scrollbar-color: #643100 #0A0C0F;
        }
      `}</style>
    </div>
  );
}

/* ---------- BOTÓN PAGINACIÓN ---------- */
function PagBtn({ children, onClick, disabled, active }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "4px 9px",
        borderRadius: 6,
        border: active ? "1px solid #E85D2F" : "1px solid rgba(255,255,255,0.08)",
        background: active ? "#621708" : "transparent",
        color: active ? "#fff" : "#ADB5BD",
        fontSize: 12,
        fontWeight: active ? 700 : 400,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        transition: "background 0.12s, color 0.12s",
      }}
      onMouseEnter={e => { if (!disabled && !active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.1)"; }}
      onMouseLeave={e => { if (!disabled && !active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}