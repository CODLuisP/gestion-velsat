import { NextResponse } from "next/server";
import { Role } from "@/app/constants/roles";
import { getUnidadesApi } from "@/app/services/unidadesApi";

/**
 * Lista unificada de placas de los tres servidores, para el autocompletado.
 *
 * La restauración se pide por placa (deviceID) sin importar en qué servidor
 * esté la unidad, así que aquí se juntan todas y se guardan 10 minutos en
 * memoria: la lista cambia poco y son tres llamadas externas.
 */

const SERVIDORES: { role: Role; etiqueta: string }[] = [
  { role: "Servidor_125", etiqueta: "125" },
  { role: "Servidor_107", etiqueta: "107" },
  { role: "Servidor_125_2", etiqueta: "Villa" },
];

interface PlacaItem {
  placa: string;
  cuenta: string;
  servidores: string[];
  // Datos de la unidad: los usa la pantalla de SMS para cargar la SIM del GPS
  simPhoneNumber: string;
  imeiNumber: string;
  equipmentType: string;
  deviceCode: string;
}

export async function GET() {
  const now = Date.now();
  const cache = (globalThis as any).__velsat_placas_cache_v2;

  if (cache && now - cache.timestamp < 600000) {
    return NextResponse.json({ success: true, placas: cache.data, cached: true });
  }

  const resultados = await Promise.allSettled(
    SERVIDORES.map(async ({ role, etiqueta }) => {
      const res = await fetch(getUnidadesApi(role).list, {
        signal: AbortSignal.timeout(20000),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`${etiqueta}: ${res.status}`);
      const data = await res.json();
      return { etiqueta, data: Array.isArray(data) ? data : [] };
    })
  );

  const mapa = new Map<string, PlacaItem>();

  for (const r of resultados) {
    if (r.status !== "fulfilled") {
      console.error("[placas] No se pudo leer un servidor:", r.reason?.message);
      continue;
    }
    for (const dev of r.value.data) {
      const placa = String(dev?.deviceID || "").trim().toLowerCase();
      if (!placa) continue;
      const existente = mapa.get(placa);
      if (existente) {
        if (!existente.servidores.includes(r.value.etiqueta)) {
          existente.servidores.push(r.value.etiqueta);
        }
        // Si la primera copia no traía SIM, completamos con la de este servidor
        if (!existente.simPhoneNumber && dev?.simPhoneNumber) {
          existente.simPhoneNumber = String(dev.simPhoneNumber);
          existente.imeiNumber = String(dev?.imeiNumber || existente.imeiNumber);
          existente.equipmentType = String(dev?.equipmentType || existente.equipmentType);
          existente.deviceCode = String(dev?.deviceCode || existente.deviceCode);
        }
      } else {
        mapa.set(placa, {
          placa,
          cuenta: String(dev?.accountID || ""),
          servidores: [r.value.etiqueta],
          simPhoneNumber: String(dev?.simPhoneNumber || ""),
          imeiNumber: String(dev?.imeiNumber || ""),
          equipmentType: String(dev?.equipmentType || ""),
          deviceCode: String(dev?.deviceCode || ""),
        });
      }
    }
  }

  const placas = Array.from(mapa.values()).sort((a, b) => a.placa.localeCompare(b.placa));

  // Si fallaron todos los servidores no guardamos caché vacía: se reintenta a la siguiente
  if (placas.length > 0) {
    (globalThis as any).__velsat_placas_cache_v2 = { timestamp: now, data: placas };
  }

  return NextResponse.json({
    success: placas.length > 0,
    placas,
    error: placas.length === 0 ? "No se pudo obtener la lista de placas de ningún servidor." : undefined,
  });
}
