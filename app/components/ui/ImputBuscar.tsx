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
  placeholder = "Buscar por cuenta, nombre, RUC o correo",
  value,
  defaultValue,
  desabilitar,
  onChange,
}: InputBuscarProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-[11px] font-bold tracking-wider uppercase text-[#76777C]">
          {label}
        </label>
      )}

      <div className="relative w-full">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777C] pointer-events-none"
        />

        <input
          type="search"
          disabled={desabilitar}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          className="w-full h-[36px] pl-9 pr-3.5 bg-[#121214] border border-[#2D2E32] rounded-[8px] text-[13px] text-[#ECECEE] placeholder-[#76777C] outline-none transition-colors focus:border-[#F05A28] disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}