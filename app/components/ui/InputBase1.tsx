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
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-semibold text-gray-800">
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
          className={`
            block w-full text-sm pl-4 py-2 
            rounded-md 
            bg-slate-100 
            border border-slate-300 
            text-gray-900 
            placeholder-gray-400
            shadow-sm 
            focus:outline-none focus:ring-0 focus:ring-emerald-400 focus:border-emerald-400
            transition-all duration-200
            ${isPassword ? "pr-10" : ""}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
