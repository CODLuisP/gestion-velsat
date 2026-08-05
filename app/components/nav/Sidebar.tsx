"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Car,
  Users,
  LogOut,
  Activity,
  RefreshCwOff,
  MapPinned,
  Plus,
  Globe,
  ShieldCheck,
  Satellite,
} from "lucide-react";
import LogoutItem from "../login/LogoutItem";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <aside
      style={{
        background: "#1C1F26",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        color: "#F4F5F7",
      }}
      className={`
        h-screen flex flex-col
        transition-all duration-300
        ${open ? "w-64" : "w-16"}
      `}
    >
      {/* ---------- HEADER ---------- */}
      <div
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="relative flex items-center h-16 px-4"
      >
        <div
          className={`
            flex items-center gap-3 overflow-hidden
            transition-all duration-300
            ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          {/* Emblem */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(232,93,47,0.12)",
              border: "1px solid rgba(232,93,47,0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img src="/logoVelsat.jpg" alt="" className="rounded-lg p-0.2" />
          </div>

          <div className="whitespace-nowrap">
            <h1
              className="text-[16px] font-bold leading-none"
              style={{ color: "#F4F5F7" }}
            >
              Gestión <span style={{ color: "#E85D2F" }}>Velsat</span>
            </h1>
            <p
              className="text-[9px] uppercase tracking-widest font-semibold mt-0.5"
              style={{ color: "#8A9099" }}
            >
              Panel de Control
            </p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setOpen(!open)}
          style={{ color: "#E85D2F" }}
          className={`
            absolute top-1/2 -translate-y-1/2
            py-2 px-3 rounded-md text-base
            hover:bg-white/5
            transition
            ${open ? "right-3" : "left-1/2 -translate-x-1/2"}
          `}
        >
          ☰
        </button>
      </div>

      {/* ---------- MENÚ ---------- */}
      <nav className="mt-2 flex flex-col gap-0.5 px-2 font-medium">
        <SidebarLink
          href="/panel/dashboard"
          icon={<Home size={17} />}
          label="Dashboard"
          open={open}
          active={pathname === "/panel/dashboard"}
        />
        <SidebarLink
          href="/panel/usuarios"
          icon={<User size={17} />}
          label="Usuarios"
          open={open}
          active={pathname === "/panel/usuarios"}
        />
        <SidebarLink
          href="/panel/subUsuarios"
          icon={<Users size={17} />}
          label="Sub Usuarios"
          open={open}
          active={pathname === "/panel/subUsuarios"}
        />
        <SidebarLink
          href="/panel/unidades"
          icon={<Car size={17} />}
          label="Unidades"
          open={open}
          active={pathname === "/panel/unidades"}
        />
        <SidebarLink
          href="/panel/unidadesConex"
          icon={<RefreshCwOff size={17} />}
          label="Conexión / Desconexión"
          open={open}
          active={pathname === "/panel/unidadesConex"}
        />
        <SidebarLink
          href="/panel/sutran"
          icon={<ShieldCheck size={17} />}
          label="Sutran"
          open={open}
          active={pathname === "/panel/sutran"}
        />
        <SidebarLink
          href="/panel/goldcar"
          icon={<Satellite size={17} />}
          label="Goldcar"
          open={open}
          active={pathname === "/panel/goldcar"}
        />

        <SidebarLink
          href="/panel/seguimiento"
          icon={<MapPinned size={17} />}
          label="Seguimiento"
          open={open}
          active={pathname === "/panel/seguimiento"}
        />
        <SidebarLink
          href="/panel/webs-velsat"
          icon={<Globe size={17} />}
          label="Webs Velsat"
          open={open}
          active={pathname === "/panel/webs-velsat"}
        />
        <SidebarLink
          href="/panel/agregargpstraccar"
          icon={<Plus size={17} />}
          label="Traccar"
          open={open}
          active={pathname === "/panel/agregargpstraccar"}
        />
      </nav>

      {/* ---------- FOOTER ---------- */}
      <div className="mt-auto px-2 pb-4">
        <div
          className="mb-4 h-px"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <LogoutItem
          icon={<LogOut size={17} style={{ color: "#8A9099" }} />}
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
      style={
        active
          ? {
              background: "rgba(255,255,255,0.07)",
              color: "#F4F5F7",
              boxShadow: "inset 0 0 0 1px rgba(232,93,47,0.22)",
            }
          : {}
      }
      className={`
        group relative
        flex items-center gap-3 px-3 py-2 rounded-lg
        transition-all duration-200
        ${!active ? "hover:bg-white/5" : ""}
      `}
    >
      {/* Barra naranja izquierda cuando activo */}
      {active && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 22,
            background: "#E85D2F",
            borderRadius: "0 3px 3px 0",
          }}
        />
      )}

      {/* Ícono */}
      <span
        style={{ color: active ? "#E85D2F" : "#ADB5BD", flexShrink: 0 }}
        className="transition-colors group-hover:text-[#F4F5F7]!"
      >
        {icon}
      </span>

      {/* Label */}
      <span
        style={{ color: active ? "#F4F5F7" : "rgba(173,181,189,0.85)" }}
        className={`
          transition-all duration-300 whitespace-nowrap text-[13px]
          group-hover:text-[#F4F5F7]!
          ${open ? "opacity-100 ml-0" : "opacity-0 -ml-4"}
        `}
      >
        {label}
      </span>
    </Link>
  );
}
