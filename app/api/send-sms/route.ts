import { NextRequest, NextResponse } from "next/server";
import { addSentSms, getSmsHistory, clearSmsHistory, normalizePhoneNumber } from "@/app/services/smsStore";

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

    // Función auxiliar para enviar con timeout controlado
    async function executeSend(timeoutMs = 9000): Promise<Response> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch("https://api.sms-gate.app/3rdparty/v1/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            textMessage: { text: message },
            phoneNumbers: [normalizedPhone],
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        return response;
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    }

    let res: Response;
    try {
      res = await executeSend(9000);
      // Si el módem celular estaba en reposo, Cloudflare puede devolver 520 o 504.
      // La primera llamada despierta el celular por FCM. Reintentamos en 1 segundo.
      if (res.status === 520 || res.status === 502 || res.status === 503 || res.status === 504) {
        console.warn(`[send-sms] Gateway retornó ${res.status}. Reintentando envío...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        res = await executeSend(10000);
      }
    } catch (err: any) {
      console.warn(`[send-sms] Intento 1 demoró o falló (${err?.name || err?.message}). Reintentando...`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      try {
        res = await executeSend(10000);
      } catch (err2: any) {
        const errorMsg = "El celular módem no respondió a tiempo (posible reposo de batería). Mantén la app abierta y el celular cargando.";
        const record = addSentSms({
          phoneNumber,
          placa,
          model,
          message,
          status: "failed",
          error: errorMsg,
        });
        return NextResponse.json(
          { success: false, error: errorMsg, record },
          { status: 504 }
        );
      }
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
