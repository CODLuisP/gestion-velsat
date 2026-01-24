"use client";

import { Card, CardContent } from "@/app/components/ui/Card";
import { Server, Users, Car, Activity, BarChart3 } from "lucide-react";

/* ---------- Tipos ---------- */
export type ServerData = {
  id: string;
  nombre: string;
  apiUrl: string;
  usuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  subUsuarios: number;
  vehiculos: number;
  estado: "online" | "offline";
};

/* ---------- Datos simulados ---------- */
const servers: ServerData[] = [
  {
    id: "srv-1",
    nombre: "Servidor Principal",
    apiUrl: "https://api.servidor1.com",
    usuarios: 120,
    usuariosActivos: 90,
    usuariosInactivos: 30,
    subUsuarios: 340,
    vehiculos: 560,
    estado: "online",
  },
  {
    id: "srv-2",
    nombre: "Servidor Secundario",
    apiUrl: "https://api.servidor2.com",
    usuarios: 80,
    usuariosActivos: 55,
    usuariosInactivos: 25,
    subUsuarios: 150,
    vehiculos: 210,
    estado: "online",
  },
  {
    id: "srv-3",
    nombre: "Servidor Respaldo",
    apiUrl: "https://api.servidor3.com",
    usuarios: 20,
    usuariosActivos: 5,
    usuariosInactivos: 15,
    subUsuarios: 40,
    vehiculos: 60,
    estado: "offline",
  },
];

export default function DashboardServidores() {
  const totalUsuarios = servers.reduce((a, b) => a + b.usuarios, 0);
  const totalSubUsuarios = servers.reduce((a, b) => a + b.subUsuarios, 0);
  const totalVehiculos = servers.reduce((a, b) => a + b.vehiculos, 0);

  return (
    <div className="min-h-screen rounded-4xl bg-slate-100 p-6">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-sky-900">
          Dashboard de Servidores
        </h1>
        <p className="text-slate-600 mt-1">
          Monitoreo general de APIs, usuarios y vehículos
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <KpiCard
          title="Usuarios Totales"
          value={totalUsuarios}
          icon={<Users className="w-6 h-6" />}
          bg="bg-sky-900"
        />
        <KpiCard
          title="Sub Usuarios"
          value={totalSubUsuarios}
          icon={<Users className="w-6 h-6" />}
          bg="bg-sky-800"
        />
        <KpiCard
          title="Vehículos"
          value={totalVehiculos}
          icon={<Car className="w-6 h-6" />}
          bg="bg-sky-600"
        />
      </section>

      {/* Servidores */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {servers.map((srv) => (
          <ServerCard key={srv.id} server={srv} />
        ))}
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

function ServerCard({ server }: { server: ServerData }) {
  const online = server.estado === "online";
  const total = server.usuarios;

  const activosPct = (server.usuariosActivos / total) * 100;
  const inactivosPct = (server.usuariosInactivos / total) * 100;

  return (
    <Card className="rounded-2xl border border-emerald-200 bg-white">
      <CardContent className="p-6">
        {/* Header servidor */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sky-100 text-sky-800">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sky-900">
                {server.nombre}
              </h3>
              <p className="text-xs text-slate-500">
                {server.apiUrl}
              </p>
            </div>
          </div>

          <span
            className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full border ${
              online
                ? "bg-emerald-100 text-emerald-700 border-emerald-400"
                : "bg-red-100 text-red-700 border-red-300"
            }`}
          >
            <Activity className="w-3 h-3" />
            {online ? "Online" : "Offline"}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center mb-8">
          <Stat label="Usuarios" value={server.usuarios} />
          <Stat label="Sub" value={server.subUsuarios} />
          <Stat label="Vehículos" value={server.vehiculos} />
        </div>

        {/* Gráfico grande */}
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-sky-700" />
            <p className="text-sm font-semibold text-sky-900">
              Distribución de Usuarios
            </p>
          </div>

          <div className="space-y-4">
            {/* Activos */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-700 font-medium">
                  Activos ({server.usuariosActivos})
                </span>
                <span className="text-slate-500">
                  {activosPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-4 rounded-full bg-emerald-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-600"
                  style={{ width: `${activosPct}%` }}
                />
              </div>
            </div>

            {/* Inactivos */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-sky-800 font-medium">
                  Inactivos ({server.usuariosInactivos})
                </span>
                <span className="text-slate-500">
                  {inactivosPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-4 rounded-full bg-sky-200 overflow-hidden">
                <div
                  className="h-full bg-sky-600"
                  style={{ width: `${inactivosPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-sky-100 p-4 border border-sky-200">
      <p className="text-xs text-sky-700">{label}</p>
      <p className="text-lg font-semibold text-sky-900">
        {value}
      </p>
    </div>
  );
}
