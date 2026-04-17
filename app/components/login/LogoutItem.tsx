"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LogoutItem({
  icon,
  label,
  open,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    toast.success("Sesión cerrada");
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid transparent",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s, border-color 0.15s",
        color: "#8A9099",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.08)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,93,47,0.2)";
        (e.currentTarget as HTMLButtonElement).style.color = "#E85D2F";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = "#8A9099";
      }}
    >
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {icon}
      </span>

      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: "nowrap",
          transition: "opacity 0.25s, margin-left 0.25s",
          opacity: open ? 1 : 0,
          marginLeft: open ? 0 : -12,
          overflow: "hidden",
        }}
      >
        {label}
      </span>
    </button>
  );
}