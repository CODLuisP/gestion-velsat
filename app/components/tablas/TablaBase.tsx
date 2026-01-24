"use client";

import React, { useState, useMemo, useEffect } from "react";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
};

type TablaBaseProps<T> = {
  columns: Column<T>[];
  data: T[];
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  mensajeDefaul?: string;
  filasPorPagina?: number;
};

export default function TablaBase<T>({
  columns,
  data,
  leftActions,
  rightActions,
  mensajeDefaul = "Seleccione un servidor",
  filasPorPagina = 50,
}: TablaBaseProps<T>) {
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] =
    useState(filasPorPagina);

  useEffect(() => {
    setPaginaActual(1);
  }, [data, registrosPorPagina]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(data.length / registrosPorPagina)
  );

  const dataPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return data.slice(inicio, inicio + registrosPorPagina);
  }, [paginaActual, data, registrosPorPagina]);

  /* ========= PAGINACIÓN SIN DUPLICADOS ========= */
  const paginasVisibles = useMemo(() => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }

    const r: (number | "...")[] = [];
    const add = (n: number) => !r.includes(n) && r.push(n);

    add(1);
    if (paginaActual > 3) r.push("...");

    for (
      let i = Math.max(2, paginaActual - 1);
      i <= Math.min(totalPaginas - 1, paginaActual + 1);
      i++
    ) add(i);

    if (paginaActual < totalPaginas - 2) r.push("...");
    add(totalPaginas);

    return r;
  }, [paginaActual, totalPaginas]);
  /* =========================================== */

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">

      {(leftActions || rightActions) && (
        <div className="flex items-center justify-between">
          <div>{leftActions}</div>
          <div>{rightActions}</div>
        </div>
      )}

      {/* ===== TABLA ===== */}
      <div className="flex-1 min-h-0 rounded-lg border border-zinc-200/70 bg-white flex flex-col">

        {/* ===== CABECERA FIJA ===== */}
        <table className="w-full table-fixed text-xs border-collapse flex-none">
          <thead className="bg-slate-300/80">
            <tr className="text-slate-800">
              <th className="w-12 px-4 py-2 text-left font-semibold border-b border-zinc-200/70">
                N°
              </th>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-2 text-left font-semibold border-b border-zinc-200/70"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* ===== BODY SCROLLABLE ===== */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full table-fixed text-xs border-collapse">
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="py-10 text-center text-zinc-400"
                  >
                    {mensajeDefaul}
                  </td>
                </tr>
              ) : (
                dataPagina.map((row, i) => (
                  <tr
                    key={i}
                    className="transition-colors hover:bg-emerald-100/40"
                  >
                    <td className="w-12 px-4 py-2 border-b border-zinc-100 text-zinc-700">
                      {i + 1 + (paginaActual - 1) * registrosPorPagina}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className="px-4 py-2 border-b border-zinc-100 text-zinc-700 whitespace-normal wrap-break-word"
                      >
                        {col.render
                          ? col.render(row, i)
                          : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PAGINACIÓN FIJA ABAJO ===== */}
      {data.length > 0 && (
        <div className="flex items-center justify-between text-[14px] text-zinc-500 px-2 py-1  border-zinc-200">

          <span>Total: {data.length}</span>

          <div className="flex items-center gap-1">
            <button
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual(1)}
              className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30"
            >
              «
            </button>

            {paginasVisibles.map((p, i) =>
              p === "..." ? (
                <span key={i} className="px-2 text-zinc-400">
                  ...
                </span>
              ) : (
                <button
                  key={`${p}-${i}`}
                  onClick={() => setPaginaActual(p)}
                  className={`px-2 py-1 rounded border border-zinc-200 transition-colors ${
                    p === paginaActual
                      ? "bg-sky-600 text-white border-sky-600"
                      : "hover:bg-zinc-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual(totalPaginas)}
              className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30"
            >
              »
            </button>
          </div>

          <select
            value={registrosPorPagina}
            onChange={(e) =>
              setRegistrosPorPagina(Number(e.target.value))
            }
            className="rounded border border-zinc-200 bg-white px-1 py-0.5 outline-none"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

        </div>
      )}
    </div>
  );
}
