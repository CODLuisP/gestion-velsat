"use client";

import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";

export type Column<T> = {
  key: keyof T | string;
  label: React.ReactNode;
  width?: string | number;
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
  showIndex?: boolean;
};

export default function TablaBase<T>({
  columns,
  data,
  leftActions,
  rightActions,
  loading,
  filasPorPagina = 50,
  cellColor = "#CFCFD3",
  showIndex = true,
}: TablaBaseProps<T>) {
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(filasPorPagina);

  useEffect(() => {
    setPaginaActual(1);
  }, [registrosPorPagina]);

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
    for (
      let i = Math.max(2, paginaActual - 1);
      i <= Math.min(totalPaginas - 1, paginaActual + 1);
      i++
    )
      add(i);
    if (paginaActual < totalPaginas - 2) r.push("...");
    add(totalPaginas);
    return r;
  }, [paginaActual, totalPaginas]);

  const inicio = data.length === 0 ? 0 : (paginaActual - 1) * registrosPorPagina + 1;
  const fin = Math.min(paginaActual * registrosPorPagina, data.length);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#161719] border border-[#26272B] rounded-[12px] overflow-hidden">
      {/* ---------- TOOLBAR (ARRIBA) ---------- */}
      {(leftActions || rightActions) && (
        <div className="px-5 py-3.5 border-b border-[#26272B] bg-[#161719] flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            {leftActions}
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {rightActions}
          </div>
        </div>
      )}

      {/* ---------- CABECERA FIJA Y BODY SCROLLABLE ---------- */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {/* CABECERA CON DEGRADADO #7A3A10 -> #6A310D */}
        <div
          className="flex-shrink-0 z-10"
          style={{
            background: "linear-gradient(90deg, #7A3A10 0%, #6A310D 100%)",
          }}
        >
          <table className="w-full table-fixed border-collapse select-none">
            <thead>
              <tr className="text-white text-[11px] font-bold uppercase tracking-[0.08em] h-[40px]">
                {showIndex && (
                  <th className="w-[48px] px-3.5 text-left font-bold text-white">
                    N°
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    style={{ width: col.width }}
                    className="px-3.5 py-2 text-left font-bold text-white truncate"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* CUERPO CON SCROLL */}
        <div className="flex-1 min-h-0 overflow-y-auto velsat-scroll bg-[#161719]">
          <table className="w-full table-fixed border-collapse text-[13.5px] select-text">
            <tbody className="select-text">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (showIndex ? 1 : 0)}
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 text-[#9B9CA1]">
                      <Loader2 className="w-6 h-6 text-[#F05A28] animate-spin" />
                      <span className="text-[13px]">Cargando datos...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (showIndex ? 1 : 0)}
                    className="py-16 text-center text-[#9B9CA1] text-[13px]"
                  >
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                dataPagina.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#222327] hover:bg-[#1D1E21] transition-colors duration-100 group select-text"
                  >
                    {showIndex && (
                      <td className="w-[48px] px-3.5 py-2.5 text-[#9B9CA1] font-mono text-[12px] truncate select-text">
                        {inicio + i}
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        style={{ width: col.width, color: cellColor }}
                        className="px-3.5 py-2.5 align-middle select-text"
                      >
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

      {/* ---------- FOOTER CON PAGINACIÓN ---------- */}
      {data.length > 0 && (
        <div className="h-[52px] min-h-[52px] px-5 border-t border-[#26272B] bg-[#161719] flex items-center justify-between gap-4 flex-wrap flex-shrink-0 text-[13px] text-[#9B9CA1]">
          <div className="flex items-center gap-4">
            <span>
              Mostrando <strong className="text-[#ECECEE] font-mono font-medium">{inicio}–{fin}</strong> de{" "}
              <strong className="text-[#ECECEE] font-mono font-medium">{data.length}</strong>
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#76777C]">Filas</span>
              <select
                value={registrosPorPagina}
                onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
                className="bg-[#121214] border border-[#2D2E32] rounded-[8px] px-2 py-1 text-xs font-mono text-[#ECECEE] outline-none cursor-pointer hover:border-[#F05A28] transition-colors"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n} className="bg-[#161719]">
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <PagBtn
              onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
              title="Página anterior"
            >
              <ChevronLeft size={14} />
            </PagBtn>

            {paginasVisibles.map((p, i) =>
              p === "..." ? (
                <span key={i} className="px-1.5 text-[#76777C] font-mono">
                  ...
                </span>
              ) : (
                <PagBtn
                  key={`${p}-${i}`}
                  onClick={() => setPaginaActual(p as number)}
                  active={p === paginaActual}
                >
                  {p}
                </PagBtn>
              )
            )}

            <PagBtn
              onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
              disabled={paginaActual === totalPaginas}
              title="Página siguiente"
            >
              <ChevronRight size={14} />
            </PagBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PagBtn({
  children,
  onClick,
  disabled,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-[32px] h-[32px] rounded-[7px] text-xs font-mono font-medium flex items-center justify-center transition-colors cursor-pointer select-none ${
        active
          ? "bg-[#7A2410] border border-[#F05A28] text-white font-bold"
          : "bg-[#161719] border border-[#26272B] text-[#9B9CA1] hover:text-[#ECECEE] hover:bg-[#212226]"
      } ${disabled ? "opacity-30 cursor-not-allowed pointer-events-none" : ""}`}
    >
      {children}
    </button>
  );
}