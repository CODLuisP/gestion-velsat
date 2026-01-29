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
      className="
        w-full flex items-center gap-3 px-3 py-2 rounded-lg
        transition-all hover:bg-orange-500/80 text-left
      "
    >
      <span className="shrink-0">{icon}</span>

      <span
        className={`
          transition-all duration-300 whitespace-nowrap
          ${open ? "opacity-100 ml-0" : "opacity-0 -ml-4"}
        `}
      >
        {label}
      </span>
    </button>
  );
}
