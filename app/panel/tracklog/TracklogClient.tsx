"use client";

import { useState } from "react";
import axios from "axios";
import { Search, Server } from "lucide-react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import InputBase1 from "@/app/components/ui/InputBase1";
import { Role } from "@/app/constants/roles";
import { getTracklogApi } from "@/app/services/tracklogApi";

type Props = {
  role: Role;
};

type LastEnvio = {
  placa: string;
  fechaEvento: string;
  horaEvento: string;
  latitud: string;
  longitud: string;
  direccion: number;
  velocidad: number;
  evento: string;
  odometro: number;
};

type AuditoriaTracklog = {
  id: number;
  accountID: string;
  deviceID: string;
  fecharegistro: string;
  lastenvio: string;
  lastrespuesta: string;
};

function parseJSON<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const CELL: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 12,
  color: "#ADB5BD",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  verticalAlign: "middle",
  textAlign: "left",
};

const HEADER: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "#8A9099",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  whiteSpace: "nowrap",
  textAlign: "left",
};

function Badge({ text, ok }: { text: string; ok: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 600,
        background: ok ? "rgba(46,204,113,0.12)" : "rgba(232,93,47,0.12)",
        color: ok ? "#2ecc71" : "#E85D2F",
        border: `1px solid ${ok ? "rgba(46,204,113,0.3)" : "rgba(232,93,47,0.3)"}`,
      }}
    >
      {text}
    </span>
  );
}

export default function TracklogClient({ role }: Props) {
  const [cuenta, setCuenta] = useState("");
  const [placa, setPlaca] = useState("");
  const [registros, setRegistros] = useState<AuditoriaTracklog[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempt, setSubmitAttempt] = useState(false);

  const api = getTracklogApi(role);

  async function handleConsultar() {
    setSubmitAttempt(true);
    if (!cuenta.trim() || !placa.trim()) return;

    setLoading(true);
    setError(null);
    setRegistros(null);

    try {
      const res = await axios.get<AuditoriaTracklog[]>(
        api.auditoria(cuenta.trim(), placa.trim())
      );
      setRegistros(res.data);
    } catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      setError(
        status === 404
          ? "El servicio de Tracklog no está disponible en este servidor."
          : "No se pudo obtener la información. Verifique los datos e intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Título */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#F4F5F7" }}>
            Tracklog
          </h1>
          <p style={{ color: "#8A9099", fontSize: 13, marginTop: 4 }}>
            Retransmisión Tracklog S.A.C. — consulta de auditoría por cuenta y placa
          </p>
        </div>

        <div
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8,
            background: "#1C1F26", border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 12, color: "#ADB5BD",
          }}
        >
          <Server size={13} style={{ color: "#E85D2F" }} />
          <span>
            Conectado a <strong style={{ color: "#E85D2F" }}>{role}</strong>
          </span>
        </div>
      </div>

      {/* Formulario */}
      <div
        style={{
          background: "#1C1F26",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div style={{ minWidth: 200 }}>
            <InputBase1
              label="Cuenta"
              placeholder="Ej: transcubas"
              value={cuenta}
              required
              submitAttempt={submitAttempt}
              onChange={(e) => setCuenta(e.target.value)}
            />
          </div>
          <div style={{ minWidth: 200 }}>
            <InputBase1
              label="Placa"
              placeholder="Ej: d2w-974"
              value={placa}
              required
              submitAttempt={submitAttempt}
              onChange={(e) => setPlaca(e.target.value)}
            />
          </div>
          <ButtonBase variant="primary" onClick={handleConsultar} disabled={loading}>
            <Search size={14} />
            {loading ? "Consultando..." : "Consultar"}
          </ButtonBase>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "rgba(232,93,47,0.08)",
            border: "1px solid rgba(232,93,47,0.25)",
            borderRadius: 8,
            padding: "12px 16px",
            color: "#E85D2F",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Resultados */}
      {registros !== null && (
        <div
          style={{
            background: "#1C1F26",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#F4F5F7", fontWeight: 600, fontSize: 14 }}>
              Últimos registros
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#8A9099",
                background: "rgba(255,255,255,0.05)",
                padding: "2px 10px",
                borderRadius: 20,
              }}
            >
              {registros.length} {registros.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          {registros.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#8A9099", fontSize: 13 }}>
              Sin registros para esta consulta.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    <th style={HEADER}>#</th>
                    <th style={HEADER}>Cuenta</th>
                    <th style={HEADER}>Dispositivo</th>
                    <th style={HEADER}>Fecha Registro</th>
                    <th style={HEADER}>Placa</th>
                    <th style={HEADER}>Evento GPS</th>
                    <th style={HEADER}>Fecha/Hora Evento</th>
                    <th style={HEADER}>Posición</th>
                    <th style={HEADER}>Velocidad</th>
                    <th style={HEADER}>Odómetro</th>
                    <th style={HEADER}>Respuesta</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const envio = parseJSON<LastEnvio>(r.lastenvio);
                    const isOk = /^2\d\d:/.test(r.lastrespuesta ?? "");

                    return (
                      <tr
                        key={r.id}
                        style={{ transition: "background 0.15s" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.background =
                            "rgba(255,255,255,0.025)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.background =
                            "transparent")
                        }
                      >
                        <td style={{ ...CELL, color: "#8A9099" }}>{r.id}</td>
                        <td style={{ ...CELL, color: "#F4F5F7", fontWeight: 500 }}>
                          {r.accountID}
                        </td>
                        <td style={CELL}>{r.deviceID}</td>
                        <td style={{ ...CELL, whiteSpace: "nowrap" }}>
                          {formatDate(r.fecharegistro)}
                        </td>
                        <td style={{ ...CELL, color: "#F4F5F7", fontWeight: 600 }}>
                          {envio?.placa ?? "—"}
                        </td>
                        <td style={CELL}>{envio?.evento ?? "—"}</td>
                        <td style={{ ...CELL, whiteSpace: "nowrap" }}>
                          {envio ? `${envio.fechaEvento} ${envio.horaEvento}` : "—"}
                        </td>
                        <td style={{ ...CELL, whiteSpace: "nowrap" }}>
                          {envio ? `${envio.latitud}, ${envio.longitud}` : "—"}
                        </td>
                        <td style={CELL}>
                          {envio != null ? `${envio.velocidad} km/h` : "—"}
                        </td>
                        <td style={CELL}>
                          {envio != null ? `${envio.odometro} km` : "—"}
                        </td>
                        <td style={CELL}>
                          {r.lastrespuesta ? (
                            <Badge text={r.lastrespuesta.slice(0, 60)} ok={isOk} />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
