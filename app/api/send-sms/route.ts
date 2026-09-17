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

    const res = await fetch("https://api.sms-gate.app/3rdparty/v1/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        textMessage: { text: message },
        phoneNumbers: [normalizedPhone],
      }),
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { statusText: res.statusText };
    }

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `Error ${res.status}: ${res.statusText}`;
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
    if (hasUser && hasPass) {
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
