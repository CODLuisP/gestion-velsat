"use client";

import { Card, CardContent } from "@/app/components/ui/Card";
import { Server, Users, Car, Activity, BarChart3, User } from "lucide-react";

import { Role } from "@/app/constants/roles";
import { getDashBoardApi } from "@/app/services/dashBoardApi";
import { useDashboard } from "./useDashboard";

type Props = {
  role: Role;
};

export default function DashBoardClient({role}: Props) {

  const api = getDashBoardApi(role);

  const { usuarios, subUsuarios, vehiculos, isLoading } =
    useDashboard(role);
    

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
            u.isActive ==="1" || u.habilitada ==="1" ? acc.vehiculosActivos++ : acc.vehiculosInactivos++;
            return acc;
        },
        { vehiculosActivos: 0, vehiculosInactivos: 0 }
    );

  return (
    <div className="min-h-screen rounded-4xl bg-slate-100 p-6">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-sky-900">
          Dashboard Gestión <span className="text-emerald-400">Velsat</span>
        </h1>
        <p className="text-slate-600 mt-1">
          Monitoreo gestión principal de Usuarios, Sub Usuarios y Unidades
        </p>
      </header>

      {/* Servidores */}
      <section className="grid grid-cols-1 gap-6">
        <Card className="rounded-2xl border border-emerald-200 bg-white">
            <CardContent className="p-6">
                {/* contenededor general */}
                <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-sky-100 text-sky-800">
                    <Server className="w-5 h-5" />
                    </div>
                    <div>
                    <h3 className="font-semibold text-sky-900">
                        {role}
                    </h3>
                    <p className="text-xs text-slate-500">
                         Análisis de datos
                    </p>
                    </div>
                </div>

                <span
                    className={"flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-400"}
                >
                    <Activity className="w-3 h-3" />
                    Online
                </span>
                </div>

                {/* Stats 
                <div className="grid grid-cols-3 gap-4 text-center mb-8">
                <Stat label="Usuarios" value={totalUsuarios} />
                <Stat label="Sub" value={totalSubUsuarios} />
                <Stat label="Vehículos" value={totalVehiculos} />
                </div>
                */}

                {/* Gráfico grande */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* USUARIOS */}
                <div className="rounded-3xl bg-white p-6 border border-sky-100 shadow-sm hover:shadow-md transition">
                    <KpiCard
                    title="Usuarios Totales"
                    value={totalUsuarios}
                    icon={<User className="w-6 h-6" />}
                    bg="bg-sky-900"
                    />

                    <div className="flex items-center gap-2 mt-6 mb-4">
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                    <p className="text-sm font-semibold text-slate-800">
                        Distribución de usuarios
                    </p>
                    </div>

                    <div className="space-y-5">
                    {/* Activos */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                        <span className="text-emerald-700 font-medium">
                            Activos ({usuariosActivos})
                        </span>
                        <span className="text-slate-500">
                            {((usuariosActivos / totalUsuarios) * 100).toFixed(0)}%
                        </span>
                        </div>
                        <div className="h-3 rounded-full bg-emerald-100 overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${(usuariosActivos / totalUsuarios) * 100}%` }}
                        />
                        </div>
                    </div>

                    {/* Inactivos */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                        <span className="text-sky-700 font-medium">
                            Inactivos ({usuariosInactivos})
                        </span>
                        <span className="text-slate-500">
                            {((usuariosInactivos / totalUsuarios) * 100).toFixed(0)}%
                        </span>
                        </div>
                        <div className="h-3 rounded-full bg-sky-100 overflow-hidden">
                        <div
                            className="h-full bg-sky-500 transition-all"
                            style={{ width: `${(usuariosInactivos / totalUsuarios) * 100}%` }}
                        />
                        </div>
                    </div>
                    </div>
                </div>

                {/* SUB USUARIOS */}
                <div className="rounded-3xl bg-white p-6 border border-sky-100 shadow-sm hover:shadow-md transition">
                    <KpiCard
                    title="Sub Usuarios"
                    value={totalSubUsuarios}
                    icon={<Users className="w-6 h-6" />}
                    bg="bg-sky-900"
                    />

                    <div className="flex items-center gap-2 mt-6 mb-4">
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                    <p className="text-sm font-semibold text-slate-800">
                        Distribución de Sub usuarios
                    </p>
                    </div>

                    <div className="space-y-5">
                    {/* Activos */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                        <span className="text-emerald-700 font-medium">
                            Activos ({SubsuariosActivos})
                        </span>
                        <span className="text-slate-500">
                            {((SubsuariosActivos / totalSubUsuarios) * 100).toFixed(0)}%
                        </span>
                        </div>
                        <div className="h-3 rounded-full bg-emerald-100 overflow-hidden">
                        <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${(SubsuariosActivos / totalSubUsuarios) * 100}%` }}
                        />
                        </div>
                    </div>

                    {/* Inactivos */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                        <span className="text-sky-700 font-medium">
                            Inactivos ({SubsuariosInactivos})
                        </span>
                        <span className="text-slate-500">
                            {((SubsuariosInactivos / totalSubUsuarios) * 100).toFixed(0)}%
                        </span>
                        </div>
                        <div className="h-3 rounded-full bg-sky-100 overflow-hidden">
                        <div
                            className="h-full bg-sky-500"
                            style={{ width: `${(SubsuariosInactivos / totalSubUsuarios) * 100}%` }}
                        />
                        </div>
                    </div>
                    </div>
                </div>

                {/* VEHÍCULOS */}
                <div className="rounded-3xl bg-white p-6 border border-sky-100 shadow-sm hover:shadow-md transition">
                    <KpiCard
                    title="Unidades"
                    value={totalVehiculos}
                    icon={<Car className="w-6 h-6" />}
                    bg="bg-sky-900"
                    />

                    <div className="flex items-center gap-2 mt-6 mb-4">
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                    <p className="text-sm font-semibold text-slate-800">
                        Distribución de Unidades
                    </p>
                    </div>

                    <div className="space-y-5">
                    {/* Activos */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                        <span className="text-emerald-700 font-medium">
                            Activos ({vehiculosActivos})
                        </span>
                        <span className="text-slate-500">
                            {((vehiculosActivos / totalVehiculos) * 100).toFixed(0)}%
                        </span>
                        </div>
                        <div className="h-3 rounded-full bg-emerald-100 overflow-hidden">
                        <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${(vehiculosActivos / totalVehiculos) * 100}%` }}
                        />
                        </div>
                    </div>

                    {/* Inactivos */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                        <span className="text-sky-700 font-medium">
                            Inactivos ({vehiculosInactivos})
                        </span>
                        <span className="text-slate-500">
                            {((vehiculosInactivos / totalVehiculos) * 100).toFixed(0)}%
                        </span>
                        </div>
                        <div className="h-3 rounded-full bg-sky-100 overflow-hidden">
                        <div
                            className="h-full bg-sky-500"
                            style={{ width: `${(vehiculosInactivos / totalVehiculos) * 100}%` }}
                        />
                        </div>
                    </div>
                    </div>
                </div>
                </div>

            </CardContent>
        </Card>
      </section>
    </div>
  );
}

/* ---------- Componentes ---------- */

function KpiCard({
  title,
  value,
  icon,
  bg,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
}) {
  return (
    <Card className={`rounded-2xl border-emerald-400 border ${bg}`}>
      <CardContent className="p-6 flex items-center rounded-2xl justify-between bg-sky-100 text-sky-800">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-300">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

