import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverUrl, device, email = "velsat@velsat.pe", password = "velsat2026" } = body;

    if (!serverUrl || !device?.name || !device?.uniqueId) {
      return NextResponse.json(
        { success: false, error: "Parámetros incompletos (serverUrl, name y uniqueId son requeridos)." },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${email}:${password}`).toString("base64");
    const targetEndpoint = `${serverUrl.replace(/\/$/, "")}/api/devices`;

    // Permite conexiones seguras en puertos 2087
    const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    try {
      const traccarRes = await fetch(targetEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(device),
      });

      process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;

      const rawText = await traccarRes.text();
      let resData: any = {};
      try {
        resData = JSON.parse(rawText);
      } catch {
        resData = { raw: rawText };
      }

      if (!traccarRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: resData?.message || rawText || `Error HTTP ${traccarRes.status} desde Traccar`,
            status: traccarRes.status,
          },
          { status: traccarRes.status }
        );
      }

      return NextResponse.json({
        success: true,
        data: resData,
      });
    } catch (fetchErr: any) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
      throw fetchErr;
    }
  } catch (error: any) {
    console.error("Error al registrar dispositivo en Traccar:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Error interno al conectar con el servidor Traccar",
      },
      { status: 500 }
    );
  }
}
