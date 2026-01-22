"use client";

import React from "react";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type TablaBaseProps<T> = {
  title?: string;
  columns: Column<T>[];
  data: T[];
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  mensajeDefaul?: string;
};

export default function TablaBase<T>({
  title,
  columns,
  data,
  leftActions,
  rightActions,
  mensajeDefaul,
}: TablaBaseProps<T>) {
  return (
    <div className="space-y-4">
      {/* 1️⃣ TÍTULO */}
      {title && (
        <h2 className="text-2xl font-bold">
          {title}
        </h2>
      )}

      {/* 2️⃣ BUSCAR + AGREGAR */}
      {(leftActions || rightActions) && (
        <div className="flex items-center justify-between">
          <div>{leftActions}</div>
          <div>{rightActions}</div>
        </div>
      )}

      {/* 3️⃣ TABLA */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-900">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left font-semibold"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-zinc-500"
                >
                  {
                    mensajeDefaul ? mensajeDefaul : "No se encontraron datos"
                  }
                </td>
              </tr>
            )}

            {data.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-4 py-3"
                  >
                    {col.render
                      ? col.render(row)
                      : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
