"use client";

import { Card, CardContent } from "@/app/components/ui/Card";
import {
  Server,
  Users,
  Car,
  Activity,
  BarChart3,
  User,
  RefreshCw,
} from "lucide-react";

import { Role } from "@/app/constants/roles";
import { getDashBoardApi } from "@/app/services/dashBoardApi";
import { useDashboard } from "./useDashboard";
import { mutate } from "swr";

type Props = {
  role: Role;
};

export default function DashBoardClient({ role }: Props) {
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

  const { SubsuariosActivos, SubsuariosInactivos } =
    subUsuarios.reduce(
      (acc, u) => {
        u.status === "1"
          ? acc.SubsuariosActivos++
          : acc.SubsuariosInactivos++;
        return acc;
      },
      { SubsuariosActivos: 0, SubsuariosInactivos: 0 }
    );

  const { vehiculosActivos, vehiculosInactivos } =
    vehiculos.reduce(
      (acc, u) => {
        u.isActive === "1" || u.habilitada === "1"
          ? acc.vehiculosActivos++
          : acc.vehiculosInactivos++;
        return acc;
      },
      { vehiculosActivos: 0, vehiculosInactivos: 0 }
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6 rounded-4xl">
      {/* ---------- HEADER ---------- */}
      <header className="mb-10 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Dashboard Gestión{" "}
          <span className="text-orange-500">Velsat</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitoreo general de usuarios, sub usuarios y unidades
        </p>
      </header>

      {/* ---------- ESTADO GENERAL ---------- */}
      <section className="mb-10">
        <Card className="border border-slate-200 bg-white rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-orange-500 text-white shadow-sm">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {role}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Estado del sistema
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600">
                  <Activity className="w-3 h-3" />
                  Online
                </span>

                <button
                  onClick={() =>
                    mutate(["dashboard", role], undefined, {
                      revalidate: true,
                    })
                  }
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-1 rounded-md bg-blue-500 text-white text-xs hover:bg-blue-600 disabled:opacity-50 transition"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  {isLoading ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---------- KPIs ---------- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiBox
          title="Usuarios"
          value={totalUsuarios}
          activos={usuariosActivos}
          inactivos={usuariosInactivos}
          icon={<User className="w-5 h-5 text-white" />}
        />

        <KpiBox
          title="Sub Usuarios"
          value={totalSubUsuarios}
          activos={SubsuariosActivos}
          inactivos={SubsuariosInactivos}
          icon={<Users className="w-5 h-5 text-white" />}
        />

        <KpiBox
          title="Unidades"
          value={totalVehiculos}
          activos={vehiculosActivos}
          inactivos={vehiculosInactivos}
          icon={<Car className="w-5 h-5 text-white" />}
        />
      </section>
    </div>
  );
}

/* ---------- KPI BOX ---------- */

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

  return (
    <div className="rounded-2xl bg-white p-6 border border-slate-200 hover:shadow-sm transition">
      <div className="flex items-center justify-between mb-4 border border-orange-200 p-4 rounded-2xl bg-orange-50">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800">
            {value}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-orange-500 shadow-sm">
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-blue-500" />
        <p className="text-sm font-semibold text-slate-700">
          Distribución
        </p>
      </div>

      <div className="space-y-3">
        {/* Activos */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">
              Activos ({activos})
            </span>
            <span className="text-slate-400">
              {((activos / total) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(activos / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Inactivos */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">
              Inactivos ({inactivos})
            </span>
            <span className="text-slate-400">
              {((inactivos / total) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-full bg-orange-400 rounded-full transition-all"
              style={{ width: `${(inactivos / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
