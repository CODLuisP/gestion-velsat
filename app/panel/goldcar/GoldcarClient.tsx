"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, Plus, Trash2, X } from "lucide-react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import InputBase1 from "@/app/components/ui/InputBase1";
import { Role } from "@/app/constants/roles";
import { getGoldcarApi } from "@/app/services/goldcarApi";
import PanelHeader from "@/app/components/nav/PanelHeader";

type Props = {
  role: Role;
  actor?: string;
};

type DeviceGoldcar = {
  accountID: string;
  deviceID: string;
};

type LastEnvio = {
  avl: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: string;
  speed: number;
  course: string;
  satellites: string;
  extra: string;
};

type AuditoriaGoldcar = {
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
  fontSize: 13,
  color: "#CFCFD3",
  borderBottom: "1px solid #222327",
  verticalAlign: "middle",
  textAlign: "left",
};

const HEADER: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#FFFFFF",
  whiteSpace: "nowrap",
  textAlign: "left",
};

export default function GoldcarClient({ role, actor }: Props) {
  const [cuenta, setCuenta] = useState("");
  const [placa, setPlaca] = useState("");
  const [motivo, setMotivo] = useState("");
  const [registros, setRegistros] = useState<AuditoriaGoldcar[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempt, setSubmitAttempt] = useState(false);
  const motivoValido = (m: string) => m.trim().length >= 6;

  const [unidades, setUnidades] = useState<DeviceGoldcar[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [agregarLoading, setAgregarLoading] = useState(false);
  const [quitarLoading, setQuitarLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const api = getGoldcarApi(role);

  const fetchUnidades = useCallback(async () => {
    setLoadingUnidades(true);
    try {
      const res = await axios.get<DeviceGoldcar[]>(getGoldcarApi(role).getUnidadesGoldcar());
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
      const res = await axios.get<AuditoriaGoldcar[]>(
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
    if (!cuenta.trim() || !placa.trim() || !motivoValido(motivo)) return;

    setAgregarLoading(true);
    setActionError(null);

    try {
      await axios.put(api.habilitarGoldcar(cuenta.trim(), placa.trim(), "1", actor, motivo));
      await fetchUnidades();
    } catch {
      setActionError("No se pudo agregar la unidad. Verifique los datos e intente nuevamente.");
    } finally {
      setAgregarLoading(false);
    }
  }

  async function handleQuitar(accountID: string, deviceID: string) {
    const motivoQuitar = window.prompt("Motivo para quitar la unidad (mín. 6 caracteres):");
    if (motivoQuitar === null) return;
    if (!motivoValido(motivoQuitar)) {
      setActionError("El motivo es obligatorio y debe tener al menos 6 caracteres.");
      return;
    }

    const key = `${accountID}|${deviceID}`;
    setQuitarLoading(key);
    setActionError(null);

    try {
      await axios.put(api.habilitarGoldcar(accountID, deviceID, "0", actor, motivoQuitar));
      await fetchUnidades();
    } catch {
      setActionError("No se pudo quitar la unidad. Intente nuevamente.");
    } finally {
      setQuitarLoading(null);
    }
  }

  const termino = busqueda.trim().toLowerCase();
  const unidadesFiltradas = termino
    ? unidades.filter(
        (u) =>
          u.accountID.toLowerCase().includes(termino) ||
          u.deviceID.toLowerCase().includes(termino)
      )
    : unidades;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#121214]">
      {/* Header */}
      <PanelHeader
        title={
          <span>
            Integración <span className="text-[#F05A28]">Goldcar</span>
          </span>
        }
        subtitle="Consulta de auditoría y gestión de retransmisión por cuenta y placa"
        role={role}
      />

      <div className="flex-1 min-h-0 p-6 overflow-hidden flex flex-col gap-6 [&>*]:shrink-0">
        {/* Formulario */}
        <div className="bg-[#161719] border border-[#26272B] rounded-[12px] p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px] flex-1">
              <InputBase1
                label="Cuenta"
                placeholder="Ej: movilbus"
                value={cuenta}
                required
                submitAttempt={submitAttempt}
                onChange={(e) => setCuenta(e.target.value)}
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <InputBase1
                label="Placa"
                placeholder="Ej: s129-m2l777"
                value={placa}
                required
                submitAttempt={submitAttempt}
                onChange={(e) => setPlaca(e.target.value)}
              />
            </div>
            <div className="min-w-[240px] flex-1">
              <InputBase1
                label="Motivo (para Agregar)"
                placeholder="Explica por qué se habilita (mín. 6 caracteres)"
                value={motivo}
                required
                submitAttempt={submitAttempt}
                onChange={(e) => setMotivo(e.target.value)}
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
            background: "rgba(240,90,40,0.08)",
            border: "1px solid rgba(240,90,40,0.25)",
            borderRadius: 8,
            padding: "12px 16px",
            color: "#F05A28",
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
            background: "rgba(240,90,40,0.08)",
            border: "1px solid rgba(240,90,40,0.25)",
            borderRadius: 8,
            padding: "12px 16px",
            color: "#F05A28",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

        {/* Resultados de auditoría */}
        {registros !== null && (
          <div className="bg-[#161719] border border-[#26272B] rounded-[12px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#26272B] flex items-center justify-between">
              <span className="text-[#ECECEE] font-semibold text-[14px]">
                Últimos registros
              </span>
              <span className="text-xs text-[#9B9CA1] font-mono bg-[#1D1E21] px-2.5 py-1 rounded-[6px] border border-[#26272B]">
                {registros.length} {registros.length === 1 ? "registro" : "registros"}
              </span>
            </div>

            {registros.length === 0 ? (
              <div className="p-8 text-center text-[#9B9CA1] text-xs">
                Sin registros para esta consulta.
              </div>
            ) : (
              <div className="max-h-[40vh] overflow-auto velsat-scroll">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: "linear-gradient(90deg, #7A3A10 0%, #6A310D 100%)" }}>
                      <th style={HEADER}>#</th>
                      <th style={HEADER}>Cuenta</th>
                      <th style={HEADER}>Dispositivo</th>
                      <th style={HEADER}>Fecha Registro</th>
                      <th style={HEADER}>Latitud</th>
                      <th style={HEADER}>Longitud</th>
                      <th style={HEADER}>Velocidad</th>
                      <th style={HEADER}>Hora Enviada</th>
                      <th style={HEADER}>Respuesta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((r) => {
                      const envio = parseJSON<LastEnvio>(r.lastenvio);

                      return (
                        <tr
                          key={r.id}
                          className="border-b border-[#222327] hover:bg-[#1D1E21] transition-colors"
                        >
                          <td style={{ ...CELL, color: "#9B9CA1" }}>{r.id}</td>
                          <td style={{ ...CELL, color: "#ECECEE", fontWeight: 500 }}>
                            {r.accountID}
                          </td>
                          <td style={{ ...CELL, fontFamily: "var(--font-ibm-mono)" }}>{r.deviceID}</td>
                          <td style={{ ...CELL, whiteSpace: "nowrap", fontFamily: "var(--font-ibm-mono)" }}>
                            {formatDate(r.fecharegistro)}
                          </td>
                          <td style={{ ...CELL, fontFamily: "var(--font-ibm-mono)" }}>{envio?.latitude ?? "—"}</td>
                          <td style={{ ...CELL, fontFamily: "var(--font-ibm-mono)" }}>{envio?.longitude ?? "—"}</td>
                          <td style={{ ...CELL, fontFamily: "var(--font-ibm-mono)" }}>
                            {envio != null ? `${envio.speed} km/h` : "—"}
                          </td>
                          <td style={{ ...CELL, whiteSpace: "nowrap", fontFamily: "var(--font-ibm-mono)" }}>
                            {envio?.timestamp ?? "—"}
                          </td>
                          <td style={{ ...CELL, maxWidth: 260, whiteSpace: "normal", wordBreak: "break-word" }}>
                            {r.lastrespuesta || "—"}
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

        {/* Unidades con Goldcar habilitado */}
        <div className="bg-[#161719] border border-[#26272B] rounded-[12px] overflow-hidden flex flex-col flex-1 min-h-[260px] !shrink">
          <div className="px-5 py-3.5 border-b border-[#26272B] flex items-center justify-between">
            <span className="text-[#ECECEE] font-semibold text-[14px]">
              Unidades con Goldcar habilitado
            </span>
            <span className="text-xs text-[#9B9CA1] font-mono bg-[#1D1E21] px-2.5 py-1 rounded-[6px] border border-[#26272B]">
              {loadingUnidades ? "..." : `${unidadesFiltradas.length} ${unidadesFiltradas.length === 1 ? "unidad" : "unidades"}`}
            </span>
          </div>

          <div className="px-5 py-3 border-b border-[#26272B] bg-[#1D1E21]">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F05A28] pointer-events-none"
              />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en la lista por cuenta o dispositivo..."
                className="w-full h-10 pl-10 pr-10 rounded-full bg-[#121214] border border-[#F05A28]/40 text-[13px] text-[#ECECEE] placeholder:text-[#9B9CA1] outline-none focus:border-[#F05A28] transition-colors"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9CA1] hover:text-[#ECECEE]"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {loadingUnidades ? (
            <div className="p-8 text-center text-[#9B9CA1] text-xs">
              Cargando...
            </div>
          ) : unidadesFiltradas.length === 0 ? (
            <div className="p-8 text-center text-[#9B9CA1] text-xs">
              {unidades.length === 0
                ? "No hay unidades con Goldcar habilitado."
                : "Ninguna unidad coincide con la búsqueda."}
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto velsat-scroll">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: "linear-gradient(90deg, #7A3A10 0%, #6A310D 100%)" }}>
                    <th style={HEADER}>Cuenta</th>
                    <th style={HEADER}>Dispositivo</th>
                    <th style={{ ...HEADER, textAlign: "right" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {unidadesFiltradas.map((u) => {
                    const key = `${u.accountID}|${u.deviceID}`;
                    const removing = quitarLoading === key;
                    return (
                      <tr
                        key={key}
                        className="border-b border-[#222327] hover:bg-[#1D1E21] transition-colors"
                      >
                        <td style={{ ...CELL, color: "#ECECEE", fontWeight: 500 }}>
                          {u.accountID}
                        </td>
                        <td style={{ ...CELL, fontFamily: "var(--font-ibm-mono)" }}>{u.deviceID}</td>
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
    </div>
  );
}
