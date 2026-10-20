"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  ShieldCheck,
  Satellite,
  History,
  Radar,
  MessageSquare,
  DatabaseBackup,
} from "lucide-react";
import toast from "react-hot-toast";
import { Role } from "@/app/constants/roles";

type Props = {
  isAdmin?: boolean;
  role?: Role;
};

interface NavItemConfig {
  href: string;
  label: string;
  icon: React.ReactNode;
  visible?: boolean;
}

export default function Sidebar({ isAdmin = false, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      toast.success("Sesión cerrada");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  const generalGroup: NavItemConfig[] = [
    {
      href: "/panel/dashboard",
      label: "Dashboard",
      icon: <Home size={17} />,
    },
    {
      href: "/panel/usuarios",
      label: "Usuarios",
      icon: <User size={17} />,
    },
    {
      href: "/panel/subUsuarios",
      label: "Sub usuarios",
      icon: <Users size={17} />,
    },
    {
      href: "/panel/unidades",
      label: "Unidades",
      icon: <Car size={17} />,
    },
    {
      href: "/panel/unidadesConex",
      label: "Conexión / Desconexión",
      icon: <RefreshCwOff size={17} />,
    },
  ];

  const integracionesGroup: NavItemConfig[] = [
    {
      href: "/panel/sutran",
      label: "Sutran",
      icon: <ShieldCheck size={17} />,
    },
    {
      href: "/panel/goldcar",
      label: "Goldcar",
      icon: <Satellite size={17} />,
    },
    {
      href: "/panel/osinergmin",
      label: "Osinergmin",
      icon: <Activity size={17} />,
    },
    {
      href: "/panel/tracklog",
      label: "Tracklog",
      icon: <Radar size={17} />,
      visible: role === "Servidor_107" || isAdmin,
    },
    {
      href: "/panel/agregargpstraccar",
      label: "Traccar",
      icon: <Plus size={17} />,
    },
  ];

  const operacionesGroup: NavItemConfig[] = [
    {
      href: "/panel/seguimiento",
      label: "Seguimiento",
      icon: <MapPinned size={17} />,
    },
    {
      href: "/panel/comandos-sms",
      label: "SMS GPS",
      icon: <MessageSquare size={17} />,
    },
    {
      href: "/panel/carga",
      label: "Carga de data",
      icon: <DatabaseBackup size={17} />,
    },
    {
      href: "/panel/auditoria",
      label: "Auditoria",
      icon: <History size={17} />,
      visible: isAdmin,
    },
  ];

  return (
    <aside className="w-60 min-w-60 max-w-60 h-screen flex flex-col bg-[#18191C] border-r border-[#26272B] select-none shrink-0 z-20">
      {/* ---------- HEADER (68px) ---------- */}
      <div className="h-17 min-h-17 px-4 flex items-center gap-3 border-b border-[#26272B] shrink-0">
        <div className="w-8.5 h-8.5 rounded-lg bg-[#F05A28] flex items-center justify-center text-white font-bold text-[17px] shrink-0">
          V
        </div>
        <div className="flex flex-col justify-center overflow-hidden">
          <div className="text-[15px] font-bold leading-tight truncate">
            <span className="text-[#ECECEE]">Gestión </span>
            <span className="text-[#F05A28]">Velsat</span>
          </div>
          <span className="text-[9px] uppercase font-semibold tracking-wider text-[#76777C] mt-0.5 leading-none">
            PANEL DE CONTROL
          </span>
        </div>
      </div>

      {/* ---------- MENÚ CON GRUPOS ---------- */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 space-y-4 velsat-scroll">
        {/* GRUPO GENERAL */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#76777C]">
            GENERAL
          </div>
          <div className="flex flex-col gap-1">
            {generalGroup.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href}
              />
            ))}
          </div>
        </div>

        {/* GRUPO INTEGRACIONES */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#76777C]">
            INTEGRACIONES
          </div>
          <div className="flex flex-col gap-1">
            {integracionesGroup
              .filter((i) => i.visible !== false)
              .map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href}
                />
              ))}
          </div>
        </div>

        {/* GRUPO OPERACIONES */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#76777C]">
            OPERACIONES
          </div>
          <div className="flex flex-col gap-1">
            {operacionesGroup
              .filter((i) => i.visible !== false)
              .map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href}
                />
              ))}
          </div>
        </div>
      </div>

      {/* ---------- FOOTER CON USUARIO Y SALIDA ---------- */}
      <div className="h-14 min-h-14 px-3 border-t border-[#26272B] flex items-center justify-between bg-[#18191C] shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div className="w-8 h-8 rounded-[7px] bg-[#222327] border border-[#26272B] flex items-center justify-center text-[11px] font-bold text-[#CFCFD3] shrink-0">
            AD
          </div>
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-[13px] font-semibold text-[#ECECEE] truncate leading-tight">
              Administrador
            </span>
            <span className="text-[10.5px] font-mono text-[#76777C] truncate leading-tight">
              admin@velsat.com.pe
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Cerrar Sesión"
          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[#76777C] hover:text-[#F05A28] hover:bg-[#212226] transition-colors shrink-0 cursor-pointer"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`h-9 px-3 rounded-lg flex items-center gap-2.5 text-[13.5px] font-medium transition-all duration-150 ${
        active
          ? "bg-[#1C1714] border border-[#8A3A1C] text-[#ECECEE]"
          : "border border-transparent text-[#9B9CA1] hover:bg-[#212226] hover:text-[#ECECEE]"
      }`}
    >
      <span
        className={`shrink-0 flex items-center transition-colors ${
          active ? "text-[#F05A28]" : "text-[#9B9CA1] group-hover:text-[#ECECEE]"
        }`}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
