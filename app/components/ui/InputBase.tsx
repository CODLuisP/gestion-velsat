"use client";
import { EyeOff, Eye } from "lucide-react";
import { useState } from "react";

type InputBaseProps = {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  desabilitar?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function InputBase({
  label,
  type,
  placeholder,
  value,
  defaultValue,
  desabilitar,
  onChange,
}: InputBaseProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-bold text-foreground">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          disabled={desabilitar}
          type={isPassword && showPassword ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          defaultValue={defaultValue}
          className={`block w-full text-sm pl-4 py-1 bg-slate-800/10 border border-slate-700/40 rounded-sm text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/60 transition-all ${
            isPassword ? "pr-10" : ""
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
