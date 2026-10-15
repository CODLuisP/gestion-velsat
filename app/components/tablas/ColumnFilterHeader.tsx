"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, Search } from "lucide-react";

type Props = {
  label: string;
  options: string[];
  selected: Set<string> | null; // null = sin filtro (todos)
  onChange: (selected: Set<string> | null) => void;
};

export default function ColumnFilterHeader({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Set<string>>(new Set(selected ?? options));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const active = selected !== null && selected.size < options.length;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filteredOptions = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const allChecked = draft.size === options.length;

  const openDropdown = () => {
    setDraft(new Set(selected ?? options));
    setSearch("");
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  };

  const toggleAll = () => {
    setDraft(allChecked ? new Set() : new Set(options));
  };

  const toggleOne = (opt: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  const handleAceptar = () => {
    onChange(draft.size === options.length ? null : new Set(draft));
    setOpen(false);
  };

  const handleCancelar = () => setOpen(false);

  const handleLimpiar = () => {
    setDraft(new Set(options));
    setSearch("");
  };

  return (
    <div ref={wrapperRef} className="inline-flex items-center gap-1.5 relative">
      <span>{label}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          openDropdown();
        }}
        className="flex items-center justify-center p-0.5 bg-transparent border-0 cursor-pointer transition-opacity"
        style={{
          color: active ? "#F05A28" : "#ffffff",
          opacity: active ? 1 : 0.8,
        }}
        title="Filtrar"
      >
        <Filter size={11} fill={active ? "#F05A28" : "none"} />
      </button>

      {open && pos && (
        <div
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: 240,
            background: "#161719",
            border: "1px solid #26272B",
            borderRadius: 8,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            zIndex: 1000,
            padding: 12,
            fontWeight: 400,
            textTransform: "none",
            fontSize: 12,
            color: "#ECECEE",
            letterSpacing: "normal",
          }}
        >
          <div className="relative mb-2">
            <Search size={13} className="absolute top-2.5 left-2.5 text-[#76777C]" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-[#121214] border border-[#2D2E32] rounded-[6px] text-[#ECECEE] pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-[#F05A28]"
            />
          </div>

          <div style={{ maxHeight: 200, overflowY: "auto" }} className="velsat-scroll">
            <label className="flex items-center gap-2 py-1.5 px-1 cursor-pointer font-bold border-b border-[#26272B] mb-1 text-[12px] text-[#ECECEE]">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-[#F05A28]" />
              (Seleccionar todo)
            </label>

            {filteredOptions.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 py-1 px-1 cursor-pointer hover:bg-[#1D1E21] rounded text-[12px] text-[#CFCFD3]"
              >
                <input
                  type="checkbox"
                  checked={draft.has(opt)}
                  onChange={() => toggleOne(opt)}
                  className="accent-[#F05A28]"
                />
                <span className="truncate">{opt}</span>
              </label>
            ))}

            {filteredOptions.length === 0 && (
              <div className="py-2 px-1 text-[#76777C] text-xs">Sin resultados</div>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#26272B] gap-2">
            <button
              onClick={handleLimpiar}
              className="bg-transparent border-0 text-[#9B9CA1] hover:text-[#ECECEE] text-xs cursor-pointer py-1 px-1 transition-colors"
            >
              Limpiar
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleCancelar}
                className="bg-[#1D1E21] border border-[#26272B] text-[#CFCFD3] hover:text-[#ECECEE] rounded-[6px] px-2.5 py-1 text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAceptar}
                className="bg-[#F05A28] hover:bg-[#FF6A35] text-white font-semibold rounded-[6px] px-2.5 py-1 text-xs cursor-pointer transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
