import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { restauracionFetch, validarSolicitud } from "@/app/services/restauracionApi";

// ---------------------------------------------------------------
// POST: inicia un trabajo de restauración y devuelve el jobId
// ---------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const placas: string[] = Array.isArray(body?.placas)
      ? body.placas.map((p: string) => String(p).trim().toLowerCase()).filter(Boolean)
      : [];
    const desde = body?.desde;
    const hasta = body?.hasta;

    const errorValidacion = validarSolicitud(placas, desde, hasta);
    if (errorValidacion) {
      return NextResponse.json({ success: false, error: errorValidacion }, { status: 400 });
    }

    // Quién pidió la restauración: lo que escriba el operador, o su usuario
    const cookieStore = await cookies();
    const usuario = cookieStore.get("usuario")?.value || "";
    const solicitante = String(body?.solicitante || "").trim() || usuario || "Gestión Velsat";

    const res = await restauracionFetch("/api/restauracion", {
      method: "POST",
      body: { placas, desde, hasta, solicitante },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            res.data?.error ||
            res.data?.mensaje ||
            res.data?.message ||
            `El servicio de restauración respondió ${res.status}.`,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, job: res.data });
  } catch (error: any) {
    console.error("[restauracion] Error al iniciar el trabajo:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error?.name === "TimeoutError"
            ? "El servicio de restauración no respondió a tiempo."
            : error?.message || "No se pudo contactar al servicio de restauración.",
      },
      { status: 502 }
    );
  }
}

// ---------------------------------------------------------------
// GET: historial de trabajos recientes + estado del servicio
//
// El servicio limita a 10 peticiones por minuto por IP, así que el
// historial se guarda en memoria por 15 s.
// ---------------------------------------------------------------
export async function GET() {
  try {
    const now = Date.now();
    const cache = (globalThis as any).__velsat_restauracion_cache;

    if (cache && now - cache.timestamp < 15000) {
      return NextResponse.json({ success: true, ...cache.data, cached: true });
    }

    const [jobsRes, healthRes] = await Promise.allSettled([
      restauracionFetch("/api/restauracion", { timeoutMs: 15000 }),
      restauracionFetch("/health", { withKey: false, timeoutMs: 8000 }),
    ]);

    const jobs =
      jobsRes.status === "fulfilled" && jobsRes.value.ok && Array.isArray(jobsRes.value.data)
        ? jobsRes.value.data
        : [];
    const health =
      healthRes.status === "fulfilled" && healthRes.value.ok ? healthRes.value.data : null;

    const data = { jobs, health };
    (globalThis as any).__velsat_restauracion_cache = { timestamp: now, data };

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message, jobs: [], health: null },
      { status: 502 }
    );
  }
}
