"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Car, Users, LogOut } from "lucide-react";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname(); // 👈 ruta actual

  return (
    <aside
      className={`
        h-screen flex flex-col
        bg-slate-700 text-white
        transition-all duration-300
        ${open ? "w-64" : "w-16"}
      `}
    >
      {/* ---------- HEADER ---------- */}
      <div className="relative flex items-center h-14 px-3 border-b border-sky-600">
        <h1
          className={`
            text-2xl font-bold tracking-tight whitespace-nowrap
            transition-all duration-300
            ${open ? "opacity-100 ml-0" : "opacity-0 -ml-4"}
          `}
        >
          Gestión <span className="text-emerald-400">Velsat</span>
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            py-1 px-2 rounded-md
            hover:bg-emerald-600 transition
          "
        >
          ☰
        </button>
      </div>

      {/* ---------- MENÚ ---------- */}
      <nav className="mt-4 flex flex-col gap-1 px-2 font-semibold">
        <SidebarLink
          href="/panel/dashboard"
          icon={<Home size={20} />}
          label="Dashboard"
          open={open}
          active={pathname === "/panel/dashboard"}
        />

        <SidebarLink
          href="/panel/usuarios"
          icon={<User size={20} />}
          label="Usuarios"
          open={open}
          active={pathname === "/panel/usuarios"}
        />

        <SidebarLink
          href="/panel/subUsuarios"
          icon={<Users size={20} />}
          label="Sub Usuarios"
          open={open}
          active={pathname === "/panel/subUsuarios"}
        />

        <SidebarLink
          href="/panel/unidades"
          icon={<Car size={20} />}
          label="Vehículos"
          open={open}
          active={pathname === "/panel/unidades"}
        />
      </nav>

      {/* ---------- LOGOUT ---------- */}
      <div className="mt-auto px-2 pb-4">
        <SidebarLink
          href="/"
          icon={<LogOut size={20} />}
          label="Cerrar Sesión"
          open={open}
          active={false}
        />
      </div>
    </aside>
  );
}

/* ---------- LINK REUTILIZABLE ---------- */

function SidebarLink({
  href,
  icon,
  label,
  open,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  open: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg
        transition-all
        ${active ? "bg-emerald-600" : "hover:bg-emerald-600"}
      `}
    >
      {/* 🔑 FIX: evita que el ícono desaparezca */}
      <span className="shrink-0">
        {icon}
      </span>

      <span
        className={`
          transition-all duration-300 whitespace-nowrap
          ${open ? "opacity-100 ml-0" : "opacity-0 -ml-4"}
        `}
      >
        {label}
      </span>
    </Link>
  );
}

