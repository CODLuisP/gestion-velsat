"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Car, Users, LogOut, Activity } from "lucide-react";
import LogoutItem from "../login/LogoutItem";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <aside
      className={`
        h-screen flex flex-col
        bg-linear-to-br from-blue-800  to-blue-800
        text-slate-200
        transition-all duration-300
        border-r border-blue-900/60
        ${open ? "w-64" : "w-16"}
      `}
    >
      {/* ---------- HEADER ---------- */}
      <div className="relative flex items-center h-16 px-4 border-b border-blue-900/60">
        {/* Logo + título */}
        <div
          className={`
            flex items-center gap-3 overflow-hidden
            transition-all duration-300
            ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>

          <div className="whitespace-nowrap">
            <h1 className="text-lg font-bold text-white leading-none">
              Gestión <span className="text-orange-400">Velsat</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold">
              Panel de Control
            </p>
          </div>
        </div>

        {/* Botón toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={`
            absolute top-1/2 -translate-y-1/2
            py-2 px-3 rounded-md
            text-orange-400
            hover:text-orange-400 hover:bg-blue-700/80
            transition
            ${open ? "right-3" : "left-1/2 -translate-x-1/2"}
          `}
        >
          ☰
        </button>
      </div>

      {/* ---------- MENÚ ---------- */}
      <nav className="mt-2 flex flex-col gap-1 px-2 font-medium">
        <SidebarLink
          href="/panel/dashboard"
          icon={<Home size={18} />}
          label="Dashboard"
          open={open}
          active={pathname === "/panel/dashboard"}
        />

        <SidebarLink
          href="/panel/usuarios"
          icon={<User size={18} />}
          label="Usuarios"
          open={open}
          active={pathname === "/panel/usuarios"}
        />

        <SidebarLink
          href="/panel/subUsuarios"
          icon={<Users size={18} />}
          label="Sub Usuarios"
          open={open}
          active={pathname === "/panel/subUsuarios"}
        />

        <SidebarLink
          href="/panel/unidades"
          icon={<Car size={18} />}
          label="Unidades"
          open={open}
          active={pathname === "/panel/unidades"}
        />
      </nav>

      {/* ---------- FOOTER ---------- */}
      <div className="mt-auto px-2 pb-4">
        <div className="mb-4 h-px bg-linear-to-r from-transparent via-blue-700/60 to-transparent" />

        <LogoutItem
          icon={<LogOut size={18} />}
          label="Cerrar Sesión"
          open={open}
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
        group relative
        flex items-center gap-3 px-3 py-2 rounded-lg
        transition-all duration-200
        ${
          active
            ? `
              bg-blue-700/80
              text-white
              before:absolute before:left-0 before:top-1/2
              before:-translate-y-1/2 before:h-6 before:w-1
              before:rounded-r before:bg-orange-400
              shadow-[inset_0_0_0_1px_rgba(251,146,60,0.25)]
            `
            : "text-slate-300/80 hover:bg-blue-900/40 hover:text-slate-100"
        }
      `}
    >
      <span
        className={`
          shrink-0 transition-colors
          ${active ? "text-orange-400" : "text-slate-200 group-hover:text-slate-200"}
        `}
      >
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
