"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

type InputBaseProps = {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  desabilitar?: boolean;
  required?: boolean;
  submitAttempt?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function InputBase({
  label,
  type = "text",
  placeholder,
  value,
  defaultValue,
  desabilitar = false,
  required = false,
  submitAttempt = false,
  onChange,
}: InputBaseProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [internalValue, setInternalValue] = useState(
    value ?? defaultValue ?? ""
  );

  const isPassword = type === "password";

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const shouldValidate = touched || submitAttempt;
  const isEmpty = internalValue.trim() === "";

  const showError = required && shouldValidate && isEmpty;
  const showSuccess = required && shouldValidate && !isEmpty;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-semibold text-blue-600">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          disabled={desabilitar}
          required={required}
          type={isPassword && showPassword ? "text" : type}
          placeholder={placeholder}
          value={internalValue}
          onChange={(e) => {
            setInternalValue(e.target.value);
            onChange?.(e);
          }}
          onBlur={() => setTouched(true)}
          className={`
            block w-full text-sm pl-4 py-2 
            rounded-md 
            bg-slate-100 
            border
            ${
              showError
                ? "border-red-400 focus:border-red-400"
                : showSuccess
                ? "border-blue-500 focus:border-blue-500"
                : "border-slate-200 focus:border-blue-500"
            }
            text-gray-900
            placeholder-gray-400
            shadow-sm
            focus:outline-none focus:ring-0
            transition-all duration-200
            ${isPassword ? "pr-10" : ""}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-border-blue-500 transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {showError && (
        <span className="text-xs text-red-500">
          Campo obligatorio
        </span>
      )}
    </div>
  );
}
