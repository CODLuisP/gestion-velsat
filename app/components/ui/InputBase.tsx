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
  type = "text",
  placeholder,
  value,
  defaultValue,
  desabilitar,
  onChange,
}: InputBaseProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-[11px] font-bold tracking-wider uppercase text-[#9B9CA1]">
          {label}
        </label>
      )}

      <div className="relative w-full">
        <input
          disabled={desabilitar}
          type={isPassword && showPassword ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          defaultValue={defaultValue}
          className={`w-full h-[36px] px-3 bg-[#121214] border border-[#2D2E32] rounded-[8px] text-[13px] text-[#ECECEE] placeholder-[#76777C] outline-none transition-colors focus:border-[#F05A28] disabled:opacity-50 disabled:cursor-not-allowed ${
            isPassword ? "pr-10" : ""
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777C] hover:text-[#F05A28] transition-colors p-1"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
