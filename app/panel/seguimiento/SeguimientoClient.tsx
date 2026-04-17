"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { Server } from "lucide-react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useState } from "react";

import { VehiculoConDescon } from "@/app/interfaces/vehiculo.interface";
import { Role } from "@/app/constants/roles";
import { getUnidadesConexApi } from "@/app/services/unidadesConexApi";

const MapView = dynamic(() => import("@/app/components/maps/MapView"), { ssr: false });

type Props = {
  role: Role;
};

const EN_DESARROLLO = true; 

export default function SeguimientoClient({ role }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const vehiculosMock = [
    { deviceID: "GPS-001", accountID: "VELSAT",  latitude: -12.0469, longitude: -77.0312, velocidad: 37 },
    { deviceID: "GPS-002", accountID: "PERUSAC", latitude: -12.0738, longitude: -77.0156, velocidad: 65 },
    { deviceID: "GPS-003", accountID: "VELSAT",  latitude: -12.0924, longitude: -77.0568, velocidad: 18 },
    { deviceID: "GPS-004", accountID: "VELSAT",  latitude: -11.9759, longitude: -77.0614, velocidad: 14 },
    { deviceID: "GPS-005", accountID: "PERUSAC", latitude: -11.9981, longitude: -76.9897, velocidad: 55 },
    { deviceID: "GPS-006", accountID: "VELSAT",  latitude: -12.0126, longitude: -76.9379, velocidad: 47 },
    { deviceID: "GPS-007", accountID: "PERUSAC", latitude: -12.1438, longitude: -77.0204, velocidad: 10 },
    { deviceID: "GPS-008", accountID: "VELSAT",  latitude: -12.1761, longitude: -77.0163, velocidad: 85 },
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
            Seguimiento de <span style={{ color: "#E85D2F" }}>Unidades</span>
          </h1>
          <p style={{ fontSize: 12, color: "#8A9099", margin: "4px 0 0" }}>
            Monitoreo en tiempo real de la flota
          </p>
        </div>

        <div
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8,
            background: "#1C1F26", border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 12, color: "#ADB5BD",
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

      {/* ---------- CONTENIDO ---------- */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", borderRadius: 12 }}>
        {EN_DESARROLLO ? <PantallaDesarrollo /> : memoizedMap}
      </div>
    </div>
  );
}

/* ---------- PANTALLA EN DESARROLLO ---------- */
function PantallaDesarrollo() {
  return (
    <div
      style={{
        height: "100%",
        minHeight: 420,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#1C1F26",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        gap: 24,
        padding: 32,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grilla de fondo */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      {/* SVG animado */}
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ position: "relative", zIndex: 1 }}>
        {/* Círculos de ping */}
        <circle cx="60" cy="60" r="50" stroke="rgba(232,93,47,0.08)" strokeWidth="1">
          <animate attributeName="r" values="30;55;30" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="60" r="40" stroke="rgba(232,93,47,0.12)" strokeWidth="1">
          <animate attributeName="r" values="20;45;20" dur="3s" begin="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </circle>

        {/* Círculo base */}
        <circle cx="60" cy="60" r="22" fill="rgba(232,93,47,0.1)" stroke="rgba(232,93,47,0.3)" strokeWidth="1.5" />

        {/* Ícono mapa pin */}
        <path
          d="M60 42c-7.18 0-13 5.82-13 13 0 9.75 13 23 13 23s13-13.25 13-23c0-7.18-5.82-13-13-13z"
          fill="#E85D2F"
          opacity="0.9"
        />
        <circle cx="60" cy="55" r="4" fill="#fff" opacity="0.9" />

        {/* Puntos orbitando */}
        <circle cx="60" cy="22" r="3" fill="#C9A86C">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="22" r="2" fill="#2ECC71" opacity="0.7">
          <animateTransform attributeName="transform" type="rotate" from="180 60 60" to="540 60 60" dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Texto */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#E85D2F",
            margin: "0 0 8px",
          }}
        >
          En desarrollo
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F4F5F7", margin: "0 0 10px" }}>
          Módulo de Seguimiento
        </h2>
        <p style={{ fontSize: 13, color: "#8A9099", maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
          El mapa de rastreo en tiempo real está siendo construido.
          Pronto podrás visualizar todas las unidades de la flota.
        </p>
      </div>

      {/* Barra de progreso animada */}
      <div
        style={{
          width: 240,
          height: 4,
          borderRadius: 99,
          background: "rgba(255,255,255,0.06)",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            background: "linear-gradient(90deg, #E85D2F, #C9A86C)",
            animation: "barSlide 2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 10, position: "relative", zIndex: 1, flexWrap: "wrap", justifyContent: "center" }}>
        {["Rastreo GPS", "Tiempo real", "Historial de rutas"].map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: 20,
              background: "rgba(232,93,47,0.08)",
              border: "1px solid rgba(232,93,47,0.2)",
              color: "#E85D2F",
            }}
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