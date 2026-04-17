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
  TrendingUp,
  TrendingDown,
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

  const { usuarios, subUsuarios, vehiculos, isLoading } = useDashboard(role);

  const totalUsuarios    = usuarios.length;
  const totalSubUsuarios = subUsuarios.length;
  const totalVehiculos   = vehiculos.length;

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
    <div
      style={{
        minHeight: "100vh",
        padding: "32px",
       
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ---------- HEADER ---------- */}
      <header
        style={{
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#F4F5F7",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Dashboard{" "}
            <span style={{ color: "#E85D2F" }}>Velsat</span>
          </h1>
          <p style={{ fontSize: 13, color: "#8A9099", marginTop: 4 }}>
            Monitoreo general de usuarios, sub usuarios y unidades
          </p>
        </div>

        {/* Badge sistema + botón actualizar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 8,
              background: "#1C1F26",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                background: "rgba(232,93,47,0.12)",
                border: "1px solid rgba(232,93,47,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Server style={{ width: 15, height: 15, color: "#E85D2F", stroke: "#E85D2F" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#F4F5F7", margin: 0 }}>
                {role === "Servidor_125_2" ? "Urbano_125" : role}
              </p>
              <p style={{ fontSize: 10, color: "#8A9099", margin: 0 }}>Estado del sistema</p>
            </div>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: 20,
                background: "rgba(46,204,113,0.1)",
                border: "1px solid rgba(46,204,113,0.25)",
                color: "#2ECC71",
                marginLeft: 4,
              }}
            >
              <Activity style={{ width: 10, height: 10 }} />
              Online
            </span>
          </div>

          <button
            onClick={() => mutate(["dashboard", role], undefined, { revalidate: true })}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "16px 16px",
              borderRadius: 8,
              border: "none",
              background: "#E85D2F",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => !isLoading && ((e.currentTarget as HTMLButtonElement).style.background = "#cf4e24")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "#E85D2F")}
          >
            <RefreshCw
              style={{
                width: 14,
                height: 14,
                animation: isLoading ? "spin 1s linear infinite" : "none",
              }}
            />
            {isLoading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </header>

      {/* ---------- KPIs ---------- */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        <KpiBox
          title="Usuarios"
          value={totalUsuarios}
          activos={usuariosActivos}
          inactivos={usuariosInactivos}
          icon={<User style={{ width: 16, height: 16, color: "#fff", stroke: "#fff" }} />}
        />
        <KpiBox
          title="Sub Usuarios"
          value={totalSubUsuarios}
          activos={SubsuariosActivos}
          inactivos={SubsuariosInactivos}
          icon={<Users style={{ width: 16, height: 16, color: "#fff", stroke: "#fff" }} />}
        />
        <KpiBox
          title="Unidades"
          value={totalVehiculos}
          activos={vehiculosActivos}
          inactivos={vehiculosInactivos}
          icon={<Car style={{ width: 16, height: 16, color: "#fff", stroke: "#fff" }} />}
        />
      </section>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
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
  const pctActivos   = Math.round((activos   / total) * 100);
  const pctInactivos = Math.round((inactivos / total) * 100);

  return (
    <div
      style={{
        background: "#1C1F26",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,93,47,0.25)")}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)")}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderRadius: 10,
          background: "rgba(232,93,47,0.06)",
          border: "1px solid rgba(232,93,47,0.14)",
        }}
      >
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A9099", margin: 0 }}>
            {title}
          </p>
          <p style={{ fontSize: 32, fontWeight: 700, color: "#F4F5F7", margin: "4px 0 0", lineHeight: 1 }}>
            {value}
          </p>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#E85D2F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>

      {/* Distribución label */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <BarChart3 style={{ width: 14, height: 14, color: "#8A9099" }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A9099", margin: 0 }}>
          Distribución
        </p>
      </div>

      {/* Barras */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Activos */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: "#ADB5BD", display: "flex", alignItems: "center", gap: 4 }}>
              <TrendingUp style={{ width: 12, height: 12, color: "#2ECC71" }} />
              Activos ({activos})
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#2ECC71" }}>{pctActivos}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                background: "#2ECC71",
                width: `${pctActivos}%`,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* Inactivos */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: "#ADB5BD", display: "flex", alignItems: "center", gap: 4 }}>
              <TrendingDown style={{ width: 12, height: 12, color: "#E85D2F" }} />
              Inactivos ({inactivos})
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#E85D2F" }}>{pctInactivos}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                background: "#E85D2F",
                width: `${pctInactivos}%`,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}