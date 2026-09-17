import https from "https";

/**
 * Cliente HTTP para sms-gate.app pensado para entornos serverless (Vercel).
 *
 * El `fetch` global fallaba de forma intermitente en producción: los envíos se
 * quedaban colgados y luego reportaban error, aunque desde una PC la misma API
 * responde en menos de un segundo. Dos causas conocidas en Lambda/Vercel:
 *
 *   1. api.sms-gate.app publica IPv6 (Cloudflare) y la salida IPv6 no existe
 *      en el entorno serverless, por lo que la conexión se queda esperando.
 *   2. Las conexiones reutilizadas (keep-alive) quedan muertas mientras la
 *      función está congelada entre invocaciones, y el siguiente pedido se
 *      cuelga hasta agotar el tiempo.
 *
 * Por eso aquí forzamos IPv4 y una conexión nueva en cada llamada, y
 * devolvemos el código de error real (ETIMEDOUT, ECONNRESET, ...) para poder
 * diagnosticar en vez de mostrar un "no se pudo contactar" genérico.
 */

export interface GatewayResponse {
  ok: boolean;
  status: number;
  body: string;
  json: () => any;
}

export function gatewayRequest(
  url: string,
  options: {
    method?: string;
    authHeader: string;
    body?: string;
    timeoutMs?: number;
  }
): Promise<GatewayResponse> {
  const { method = "GET", authHeader, body, timeoutMs = 8000 } = options;
  const target = new URL(url);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        method,
        family: 4, // Evita el intento por IPv6, que en serverless queda colgado
        agent: new https.Agent({ keepAlive: false, family: 4 }),
        headers: {
          Authorization: authHeader,
          ...(body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {}),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const status = res.statusCode || 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            body: data,
            json: () => {
              try {
                return JSON.parse(data);
              } catch {
                return {};
              }
            },
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(Object.assign(new Error("Tiempo de espera agotado"), { code: "ETIMEDOUT" }));
    });
    req.on("error", reject);

    if (body) req.write(body);
    req.end();
  });
}
