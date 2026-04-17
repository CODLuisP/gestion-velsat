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
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#8A9099",
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: "relative" }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 11,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#8A9099",
            pointerEvents: "none",
          }}
        />

        <input
          type="search"
          disabled={desabilitar}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          style={{
            display: "block",
            width: "100%",
            fontSize: 13,
            paddingLeft: 34,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            background: "#1C1F26",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "#F4F5F7",
            outline: "none",
            transition: "border-color 0.15s",
            opacity: desabilitar ? 0.5 : 1,
            cursor: desabilitar ? "not-allowed" : "text",
          }}
          onFocus={e => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(232,93,47,0.5)";
          }}
          onBlur={e => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)";
          }}
        />
      </div>
    </div>
  );
}