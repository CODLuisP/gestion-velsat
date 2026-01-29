"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordCellProps {
  password?: string | null;
}

export default function PasswordCell({ password }: PasswordCellProps) {
  const [mostrar, setMostrar] = useState(false);

  // 🚫 No hay contraseña → no renderizar nada
  if (!password) {
    return <span className="text-gray-400 italic">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono">
        {mostrar ? password : "******"}
      </span>

      <button
        type="button"
        onClick={() => setMostrar(!mostrar)}
        className="p-1 rounded hover:bg-zinc-200"
      >
        {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
