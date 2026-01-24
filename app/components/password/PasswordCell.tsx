// Componente PasswordCell.tsx
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordCellProps {
  password: string;
}

export default function PasswordCell({ password }: PasswordCellProps) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <div className="flex items-center justify-between wrap-break-word">
      <span>{mostrar ? password : "••••••"}</span>
      <button
        type="button"
        onClick={() => setMostrar(!mostrar)}
        className="p-1 rounded hover:bg-zinc-200 "
      >
        {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
