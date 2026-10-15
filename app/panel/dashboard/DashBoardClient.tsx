"use client";

import {
  Users,
  Car,
  User,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { Role } from "@/app/constants/roles";
import { getDashBoardApi } from "@/app/services/dashBoardApi";
import { useDashboard } from "./useDashboard";
import { mutate } from "swr";
import PanelHeader from "@/app/components/nav/PanelHeader";

type Props = {
  role: Role;
};

export default function DashBoardClient({ role }: Props) {
  const api = getDashBoardApi(role);

  const { usuarios, subUsuarios, vehiculos, isLoading } = useDashboard(role);

  const totalUsuarios = usuarios.length;
  const totalSubUsuarios = subUsuarios.length;
  const totalVehiculos = vehiculos.length;

  const { usuariosActivos, usuariosInactivos } = usuarios.reduce(
    (acc, u) => {
      u.isActive ? acc.usuariosActivos++ : acc.usuariosInactivos++;
      return acc;
    },
    { usuariosActivos: 0, usuariosInactivos: 0 }
  );

  const { SubsuariosActivos, SubsuariosInactivos } = subUsuarios.reduce(
    (acc, u) => {
      u.status === "1" ? acc.SubsuariosActivos++ : acc.SubsuariosInactivos++;
      return acc;
    },
    { SubsuariosActivos: 0, SubsuariosInactivos: 0 }
  );

  const { vehiculosActivos, vehiculosInactivos } = vehiculos.reduce(
    (acc, u) => {
      u.isActive === "1" || u.habilitada === "1"
        ? acc.vehiculosActivos++
        : acc.vehiculosInactivos++;
      return acc;
    },
    { vehiculosActivos: 0, vehiculosInactivos: 0 }
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#121214]">
      {/* ---------- HEADER (68px) ---------- */}
      <PanelHeader
        title={
          <span>
            Dashboard <span className="text-[#F05A28]">Velsat</span>
          </span>
        }
        subtitle="Monitoreo general de usuarios, sub usuarios y unidades de la flota"
        role={role}
        actions={
          <button
            onClick={() => mutate(["dashboard", role], undefined, { revalidate: true })}
            disabled={isLoading}
            className="h-[36px] px-3.5 rounded-[8px] bg-[#161719] border border-[#26272B] text-[#ECECEE] hover:bg-[#212226] hover:border-[#2D2E32] transition-colors text-[13px] font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={14}
              className={isLoading ? "animate-spin text-[#F05A28]" : "text-[#76777C]"}
            />
            <span>{isLoading ? "Actualizando..." : "Actualizar"}</span>
          </button>
        }
      />

      {/* ---------- CONTENIDO ---------- */}
      <div className="flex-1 min-h-0 p-6 overflow-y-auto velsat-scroll">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl">
          <KpiBox
            title="Usuarios"
            value={totalUsuarios}
            activos={usuariosActivos}
            inactivos={usuariosInactivos}
            icon={<User size={18} className="text-[#F05A28]" />}
          />
          <KpiBox
            title="Sub Usuarios"
            value={totalSubUsuarios}
            activos={SubsuariosActivos}
            inactivos={SubsuariosInactivos}
            icon={<Users size={18} className="text-[#F05A28]" />}
          />
          <KpiBox
            title="Unidades"
            value={totalVehiculos}
            activos={vehiculosActivos}
            inactivos={vehiculosInactivos}
            icon={<Car size={18} className="text-[#F05A28]" />}
          />
        </div>
      </div>
    </div>
  );
}

function KpiBox({
  title,
  value,
  activos,
  inactivos,
  icon,
}: {
  title: string;
  value: number;
  activos: number;
  inactivos: number;
  icon: React.ReactNode;
}) {
  const total = activos + inactivos || 1;
  const pctActivos = Math.round((activos / total) * 100);
  const pctInactivos = Math.round((inactivos / total) * 100);

  return (
    <div className="bg-[#161719] border border-[#26272B] rounded-[12px] p-5 flex flex-col gap-5 hover:border-[#2D2E32] transition-colors">
      {/* Top row */}
      <div className="flex items-center justify-between p-4 rounded-[8px] bg-[#121214] border border-[#222327]">
        <div>
          <p className="text-[11px] font-bold tracking-wider uppercase text-[#76777C] m-0">
            {title}
          </p>
          <p className="text-[32px] font-bold font-mono text-[#ECECEE] m-0 mt-1 leading-none">
            {value}
          </p>
        </div>
        <div className="w-[42px] h-[42px] rounded-[8px] bg-[#1A1210] border border-[#5A2A18] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>

      {/* Distribución */}
      <div>
        <div className="flex items-center gap-1.5 mb-3 text-[#9B9CA1]">
          <BarChart3 size={14} className="text-[#76777C]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#76777C]">
            Distribución
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {/* Activos */}
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="text-[#CFCFD3] flex items-center gap-1.5">
                <TrendingUp size={13} className="text-[#4ADE80]" />
                <span>Activos ({activos})</span>
              </span>
              <span className="font-mono font-bold text-[#4ADE80]">{pctActivos}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1D1E21] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#4ADE80] transition-all duration-500"
                style={{ width: `${pctActivos}%` }}
              />
            </div>
          </div>

          {/* Inactivos */}
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="text-[#CFCFD3] flex items-center gap-1.5">
                <TrendingDown size={13} className="text-[#A6A7AB]" />
                <span>Inactivos ({inactivos})</span>
              </span>
              <span className="font-mono font-bold text-[#A6A7AB]">{pctInactivos}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1D1E21] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#A6A7AB] transition-all duration-500"
                style={{ width: `${pctInactivos}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}