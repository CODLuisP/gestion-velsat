"use client";

import useSWR from "swr";
import { useState, useMemo } from "react";
import { Server } from "lucide-react";
import axios from "axios";
import dynamic from "next/dynamic";

import { VehiculoConDescon } from "@/app/interfaces/vehiculo.interface";
import { Role } from "@/app/constants/roles";
import { getUnidadesConexApi } from "@/app/services/unidadesConexApi";

// 🔥 Mapa solo en cliente
const MapView = dynamic(
  () => import("@/app/components/maps/MapView"),
  { ssr: false }
);

type Props = {
  role: Role;
};

export default function SeguimientoClient({ role }: Props) {
  const [busqueda, setBusqueda] = useState("");

  // 🔥 JSON SIMULADO (LIMA - PERÚ)
const vehiculosMock = [
  { deviceID: "GPS-001", accountID: "VELSAT", latitude: -12.0469, longitude: -77.0312, velocidad: 37 }, // Cercado
  { deviceID: "GPS-002", accountID: "PERUSAC", latitude: -12.0738, longitude: -77.0156, velocidad: 65 }, // La Victoria
  { deviceID: "GPS-003", accountID: "VELSAT", latitude: -12.0924, longitude: -77.0568, velocidad: 18 }, // Magdalena
  { deviceID: "GPS-004", accountID: "VELSAT", latitude: -11.9759, longitude: -77.0614, velocidad: 14 }, // Los Olivos
  { deviceID: "GPS-005", accountID: "PERUSAC", latitude: -11.9981, longitude: -76.9897, velocidad: 55 }, // SJL
  { deviceID: "GPS-006", accountID: "VELSAT", latitude: -12.0126, longitude: -76.9379, velocidad: 47 }, // Ate
  { deviceID: "GPS-007", accountID: "PERUSAC", latitude: -12.1438, longitude: -77.0204, velocidad: 10 }, // Surco
  { deviceID: "GPS-008", accountID: "VELSAT", latitude: -12.1761, longitude: -77.0163, velocidad: 85 }, // Chorrillos
  { deviceID: "GPS-009", accountID: "PERUSAC", latitude: -12.0615, longitude: -77.1342, velocidad: 36 }  // Callao
];

  // 🔹 API real (aún no usada en el mapa)
  const api = getUnidadesConexApi(role);

  const fetchUnidades = async () => {
    const res = await axios.get<VehiculoConDescon[]>(
      api.listUnidadesConex
    );
    return res.data;
  };

  useSWR(["unidadesConex", role], fetchUnidades, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  // 🔥 EL MAPA SE CREA UNA SOLA VEZ
  const memoizedMap = useMemo(
    () => <MapView vehiculos={vehiculosMock} />,
    []
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-100 pt-2 rounded-3xl">
      <section className="mb-2 text-blue-700">
        <div className="flex items-center justify-between px-2">
          <h1 className="text-2xl font-bold ">
            Seguimiento de Unidades
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
      </section>

      <div className="flex-1 min-h-0 overflow-hidden rounded-3xl">
        {memoizedMap}
      </div>
    </div>
  );
}
