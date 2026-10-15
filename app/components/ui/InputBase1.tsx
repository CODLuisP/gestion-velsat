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
  displayValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function InputBase1({
  label,
  type = "text",
  placeholder,
  value,
  defaultValue,
  displayValue,
  desabilitar = false,
  required = false,
  submitAttempt = false,
  onChange,
}: InputBaseProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? "");

  const isPassword = type === "password";

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  const shouldValidate = touched || submitAttempt;
  const isEmpty = internalValue.trim() === "";
  const showError = required && shouldValidate && isEmpty;

  const borderColor = showError
    ? "#F05A28"
    : "#2D2E32";

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          className={`text-[11px] font-bold tracking-wider uppercase ${
            showError ? "text-[#F05A28]" : "text-[#9B9CA1]"
          }`}
        >
          {label}
          {required && <span className="text-[#F05A28] ml-1">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <input
          disabled={desabilitar}
          required={required}
          type={isPassword && showPassword ? "text" : type}
          placeholder={placeholder}
          value={displayValue ?? internalValue}
          onChange={(e) => {
            setInternalValue(e.target.value);
            onChange?.(e);
          }}
          onBlur={() => setTouched(true)}
          className={`w-full h-[36px] px-3 bg-[#121214] rounded-[8px] text-[13px] text-[#ECECEE] placeholder-[#76777C] outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isPassword ? "pr-10" : ""
          }`}
          style={{
            border: `1px solid ${borderColor}`,
          }}
          onFocus={(e) => {
            if (!desabilitar && !showError) {
              e.currentTarget.style.borderColor = "#F05A28";
            }
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = borderColor;
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777C] hover:text-[#F05A28] transition-colors p-1"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {showError && (
        <span className="text-[11px] text-[#F05A28] mt-0.5">
          Campo obligatorio
        </span>
      )}
    </div>
  );
}