import { NextRequest, NextResponse } from "next/server";
import { addSentSms, getSmsHistory, clearSmsHistory, normalizePhoneNumber } from "@/app/services/smsStore";
import { gatewayRequest } from "@/app/services/gatewayFetch";

// Margen para reintento + verificación en Vercel
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message, placa, model } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: "El número de teléfono y el comando son requeridos." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Número de teléfono no válido. Debe tener al menos 9 dígitos (ej. 987654321)." },
        { status: 400 }
      );
    }

    const user = process.env.SMS_GATEWAY_USER;
    const pass = process.env.SMS_GATEWAY_PASS;

    if (!user || !pass) {
      return NextResponse.json(
        {
          success: false,
          error: "Credenciales de SMS Gateway no configuradas en el servidor (.env.local).",
        },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${user}:${pass}`).toString("base64");

    const authHeader = `Basic ${auth}`;
    const GATEWAY = "https://api.sms-gate.app/3rdparty/v1";

    // ID propio: hace el envío idempotente. Si reintentamos con el mismo ID,
    // el gateway no duplica el SMS, y podemos consultar si realmente quedó encolado.
    const messageId = crypto.randomUUID();

    async function executeSend(timeoutMs: number) {
      return gatewayRequest(`${GATEWAY}/messages`, {
        method: "POST",
        authHeader,
        timeoutMs,
        body: JSON.stringify({
          id: messageId,
          textMessage: { text: message },
          phoneNumbers: [normalizedPhone],
          priority: 100, // Expedito: salta retrasos y horario de trabajo del celular
        }),
      });
    }

    // Verifica si el gateway ya registró el mensaje. En serverless la conexión
    // se puede cortar DESPUÉS de que el gateway aceptó el SMS: sin esta consulta
    // marcábamos como fallido un mensaje que en realidad ya salió.
    async function wasAccepted(): Promise<any | null> {
      try {
        const r = await gatewayRequest(`${GATEWAY}/messages/${messageId}`, { authHeader, timeoutMs: 5000 });
        return r.ok ? r.json() : null;
      } catch {
        return null;
      }
    }

    const isTransient = (status: number) => status === 409 || status >= 500;

    // Intentos cortos: si la conexión se cuelga, cortamos rápido y reintentamos
    // con el mismo ID (el gateway no duplica el SMS) en vez de esperar 20 segundos.
    let res: Awaited<ReturnType<typeof executeSend>> | null = null;
    let acceptedData: any = null;
    let lastNetworkError = "";
    for (let attempt = 1; attempt <= 3 && !acceptedData; attempt++) {
      try {
        res = await executeSend(8000);
        if (res.ok || !isTransient(res.status)) break;
        console.warn(`[send-sms] Gateway retornó ${res.status} (intento ${attempt}).`);
      } catch (err: any) {
        res = null;
        lastNetworkError = err?.code || err?.name || err?.message || "desconocido";
        console.warn(`[send-sms] Intento ${attempt} sin respuesta (${lastNetworkError}).`);
      }
      acceptedData = await wasAccepted();
    }

    // Última verificación antes de dar por fallido: el gateway pudo aceptarlo tarde
    if (!acceptedData && (!res || !res.ok)) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      acceptedData = await wasAccepted();
    }

    if (acceptedData) {
      const record = addSentSms({ phoneNumber, placa, model, message, status: "sent", gatewayResponse: acceptedData });
      return NextResponse.json({ success: true, data: acceptedData, record });
    }

    if (!res) {
      const errorMsg = `No se pudo contactar al SMS Gateway (sms-gate.app). El SMS no fue enviado [${lastNetworkError || "sin respuesta"}]. Vuelve a intentarlo.`;
      const record = addSentSms({
        phoneNumber,
        placa,
        model,
        message,
        status: "failed",
        error: errorMsg,
      });
      return NextResponse.json({ success: false, error: errorMsg, record }, { status: 504 });
    }

    const data: any = res.json();

    if (!res.ok) {
      let errorMsg = data?.message || data?.error;
      if (!errorMsg || errorMsg === "<none>" || errorMsg.includes("<none>")) {
        if (res.status === 520 || res.status === 504 || res.status === 502) {
          errorMsg = "El celular módem tardó en responder (estaba en reposo). Mantén la app SMS Gateway abierta y el celular conectado al cargador.";
        } else {
          errorMsg = `Error ${res.status}: Servidor Gateway no disponible`;
        }
      }

      const record = addSentSms({
        phoneNumber,
        placa,
        model,
        message,
        status: "failed",
        error: errorMsg,
        gatewayResponse: data,
      });

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          details: data,
          record,
        },
        { status: res.status }
      );
    }

    const record = addSentSms({
      phoneNumber,
      placa,
      model,
      message,
      status: "sent",
      gatewayResponse: data,
    });

    return NextResponse.json({
      success: true,
      data,
      record,
    });
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error interno al conectar con SMS Gateway" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone") || undefined;
    const placa = searchParams.get("placa") || undefined;

    const hasUser = !!process.env.SMS_GATEWAY_USER;
    const hasPass = !!process.env.SMS_GATEWAY_PASS;

    const history = getSmsHistory(phone, placa);

    // "light=1": el sondeo frecuente del historial no consulta a sms-gate.app.
    // El estado del celular se refresca aparte, cada 30 s, para no saturar el gateway
    // (antes cada pantalla lo consultaba 40 veces por minuto y fallaba por ráfagas).
    const light = searchParams.get("light") === "1";

    const now = Date.now();
    const cache = (globalThis as any).__velsat_device_cache;
    let deviceStatus: any = cache?.data ?? null;

    if (!light && hasUser && hasPass && (!cache || now - cache.timestamp > 30000)) {
      try {
        const auth = Buffer.from(`${process.env.SMS_GATEWAY_USER}:${process.env.SMS_GATEWAY_PASS}`).toString("base64");
        const devRes = await gatewayRequest("https://api.sms-gate.app/3rdparty/v1/devices", {
          authHeader: `Basic ${auth}`,
          timeoutMs: 6000,
        });
        if (devRes.ok) {
          const devices = devRes.json();
          if (Array.isArray(devices) && devices.length > 0) {
            const dev = devices[0];
            const lastSeenMs = dev.lastSeen ? new Date(dev.lastSeen).getTime() : 0;
            const diffMinutes = lastSeenMs ? Math.round((Date.now() - lastSeenMs) / 60000) : 999;
            deviceStatus = {
              id: dev.id,
              name: dev.name,
              lastSeen: dev.lastSeen,
              diffMinutes,
              // El celular reporta cada pocos minutos: 10 min de margen evita
              // que el badge salte entre "EN LÍNEA" y "EN REPOSO" sin motivo
              isOnline: diffMinutes <= 10,
              carrier: dev.simCards?.[0]?.carrierName?.replace(/^\*/, "C") || "Móvil",
            };
            (globalThis as any).__velsat_device_cache = { data: deviceStatus, timestamp: now };
          }
        }
      } catch (err) {
        // Si la consulta falla, conservamos el último estado conocido en vez de apagar el badge
        console.error("Error checking devices status:", err);
      }
    }

    return NextResponse.json({
      configured: hasUser && hasPass,
      gatewayUser: hasUser ? String(process.env.SMS_GATEWAY_USER) : null,
      deviceStatus,
      history: history.records,
      incoming: history.incoming,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE() {
  clearSmsHistory();
  return NextResponse.json({ success: true, message: "Historial de SMS limpiado." });
}
