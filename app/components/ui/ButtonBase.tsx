"use client";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "personalizado";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const styles: Record<string, React.CSSProperties> = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    cursor: "pointer",
    border: "none",
    transition: "background 0.15s, opacity 0.15s",
    outline: "none",
    whiteSpace: "nowrap" as const,
  },
  primary: {
    background: "#E85D2F",
    color: "#fff",
  },
  secondary: {
    background: "rgba(255,255,255,0.06)",
    color: "#ADB5BD",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  danger: {
    background: "rgba(232,93,47,0.12)",
    color: "#E85D2F",
    border: "1px solid rgba(232,93,47,0.28)",
  },
  personalizado: {
    background: "#E85D2F",
    color: "#fff",
    padding: "8px 28px",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
};

const hoverMap: Record<string, string> = {
  primary:      "#cf4e24",
  personalizado:"#cf4e24",
  secondary:    "rgba(255,255,255,0.1)",
  danger:       "rgba(232,93,47,0.2)",
};

export default function ButtonBase({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...styles.base,
        ...styles[variant],
        ...(disabled ? styles.disabled : {}),
      }}
      onMouseEnter={e => {
        if (!disabled)
          (e.currentTarget as HTMLButtonElement).style.background = hoverMap[variant];
      }}
      onMouseLeave={e => {
        if (!disabled)
          (e.currentTarget as HTMLButtonElement).style.background =
            (styles[variant] as React.CSSProperties).background as string;
      }}
    >
      {children}
    </button>
  );
}