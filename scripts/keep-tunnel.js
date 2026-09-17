const localtunnel = require("localtunnel");

const PORT = 3001;
const USER = "2S6CNP";
const PASS = "qxqzjzrdvz_elw";
const AUTH = Buffer.from(`${USER}:${PASS}`).toString("base64");

async function registerWebhook(publicUrl) {
  try {
    const webhookEndpoint = `${publicUrl}/api/gps-webhook`;
    console.log(`[TUNNEL] Registrando webhook en sms-gate.app: ${webhookEndpoint}`);

    // Intentar borrar webhook previo
    try {
      await fetch("https://api.sms-gate.app/3rdparty/v1/webhooks/gps-respuestas", {
        method: "DELETE",
        headers: { Authorization: `Basic ${AUTH}` },
      });
    } catch (_) {}

    // Registrar nuevo webhook
    const res = await fetch("https://api.sms-gate.app/3rdparty/v1/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${AUTH}`,
      },
      body: JSON.stringify({
        id: "gps-respuestas",
        url: webhookEndpoint,
        event: "sms:received",
      }),
    });

    const data = await res.json();
    console.log(`[TUNNEL] Webhook registrado (Status ${res.status}):`, data);
  } catch (err) {
    console.error("[TUNNEL] Error al registrar webhook:", err.message);
  }
}

async function startTunnel() {
  console.log(`[TUNNEL] Iniciando localtunnel en puerto ${PORT}...`);
  try {
    const tunnel = await localtunnel({
      port: PORT,
      subdomain: "velsat-sms-" + Math.floor(1000 + Math.random() * 9000),
    });

    console.log(`[TUNNEL] ✅ Túnel activo en: ${tunnel.url}`);
    await registerWebhook(tunnel.url);

    // Keepalive ping cada 45 segundos para evitar que se duerma
    const keepalive = setInterval(async () => {
      try {
        await fetch(`${tunnel.url}/api/send-sms`, {
          headers: { "Bypass-Tunnel-Reminder": "true" },
        });
      } catch (_) {}
    }, 45000);

    tunnel.on("close", () => {
      console.warn("[TUNNEL] Túnel cerrado. Reconectando en 3s...");
      clearInterval(keepalive);
      setTimeout(startTunnel, 3000);
    });

    tunnel.on("error", (err) => {
      console.error("[TUNNEL] Error en túnel:", err.message);
      try {
        tunnel.close();
      } catch (_) {}
    });
  } catch (err) {
    console.error("[TUNNEL] Fallo al iniciar túnel:", err.message, ". Reintentando en 5s...");
    setTimeout(startTunnel, 5000);
  }
}

startTunnel();
