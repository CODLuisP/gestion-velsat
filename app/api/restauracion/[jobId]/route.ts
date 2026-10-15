import { NextRequest, NextResponse } from "next/server";
import { restauracionFetch } from "@/app/services/restauracionApi";

// ---------------------------------------------------------------
// GET: avance de un trabajo de restauración
// ---------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!jobId || !/^[a-zA-Z0-9_-]{4,64}$/.test(jobId)) {
    return NextResponse.json({ success: false, error: "jobId no válido." }, { status: 400 });
  }

  try {
    const res = await restauracionFetch(`/api/restauracion/${jobId}`, { timeoutMs: 15000 });

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            res.status === 404
              ? "El trabajo ya no existe en el servicio de restauración."
              : res.data?.error || `El servicio respondió ${res.status}.`,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, job: res.data });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          error?.name === "TimeoutError"
            ? "El servicio de restauración no respondió a tiempo."
            : error?.message || "No se pudo consultar el avance.",
      },
      { status: 502 }
    );
  }
}
