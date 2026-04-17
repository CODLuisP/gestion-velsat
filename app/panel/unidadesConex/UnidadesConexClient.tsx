"use client";
import useSWR, { mutate } from "swr";
import { useState, useMemo } from "react";
import TablaBase from "@/app/components/tablas/TablaBase";
import { RefreshCw, Server } from "lucide-react";
import axios from "axios";
import { VehiculoConDescon } from "@/app/interfaces/vehiculo.interface";
import { Role } from "@/app/constants/roles";
import ImputBuscar from "@/app/components/ui/ImputBuscar";
import { getUnidadesConexApi } from "@/app/services/unidadesConexApi";
import UnixNormal from "@/app/components/fecha/UnixNormal";

type Props = {
  role: Role;
};

export default function UnidadesConexClient({ role }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const api = getUnidadesConexApi(role);

  const fetchUnidades = async () => {
    const res = await axios.get<VehiculoConDescon[]>(api.listUnidadesConex);
    return res.data;
  };

  const { data: vehiculosConex = [], isLoading } = useSWR(
    role ? ["unidadesConex", role] : null,
    fetchUnidades,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const vehiculosFiltrados = useMemo(() => {
    if (!busqueda) return vehiculosConex;
    return vehiculosConex.filter((u) =>
      [u.deviceID, u.accountID]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [busqueda, vehiculosConex]);

  const gpsModelMap: Record<string, string> = {
    gt06n: "GT",
    gps103a: "TK",
    gps103b: "TK",
  };

  const columns = [
    { key: "deviceID", label: "PLACA" },
    { key: "accountID", label: "USUARIO" },
    {
      key: "lastValidSpeed",
      label: "VELOCIDAD",
      render: (row: VehiculoConDescon) => Number(row.lastValidSpeed).toFixed(0),
    },
    {
      key: "lastGPSTimestamp_date",
      label: "ÚLT. FECHA",
      render: (row: VehiculoConDescon) => (
        <UnixNormal creationTime={row.lastGPSTimestamp} show="date" />
      ),
    },
    {
      key: "lastGPSTimestamp_time",
      label: "ÚLT. HORA",
      render: (row: VehiculoConDescon) => (
        <UnixNormal creationTime={row.lastGPSTimestamp} show="time" />
      ),
    },
    {
      key: "tiempoDesconex",
      label: "T. DESCONEX.",
      render: (row: VehiculoConDescon) => (
        <UnixNormal creationTime={row.lastGPSTimestamp} diffWithStatus />
      ),
    },
    {
      key: "deviceCode",
      label: "MODELO GPS",
      render: (row: VehiculoConDescon) => {
        const model = row.deviceCode?.toLowerCase();
        return gpsModelMap[model] ?? row.deviceCode;
      },
    },
    { key: "imeiNumber", label: "IMEI" },
    {
      key: "lastValidLatitude",
      label: "LATITUD",
      render: (row: VehiculoConDescon) => Number(row.lastValidLatitude).toFixed(5),
    },
    {
      key: "lastValidLongitude",
      label: "LONGITUD",
      render: (row: VehiculoConDescon) => Number(row.lastValidLongitude).toFixed(5),
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ---------- HEADER ---------- */}
      <section
        style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F4F5F7", margin: 0, lineHeight: 1.2 }}>
            Unidades <span style={{ color: "#E85D2F" }}>Conexión / Desconexión</span>
          </h1>
          <p style={{ fontSize: 12, color: "#8A9099", margin: "4px 0 0" }}>
            Monitoreo de estado de conexión de unidades
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            background: "#1C1F26",
            border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 12,
            color: "#ADB5BD",
          }}
        >
          <Server size={13} style={{ color: "#E85D2F" }} />
          <span>
            Conectado a{" "}
            <strong style={{ color: "#E85D2F" }}>
              {role === "Servidor_125_2" ? "Urbano_125" : role}
            </strong>
          </span>
        </div>
      </section>

      {/* ---------- TABLA ---------- */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <TablaBase
          leftActions={
            <div style={{ width: 384 }}>
              <ImputBuscar
                placeholder="Buscar por Placa o Usuario"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          }
          rightActions={
            <button
              onClick={() => mutate(["unidadesConex", role], undefined, { revalidate: true })}
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
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
              onMouseEnter={e => {
                if (!isLoading)
                  (e.currentTarget as HTMLButtonElement).style.background = "#cf4e24";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "#E85D2F";
              }}
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
          }
          columns={columns}
          data={vehiculosFiltrados}
          loading={isLoading}
        />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}