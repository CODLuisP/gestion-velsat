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
    <div ref={wrapperRef} style={{ display: "inline-flex", alignItems: "center", gap: 6, position: "relative" }}>
      <span>{label}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          openDropdown();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          padding: 2,
          cursor: "pointer",
          color: active ? "#E85D2F" : "#f7eddb",
          opacity: active ? 1 : 0.7,
        }}
        title="Filtrar"
      >
        <Filter size={12} fill={active ? "#E85D2F" : "none"} />
      </button>

      {open && pos && (
        <div
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: 230,
            background: "#1C1F26",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 1000,
            padding: 10,
            fontWeight: 400,
            textTransform: "none",
            fontSize: 12,
            color: "#F4F5F7",
          }}
        >
          <div style={{ position: "relative", marginBottom: 8 }}>
            <Search size={13} style={{ position: "absolute", top: 8, left: 8, color: "#8A9099" }} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              style={{
                width: "100%",
                background: "#0A0C0F",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                color: "#F4F5F7",
                padding: "6px 8px 6px 26px",
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ maxHeight: 200, overflowY: "auto" }} className="velsat-scroll">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 2px",
                cursor: "pointer",
                fontWeight: 700,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                marginBottom: 4,
              }}
            >
              <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              (Seleccionar todo)
            </label>

            {filteredOptions.map((opt) => (
              <label
                key={opt}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 2px",
                  cursor: "pointer",
                }}
              >
                <input type="checkbox" checked={draft.has(opt)} onChange={() => toggleOne(opt)} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt}</span>
              </label>
            ))}

            {filteredOptions.length === 0 && (
              <div style={{ padding: "8px 2px", color: "#8A9099" }}>Sin resultados</div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 6 }}>
            <button
              onClick={handleLimpiar}
              style={{
                background: "none",
                border: "none",
                color: "#8A9099",
                fontSize: 12,
                cursor: "pointer",
                padding: "4px 2px",
              }}
            >
              Limpiar
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={handleCancelar}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F4F5F7",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAceptar}
                style={{
                  background: "#E85D2F",
                  border: "none",
                  color: "#fff",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
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
