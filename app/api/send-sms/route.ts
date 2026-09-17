import { NextRequest, NextResponse } from "next/server";
import { addSentSms, getSmsHistory, clearSmsHistory, normalizePhoneNumber } from "@/app/services/smsStore";

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

    async function executeSend(timeoutMs: number): Promise<Response> {
      return fetch(`${GATEWAY}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({
          id: messageId,
          textMessage: { text: message },
          phoneNumbers: [normalizedPhone],
          priority: 100, // Expedito: salta retrasos y horario de trabajo del celular
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    }

    // Verifica si el gateway ya registró el mensaje (cuando la respuesta se cortó o falló)
    async function wasAccepted(): Promise<any | null> {
      try {
        const r = await fetch(`${GATEWAY}/messages/${messageId}`, {
          headers: { Authorization: authHeader },
          signal: AbortSignal.timeout(6000),
        });
        return r.ok ? await r.json() : null;
      } catch {
        return null;
      }
    }

    const isTransient = (status: number) => status === 409 || status >= 500;

    let res: Response | null = null;
    let acceptedData: any = null;
    for (let attempt = 1; attempt <= 2 && !acceptedData; attempt++) {
      try {
        res = await executeSend(attempt === 1 ? 20000 : 15000);
        if (res.ok || !isTransient(res.status)) break;
        console.warn(`[send-sms] Gateway retornó ${res.status} (intento ${attempt}).`);
      } catch (err: any) {
        res = null;
        console.warn(`[send-sms] Intento ${attempt} sin respuesta (${err?.name || err?.message}).`);
      }
      // Antes de reintentar, confirma si el mensaje ya quedó encolado para no duplicarlo
      acceptedData = await wasAccepted();
    }

    if (acceptedData) {
      const record = addSentSms({ phoneNumber, placa, model, message, status: "sent", gatewayResponse: acceptedData });
      return NextResponse.json({ success: true, data: acceptedData, record });
    }

    if (!res) {
      const errorMsg = "No se pudo contactar al SMS Gateway (sms-gate.app). Verifica tu conexión e inténtalo nuevamente.";
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

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { statusText: res.statusText };
    }

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

    let deviceStatus: any = null;
    const now = Date.now();
    const cache = (globalThis as any).__velsat_device_cache;

    if (cache && now - cache.timestamp < 30000) {
      deviceStatus = cache.data;
    } else if (hasUser && hasPass) {
      try {
        const auth = Buffer.from(`${process.env.SMS_GATEWAY_USER}:${process.env.SMS_GATEWAY_PASS}`).toString("base64");
        const devRes = await fetch("https://api.sms-gate.app/3rdparty/v1/devices", {
          headers: { Authorization: `Basic ${auth}` },
        });
        if (devRes.ok) {
          const devices = await devRes.json();
          if (Array.isArray(devices) && devices.length > 0) {
            const dev = devices[0];
            const lastSeenMs = dev.lastSeen ? new Date(dev.lastSeen).getTime() : 0;
            const diffMinutes = lastSeenMs ? Math.round((Date.now() - lastSeenMs) / 60000) : 999;
            deviceStatus = {
              id: dev.id,
              name: dev.name,
              lastSeen: dev.lastSeen,
              diffMinutes,
              isOnline: diffMinutes <= 4,
              carrier: dev.simCards?.[0]?.carrierName?.replace(/^\*/, "C") || "Móvil",
            };
            (globalThis as any).__velsat_device_cache = { data: deviceStatus, timestamp: now };
          }
        }
      } catch (err) {
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
