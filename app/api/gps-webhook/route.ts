import { NextRequest, NextResponse } from "next/server";
import { recordIncomingResponse, getSmsHistory } from "@/app/services/smsStore";

function getAuthHeader() {
  const user = process.env.SMS_GATEWAY_USER;
  const pass = process.env.SMS_GATEWAY_PASS;
  if (!user || !pass) return null;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

// -------------------------------------------------------------
// POST: Recibe los eventos de webhook de sms-gate.app
// -------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Payload can be nested in body.payload (sms-gate.app format) or directly in body
    const payload = body?.payload || body;
    const sender = payload?.sender || payload?.from || payload?.phone;
    const message = payload?.message || payload?.text || payload?.textMessage?.text || "";
    const receivedAt = payload?.receivedAt || new Date().toISOString();
    const recipient = payload?.recipient || payload?.to;

    if (!sender || !message) {
      return NextResponse.json(
        { status: "ignored", reason: "Missing sender or message in payload" },
        { status: 200 }
      );
    }

    console.log(`[GPS Webhook] Respuesta recibida de ${sender}: "${message}" (${receivedAt})`);

    const result = recordIncomingResponse({
      sender,
      message,
      receivedAt,
      recipient,
    });

    return NextResponse.json({
      status: "ok",
      matched: !!result.matchedRecord,
      matchedPlaca: result.matchedRecord?.placa || null,
      matchedRecordId: result.matchedRecord?.id || null,
      messageId: payload?.messageId,
    });
  } catch (error: any) {
    console.error("[GPS Webhook Error]:", error);
    return NextResponse.json({ status: "error", error: error?.message }, { status: 500 });
  }
}

// -------------------------------------------------------------
// GET: Devuelve historial de respuestas y estado del webhook en sms-gate.app
// -------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone") || undefined;
    const placa = searchParams.get("placa") || undefined;

    const history = getSmsHistory(phone, placa);

    // Consulta webhooks registrados en sms-gate.app
    let registeredWebhooks: any[] = [];
    const auth = getAuthHeader();
    if (auth) {
      try {
        const res = await fetch("https://api.sms-gate.app/3rdparty/v1/webhooks", {
          headers: { Authorization: auth },
        });
        if (res.ok) {
          registeredWebhooks = await res.json();
        }
      } catch (err) {
        console.error("Error al consultar webhooks de sms-gate.app:", err);
      }
    }

    return NextResponse.json({
      success: true,
      incoming: history.incoming,
      records: history.records,
      registeredWebhooks,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// -------------------------------------------------------------
// PUT: Registra o actualiza el webhook directamente en sms-gate.app
// -------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || !url.startsWith("https://")) {
      return NextResponse.json(
        { success: false, error: "La URL debe ser pública y comenzar con https://" },
        { status: 400 }
      );
    }

    const auth = getAuthHeader();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Credenciales de SMS Gateway no configuradas (.env.local)" },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.sms-gate.app/3rdparty/v1/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({
        id: "gps-respuestas",
        url,
        event: "sms:received",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.message || "Error al registrar webhook en sms-gate.app" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Webhook registrado con éxito en sms-gate.app",
      data,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// -------------------------------------------------------------
// DELETE: Elimina el webhook registrado en sms-gate.app
// -------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "gps-respuestas";

    const auth = getAuthHeader();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Credenciales no configuradas" },
        { status: 500 }
      );
    }

    const res = await fetch(`https://api.sms-gate.app/3rdparty/v1/webhooks/${id}`, {
      method: "DELETE",
      headers: { Authorization: auth },
    });

    if (res.status === 204 || res.ok) {
      return NextResponse.json({ success: true, message: "Webhook eliminado correctamente" });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { success: false, error: data?.message || "No se pudo eliminar el webhook" },
      { status: res.status }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

