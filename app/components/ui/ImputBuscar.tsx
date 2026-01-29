"use client";

import { Search } from "lucide-react";

type InputBuscarProps = {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  desabilitar?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ImputBuscar({
  label,
  placeholder = "Buscar...",
  value,
  defaultValue,
  desabilitar,
  onChange,
}: InputBuscarProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-bold text-foreground">
          {label}
        </label>
      )}

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-950"
        />

        <input
          type="search"
          disabled={desabilitar}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          className="block w-full text-sm pl-9 py-2 bg-slate-800/10 border border-slate-700/40 rounded-sm text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/60 transition-all"
        />
      </div>
    </div>
  );
}
