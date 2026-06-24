"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, Plus, Trash2 } from "lucide-react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import InputBase1 from "@/app/components/ui/InputBase1";
import { Role } from "@/app/constants/roles";
import { getSutranApi } from "@/app/services/sutranApi";

type Props = {
  role: Role;
};

type DeviceSutran = {
  accountID: string;
  deviceID: string;
};

type LastEnvio = {
  plate: string;
  geo: [number, number];
  direction: number;
  event: string;
  speed: number;
  time_device: string;
  imei: number;
};

type LastRespuesta = {
  crc: string;
  code: number;
  result: string;
};

type AuditoriaSutran = {
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

export default function SutranClient({ role }: Props) {
  const [cuenta, setCuenta] = useState("");
  const [placa, setPlaca] = useState("");
  const [registros, setRegistros] = useState<AuditoriaSutran[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempt, setSubmitAttempt] = useState(false);

  const [unidades, setUnidades] = useState<DeviceSutran[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [agregarLoading, setAgregarLoading] = useState(false);
  const [quitarLoading, setQuitarLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const api = getSutranApi(role);

  const fetchUnidades = useCallback(async () => {
    setLoadingUnidades(true);
    try {
      const res = await axios.get<DeviceSutran[]>(getSutranApi(role).getUnidadesSutran());
      setUnidades(res.data);
    } catch {
      // silent — la sección mostrará lista vacía
    } finally {
      setLoadingUnidades(false);
    }
  }, [role]);

  useEffect(() => {
    fetchUnidades();
  }, [fetchUnidades]);

  async function handleConsultar() {
    setSubmitAttempt(true);
    if (!cuenta.trim() || !placa.trim()) return;

    setLoading(true);
    setError(null);
    setRegistros(null);

    try {
      const res = await axios.get<AuditoriaSutran[]>(
        api.auditoria(cuenta.trim(), placa.trim())
      );
      setRegistros(res.data);
    } catch {
      setError("No se pudo obtener la información. Verifique los datos e intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAgregar() {
    setSubmitAttempt(true);
    if (!cuenta.trim() || !placa.trim()) return;

    setAgregarLoading(true);
    setActionError(null);

    try {
      await axios.put(api.habilitarSutran(cuenta.trim(), placa.trim(), "1"));
      await fetchUnidades();
    } catch {
      setActionError("No se pudo agregar la unidad. Verifique los datos e intente nuevamente.");
    } finally {
      setAgregarLoading(false);
    }
  }

  async function handleQuitar(accountID: string, deviceID: string) {
    const key = `${accountID}|${deviceID}`;
    setQuitarLoading(key);
    setActionError(null);

    try {
      await axios.put(api.habilitarSutran(accountID, deviceID, "0"));
      await fetchUnidades();
    } catch {
      setActionError("No se pudo quitar la unidad. Intente nuevamente.");
    } finally {
      setQuitarLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#F4F5F7" }}>
          Sutran
        </h1>
        <p style={{ color: "#8A9099", fontSize: 13, marginTop: 4 }}>
          Consulta de auditoría por cuenta y placa
        </p>
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
              placeholder="Ej: movilbus"
              value={cuenta}
              required
              submitAttempt={submitAttempt}
              onChange={(e) => setCuenta(e.target.value)}
            />
          </div>
          <div style={{ minWidth: 200 }}>
            <InputBase1
              label="Placa"
              placeholder="Ej: s129-m2l777"
              value={placa}
              required
              submitAttempt={submitAttempt}
              onChange={(e) => setPlaca(e.target.value)}
            />
          </div>
          <ButtonBase
            variant="primary"
            onClick={handleConsultar}
            disabled={loading}
          >
            <Search size={14} />
            {loading ? "Consultando..." : "Consultar"}
          </ButtonBase>
          <ButtonBase
            variant="secondary"
            onClick={handleAgregar}
            disabled={agregarLoading}
          >
            <Plus size={14} />
            {agregarLoading ? "Agregando..." : "Agregar"}
          </ButtonBase>
        </div>
      </div>

      {/* Error de acción (agregar / quitar) */}
      {actionError && (
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
          {actionError}
        </div>
      )}

      {/* Error de auditoría */}
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

      {/* Resultados de auditoría */}
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
                    <th style={HEADER}>Evento</th>
                    <th style={HEADER}>Velocidad</th>
                    <th style={HEADER}>Hora Dispositivo</th>
                    <th style={HEADER}>Código</th>
                    <th style={HEADER}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const envio = parseJSON<LastEnvio>(r.lastenvio);
                    const respuesta = parseJSON<LastRespuesta>(r.lastrespuesta);
                    const isOk = respuesta?.result === "OK";

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
                          {envio?.plate ?? "—"}
                        </td>
                        <td style={CELL}>
                          {envio?.event ? (
                            <Badge text={envio.event} ok={envio.event !== "ER"} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={CELL}>
                          {envio != null ? `${envio.speed} km/h` : "—"}
                        </td>
                        <td style={{ ...CELL, whiteSpace: "nowrap" }}>
                          {envio?.time_device ?? "—"}
                        </td>
                        <td style={CELL}>{respuesta?.code ?? "—"}</td>
                        <td style={CELL}>
                          {respuesta ? (
                            <Badge text={respuesta.result} ok={isOk} />
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

      {/* Unidades con Sutran habilitado */}
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
            Unidades con Sutran habilitado
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
            {loadingUnidades ? "..." : `${unidades.length} ${unidades.length === 1 ? "unidad" : "unidades"}`}
          </span>
        </div>

        {loadingUnidades ? (
          <div style={{ padding: 24, textAlign: "center", color: "#8A9099", fontSize: 13 }}>
            Cargando...
          </div>
        ) : unidades.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#8A9099", fontSize: 13 }}>
            No hay unidades con Sutran habilitado.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                  <th style={HEADER}>Cuenta</th>
                  <th style={HEADER}>Dispositivo</th>
                  <th style={{ ...HEADER, textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((u) => {
                  const key = `${u.accountID}|${u.deviceID}`;
                  const removing = quitarLoading === key;
                  return (
                    <tr
                      key={key}
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
                      <td style={{ ...CELL, color: "#F4F5F7", fontWeight: 500 }}>
                        {u.accountID}
                      </td>
                      <td style={CELL}>{u.deviceID}</td>
                      <td style={{ ...CELL, textAlign: "right" }}>
                        <ButtonBase
                          variant="danger"
                          onClick={() => handleQuitar(u.accountID, u.deviceID)}
                          disabled={removing || quitarLoading !== null}
                        >
                          <Trash2 size={13} />
                          {removing ? "Quitando..." : "Quitar"}
                        </ButtonBase>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
