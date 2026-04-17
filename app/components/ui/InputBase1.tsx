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

export default function InputBase({
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
  const showError   = required && shouldValidate && isEmpty;
  const showSuccess = required && shouldValidate && !isEmpty;

  const borderColor = showError
    ? "rgba(232,93,47,0.7)"
    : showSuccess
    ? "rgba(46,204,113,0.5)"
    : "rgba(255,255,255,0.08)";

  const focusBorder = showError ? "rgba(232,93,47,0.9)" : "rgba(232,93,47,0.5)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: showError ? "#E85D2F" : "#8A9099",
          }}
        >
          {label}
          {required && (
            <span style={{ color: "#E85D2F", marginLeft: 3 }}>*</span>
          )}
        </label>
      )}

      <div style={{ position: "relative" }}>
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
          onFocus={(e) => {
            if (!desabilitar)
              (e.currentTarget as HTMLInputElement).style.borderColor = focusBorder;
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = borderColor;
          }}
          style={{
            display: "block",
            width: "100%",
            fontSize: 13,
            paddingLeft: 12,
            paddingRight: isPassword ? 36 : 12,
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 7,
            background: "#0A0C0F",              // mismo fondo siempre
            border: `1px solid ${borderColor}`,
            color: desabilitar ? "#8A9099" : "#F4F5F7",
            outline: "none",
            transition: "border-color 0.15s",
            opacity: desabilitar ? 0.55 : 1,    // solo baja la opacidad global
            cursor: desabilitar ? "not-allowed" : "text",
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#8A9099",
              display: "flex",
              alignItems: "center",
              padding: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#E85D2F")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#8A9099")}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {showError && (
        <span style={{ fontSize: 11, color: "#E85D2F", marginTop: 2 }}>
          Campo obligatorio
        </span>
      )}
    </div>
  );
}