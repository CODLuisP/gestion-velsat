"use client";
import useSWR, { mutate } from "swr";
import { useState, useMemo } from "react";
import ButtonBase from "@/app/components/ui/ButtonBase";
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

export default function UnidadesConexClient({role}: Props) {
  const [busqueda, setBusqueda] = useState("");

  // 🔹 Traer usuarios por servidor de la API
  const api = getUnidadesConexApi(role);

  // 🔹 Traer vehiculos
  const fetchUnidades = async () => {
    const res = await axios.get<VehiculoConDescon[]>(api.listUnidadesConex);
  return res.data;
  };

  const { data: vehiculosConex = [], isLoading } = useSWR(
  role ? ["unidadesConex", role] : null,
  fetchUnidades,
  {
    revalidateOnFocus: false,
    keepPreviousData: true,
  }
);

  // Filtrado de búsqueda
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
  gt06n: 'GT',
  gps103a: 'TK',
  gps103b: 'TK',
};

  const columns = [
    { key: "deviceID", label: "PLACA" },
    { key: "accountID", label: "USUARIO" },
    { key: "lastValidSpeed", label: "VELOCIDAD", render: (row: VehiculoConDescon) =>
        Number(row.lastValidSpeed).toFixed(0),},
    {key: "lastGPSTimestamp_date", label: "FECHA ÚLTIMO REPORTE", render: (row: VehiculoConDescon) => (
        <UnixNormal creationTime={row.lastGPSTimestamp} show="date" />
      ),
    },
        {key: "lastGPSTimestamp_time", label: "HORA ÚLTIMO REPORTE", render: (row: VehiculoConDescon) => (
        <UnixNormal creationTime={row.lastGPSTimestamp} show="time" />
      ),
    },
    {
      key: "tiempoDesconex",
      label: "TIEMPO DE DESCONEXIÓN",
      render: (row: VehiculoConDescon) => (
        <UnixNormal
          creationTime={row.lastGPSTimestamp}
          diffWithStatus
        />
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
      render: (row: VehiculoConDescon) =>
        Number(row.lastValidLatitude).toFixed(5),
    },
    {
      key: "lastValidLongitude",
      label: "LONGITUD",
      render: (row: VehiculoConDescon) =>
        Number(row.lastValidLongitude).toFixed(5),
    },
  ];

  return (
    <>
      {/* Header con selección de servidor */}
      <div className="flex h-full min-h-0 flex-col">

        <section className="mb-4 text-blue-700">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    Unidades Conectadas y desconectadas 
                </h1>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Server size={14} className="text-orange-500" />
                  <span className="font-medium">
                    Conectado a
                    <span className="ml-1 font-semibold text-orange-500">
                      {role === "Servidor_125_2" ? "Urbano_125" : role}
                    </span>
                  </span>
                </div>
            </div>

            <p className="mt-2 text-sm font-semibold text-center text-sky-700">
                
            </p>
        </section>

        {/* Tabla */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TablaBase
            leftActions={
              <div className="w-96">
                <ImputBuscar
                  placeholder="Buscar por Placa o Usuario"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            }
            rightActions={
                <button
                  onClick={() =>
                    mutate(["unidadesConex", role], undefined, {
                      revalidate: true,
                    })
                  }
                  disabled={isLoading}
                  className="flex items-center gap-1 px-5 py-2 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600 disabled:opacity-50 transition"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  {isLoading ? "Actualizando..." : "Actualizar"}
                </button>
            }
            columns={columns}
            data={vehiculosFiltrados}
            loading={isLoading}
          />
        </div>
      </div>
    </>
  );
}
