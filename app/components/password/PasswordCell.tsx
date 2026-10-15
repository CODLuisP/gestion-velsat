"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

interface PasswordCellProps {
  password?: string | null;
}

export default function PasswordCell({ password }: PasswordCellProps) {
  const [mostrar, setMostrar] = useState(false);
  const [copiado, setCopiado] = useState(false);

  if (!password) {
    return <span className="text-[#76777C] italic text-xs select-text">—</span>;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(password);
    setCopiado(true);
    toast.success("Contraseña copiada");
    setTimeout(() => setCopiado(false), 1500);
  };

  return (
    <div className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[#9B9CA1] select-text">
      <span className="tracking-widest select-text cursor-text">
        {mostrar ? password : "••••••••"}
      </span>

      <button
        type="button"
        onClick={() => setMostrar(!mostrar)}
        className="p-0.5 rounded-[4px] text-[#76777C] hover:text-[#ECECEE] transition-colors cursor-pointer"
        title={mostrar ? "Ocultar contraseña" : "Ver contraseña"}
      >
        {mostrar ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="p-0.5 rounded-[4px] text-[#76777C] hover:text-[#ECECEE] transition-colors cursor-pointer"
        title="Copiar contraseña"
      >
        {copiado ? <Check size={12} className="text-[#4ADE80]" /> : <Copy size={12} />}
      </button>
    </div>
  );
}
