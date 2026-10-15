/**
 * Cliente del servicio de restauración de data histórica GPS (sr.velsat.pe).
 *
 * Solo se usa desde rutas del servidor: la API key nunca debe llegar al navegador.
 */

const BASE_URL = process.env.RESTAURACION_API_URL || "https://sr.velsat.pe:2083";

export interface RestauracionResult {
  ok: boolean;
  status: number;
  data: any;
}

export function getApiKey(): string | null {
  return process.env.RESTAURACION_API_KEY || null;
}

export async function restauracionFetch(
  path: string,
  options: { method?: string; body?: any; timeoutMs?: number; withKey?: boolean } = {}
): Promise<RestauracionResult> {
  const { method = "GET", body, timeoutMs = 20000, withKey = true } = options;

  const headers: Record<string, string> = {};
  if (withKey) {
    const key = getApiKey();
    if (!key) {
      return {
        ok: false,
        status: 500,
        data: { error: "Falta RESTAURACION_API_KEY en las variables de entorno del servidor." },
      };
    }
    headers["X-Api-Key"] = key;
  }
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  return { ok: res.ok, status: res.status, data };
}

// ---------------------------------------------------------------
// Validaciones del formulario (se aplican también en el servidor)
// ---------------------------------------------------------------

export const MAX_DIAS_RANGO = 62;

// La API acepta los dos formatos en los mismos campos: día completo u hora exacta
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/** Instante del valor pedido. Sin hora: 00:00:00 en 'desde' y 23:59:59 en 'hasta'. */
function instanteMs(valor: string, extremo: "desde" | "hasta"): number {
  if (FORMATO_FECHA.test(valor)) {
    return Date.parse(`${valor}T${extremo === "desde" ? "00:00:00" : "23:59:59"}`);
  }
  return Date.parse(valor.length === 16 ? `${valor}:00` : valor);
}

export function validarSolicitud(placas: unknown, desde: unknown, hasta: unknown): string | null {
  if (!Array.isArray(placas) || placas.length === 0) {
    return "Selecciona al menos una placa.";
  }

  for (const [campo, valor] of [
    ["desde", desde],
    ["hasta", hasta],
  ] as const) {
    if (typeof valor !== "string" || (!FORMATO_FECHA.test(valor) && !FORMATO_FECHA_HORA.test(valor))) {
      return `El campo '${campo}' debe tener formato AAAA-MM-DD o AAAA-MM-DDTHH:mm.`;
    }
  }

  const desdeMs = instanteMs(desde as string, "desde");
  const hastaMs = instanteMs(hasta as string, "hasta");
  if (isNaN(desdeMs) || isNaN(hastaMs)) return "Las fechas ingresadas no son válidas.";

  if (desdeMs >= hastaMs) {
    return "El inicio del rango debe ser anterior al fin.";
  }

  const duracionMs = hastaMs - desdeMs;
  if (duracionMs > MAX_DIAS_RANGO * 86400000) {
    return `El rango no puede superar los ${MAX_DIAS_RANGO} días (estás pidiendo ${Math.ceil(
      duracionMs / 86400000
    )}).`;
  }

  return null;
}
