"use client";

import React, { useState, useMemo } from "react";
import ButtonBase from "../ui/ButtonBase";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
};

type TablaBaseProps<T> = {
  title?: string;
  columns: Column<T>[];
  data: T[];
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  mensajeDefaul?: string;
  alturaCuerpo?: string;
  filasPorPagina?: number;
};

export default function TablaBase<T>({
  title,
  columns,
  data,
  leftActions,
  rightActions,
  mensajeDefaul,
  alturaCuerpo = "400px",
  filasPorPagina = 50,
}: TablaBaseProps<T>) {
  const [paginaActual, setPaginaActual] = useState(1);

  const totalPaginas = Math.ceil(data.length / filasPorPagina);

  const dataPagina = useMemo(() => {
    const start = (paginaActual - 1) * filasPorPagina;
    return data.slice(start, start + filasPorPagina);
  }, [paginaActual, data, filasPorPagina]);
console.log(dataPagina)
  const handleAnterior = () => setPaginaActual((p) => Math.max(p - 1, 1));
  const handleSiguiente = () => setPaginaActual((p) => Math.min(p + 1, totalPaginas));

  return (
    <div className="space-y-4 max-w-full">
      {/* TÍTULO */}
      {title && <h2 className="text-2xl font-bold">{title}</h2>}

      {/* ACCIONES */}
      {(leftActions || rightActions) && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
          <div>{leftActions}</div>
          <div>{rightActions}</div>
        </div>
      )}

      {/* TABLA */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 max-w-full">
        <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
          <table className="min-w-full table-fixed border-collapse text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-900 sticky top-0 z-10">
              <tr>
                <th className="w-12 px-4 py-3 text-left font-semibold border-r border-zinc-300 dark:border-zinc-700">
                  #
                </th>
                {columns.map((col, idx) => (
                  <th
                    key={String(col.key)}
                    className="px-4 py-3 text-left font-semibold border-r border-zinc-300 dark:border-zinc-700 break-words"
                    style={{ maxWidth: "150px" }} // ancho máximo de columna
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {dataPagina.map((row, i) => (
                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="w-12 px-4 py-2 border-r border-zinc-200 dark:border-zinc-700">
                    {i + 1 + (paginaActual - 1) * filasPorPagina}
                  </td>
                  {columns.map((col, idx) => (
                    <td
                      key={String(col.key)}
                      className="px-4 py-2 border-r border-zinc-200 dark:border-zinc-700 break-words"
                      style={{ maxWidth: "150px" }}
                    >
                      {col.render ? col.render(row, i) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* PAGINACIÓN SIMPLE */}
      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
        {/* Total de filas a la izquierda */}
        <div className="text-zinc-500">Total de filas: {data.length}</div>

        {/* Botones anterior/siguiente a la derecha */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <ButtonBase variant="secondary" onClick={handleAnterior} disabled={paginaActual === 1}>
            Anterior
          </ButtonBase>

          <ButtonBase
            variant="secondary"
            onClick={handleSiguiente}
            disabled={paginaActual === totalPaginas || totalPaginas === 0}
          >
            Siguiente
          </ButtonBase>
          
        </div>
      </div>
    </div>
  );
}
