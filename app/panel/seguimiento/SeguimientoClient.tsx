"use client";

import useSWR from "swr";
import { useMemo } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useState } from "react";
import { VehiculoConDescon } from "@/app/interfaces/vehiculo.interface";
import { Role } from "@/app/constants/roles";
import { getUnidadesConexApi } from "@/app/services/unidadesConexApi";
import PanelHeader from "@/app/components/nav/PanelHeader";

const MapView = dynamic(() => import("@/app/components/maps/MapView"), { ssr: false });

type Props = {
  role: Role;
};

const EN_DESARROLLO = true;

export default function SeguimientoClient({ role }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const vehiculosMock = [
    { deviceID: "GPS-001", accountID: "VELSAT", latitude: -12.0469, longitude: -77.0312, velocidad: 37 },
    { deviceID: "GPS-002", accountID: "PERUSAC", latitude: -12.0738, longitude: -77.0156, velocidad: 65 },
    { deviceID: "GPS-003", accountID: "VELSAT", latitude: -12.0924, longitude: -77.0568, velocidad: 18 },
    { deviceID: "GPS-004", accountID: "VELSAT", latitude: -11.9759, longitude: -77.0614, velocidad: 14 },
    { deviceID: "GPS-005", accountID: "PERUSAC", latitude: -11.9981, longitude: -76.9897, velocidad: 55 },
    { deviceID: "GPS-006", accountID: "VELSAT", latitude: -12.0126, longitude: -76.9379, velocidad: 47 },
    { deviceID: "GPS-007", accountID: "PERUSAC", latitude: -12.1438, longitude: -77.0204, velocidad: 10 },
    { deviceID: "GPS-008", accountID: "VELSAT", latitude: -12.1761, longitude: -77.0163, velocidad: 85 },
    { deviceID: "GPS-009", accountID: "PERUSAC", latitude: -12.0615, longitude: -77.1342, velocidad: 36 },
  ];

  const api = getUnidadesConexApi(role);
  const fetchUnidades = async () => {
    const res = await axios.get<VehiculoConDescon[]>(api.listUnidadesConex);
    return res.data;
  };
  useSWR(["unidadesConex", role], fetchUnidades, { revalidateOnFocus: false, keepPreviousData: true });

  const memoizedMap = useMemo(() => <MapView vehiculos={vehiculosMock} />, []);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#121214]">
      {/* ---------- HEADER (68px) ---------- */}
      <PanelHeader
        title={
          <span>
            Seguimiento de <span className="text-[#F05A28]">Unidades</span>
          </span>
        }
        subtitle="Monitoreo en tiempo real de la flota en el mapa"
        role={role}
      />

      {/* ---------- CONTENIDO ---------- */}
      <div className="flex-1 min-h-0 p-6 overflow-hidden">
        <div className="h-full rounded-[12px] overflow-hidden border border-[#26272B] bg-[#161719]">
          {EN_DESARROLLO ? <PantallaDesarrollo /> : memoizedMap}
        </div>
      </div>
    </div>
  );
}

/* ---------- PANTALLA EN DESARROLLO ---------- */
function PantallaDesarrollo() {
  return (
    <div className="h-full min-h-[420px] flex flex-col items-center justify-center bg-[#161719] gap-6 p-8 relative overflow-hidden select-none">
      {/* Grilla de fondo */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(#26272B 1px, transparent 1px), linear-gradient(90deg, #26272B 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* SVG animado */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        className="relative z-10"
      >
        <circle cx="60" cy="60" r="50" stroke="rgba(240,90,40,0.12)" strokeWidth="1">
          <animate attributeName="r" values="30;55;30" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="60" r="40" stroke="rgba(240,90,40,0.2)" strokeWidth="1">
          <animate attributeName="r" values="20;45;20" dur="3s" begin="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </circle>

        <circle
          cx="60"
          cy="60"
          r="22"
          fill="rgba(240,90,40,0.12)"
          stroke="rgba(240,90,40,0.35)"
          strokeWidth="1.5"
        />

        <path
          d="M60 42c-7.18 0-13 5.82-13 13 0 9.75 13 23 13 23s13-13.25 13-23c0-7.18-5.82-13-13-13z"
          fill="#F05A28"
        />
        <circle cx="60" cy="55" r="4" fill="#ffffff" />

        <circle cx="60" cy="22" r="3" fill="#F05A28">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 60 60"
            to="360 60 60"
            dur="6s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="60" cy="22" r="2" fill="#4ADE80" opacity="0.8">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="180 60 60"
            to="540 60 60"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* Texto */}
      <div className="text-center relative z-10">
        <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#F05A28] mb-2 m-0">
          En desarrollo
        </p>
        <h2 className="text-[20px] font-bold text-[#ECECEE] mb-2.5 m-0">
          Módulo de Seguimiento
        </h2>
        <p className="text-[13px] text-[#9B9CA1] max-w-[340px] leading-relaxed m-0">
          El mapa de rastreo en tiempo real está siendo construido. Pronto podrás visualizar todas
          las unidades de la flota.
        </p>
      </div>

      {/* Barra de progreso */}
      <div className="w-[240px] h-[4px] rounded-full bg-[#26272B] relative z-10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#F05A28] to-[#FF6A35]"
          style={{ animation: "barSlide 2s ease-in-out infinite" }}
        />
      </div>

      {/* Badges */}
      <div className="flex gap-2 relative z-10 flex-wrap justify-center">
        {["Rastreo GPS", "Tiempo real", "Historial de rutas"].map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-[#1A1210] border border-[#5A2A18] text-[#F05A28]"
          >
            {tag}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes barSlide {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}