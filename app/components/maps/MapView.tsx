"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type VehiculoMapa = {
  deviceID: string;
  accountID: string;
  latitude: number;
  longitude: number;
  velocidad: number;
};

type Props = {
  vehiculos: VehiculoMapa[];
};

export default function MapView({ vehiculos }: Props) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    const loadMap = async () => {
      const L = await import("leaflet"); // 🔥 IMPORT DINÁMICO

      if (!isMounted) return;

      // 🚗 Icono personalizado
      const carIcon = L.icon({
        iconUrl: "/UnidadK.webp",
        iconSize: [40, 32],
        iconAnchor: [20, 16],
        popupAnchor: [0, -20],
      });

      // 🗺️ Inicializar mapa SOLO UNA VEZ
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current!).setView(
          [-12.0464, -77.0428],
          12
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapRef.current);
      }

      // 🧹 Eliminar solo markers anteriores
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          mapRef.current.removeLayer(layer);
        }
      });

      // 📍 Agregar vehículos
      vehiculos.forEach((v) => {
        const marker = L.marker([v.latitude, v.longitude], {
          icon: carIcon,
        }).addTo(mapRef.current);

        // 🏷️ Tooltip (label fijo)
        marker.bindTooltip(v.deviceID, {
          permanent: true,
          direction: "top",
          offset: [0, -16],
          className: `${
            v.velocidad > 50 ? "bg-red-600" : "bg-green-600"
          } text-white text-xs font-semibold px-2 py-1 rounded-md shadow-lg`,
        });

        // 📦 Popup
        marker.bindPopup(
          `
          <div class="text-sm space-y-1">
            <div class="font-semibold text-slate-800">${v.deviceID}</div>
            <div><b>Cuenta:</b> ${v.accountID}</div>
            <div><b>Lat:</b> ${v.latitude}</div>
            <div><b>Lng:</b> ${v.longitude}</div>
            <div><b>Vel:</b> ${v.velocidad}</div>
          </div>
        `,
          {
            offset: [0, 17],
            autoPan: false,
            closeButton: false,
          }
        );
      });
    };

    loadMap();

    return () => {
      isMounted = false;
    };
  }, [vehiculos]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
    />
  );
}