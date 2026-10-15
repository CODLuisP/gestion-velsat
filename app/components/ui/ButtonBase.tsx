"use client";

import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "personalizado";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

const styles: Record<string, React.CSSProperties> = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "background 0.15s, border-color 0.15s, opacity 0.15s",
    outline: "none",
    whiteSpace: "nowrap" as const,
  },
  primary: {
    background: "#F05A28",
    color: "#ffffff",
    borderColor: "#F05A28",
  },
  secondary: {
    background: "#161719",
    color: "#ECECEE",
    border: "1px solid #26272B",
  },
  danger: {
    background: "#1A1210",
    color: "#F05A28",
    border: "1px solid #5A2A18",
  },
  personalizado: {
    background: "#F05A28",
    color: "#ffffff",
    borderColor: "#F05A28",
    padding: "8px 24px",
    fontSize: 13.5,
  },
  disabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
};

const hoverMap: Record<string, { bg: string; border?: string }> = {
  primary: { bg: "#FF6A35", border: "#FF6A35" },
  personalizado: { bg: "#FF6A35", border: "#FF6A35" },
  secondary: { bg: "#212226", border: "#2D2E32" },
  danger: { bg: "#251814", border: "#F05A28" },
};

export default function ButtonBase({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={className}
      style={{
        ...styles.base,
        ...styles[variant],
        ...(disabled ? styles.disabled : {}),
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          const h = hoverMap[variant];
          if (h) {
            (e.currentTarget as HTMLButtonElement).style.background = h.bg;
            if (h.border) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = h.border;
            }
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          const orig = styles[variant] as React.CSSProperties;
          (e.currentTarget as HTMLButtonElement).style.background = orig.background as string;
          (e.currentTarget as HTMLButtonElement).style.borderColor = (orig.borderColor || (orig.border ? orig.border.toString().split(" ")[2] : "transparent")) as string;
        }
      }}
    >
      {children}
    </button>
  );
}