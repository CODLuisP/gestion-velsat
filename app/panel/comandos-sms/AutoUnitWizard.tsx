"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Smartphone,
  Server,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Send,
  Sparkles,
  AlertCircle,
  X,
  Radio,
  Car,
  ShieldCheck,
  Hash,
  ChevronDown,
  User,
  ExternalLink,
  Copy,
  Check,
  Signal,
  Wifi
} from "lucide-react";
import { Role } from "@/app/constants/roles";
import { getUnidadesApi } from "@/app/services/unidadesApi";
import { getUsuariosApi } from "@/app/services/usuariosApi";
import { Usuario } from "@/app/interfaces/usuario.interface";

export type GpsModel = "gt" | "tk" | "teltonika";

interface Props {
  role?: Role;
  actor?: string;
  onClose: () => void;
  onUnitCreated?: (placa: string) => void;
}

const MODEL_CONFIGS: Record<
  GpsModel,
  {
    name: string;
    badge: string;
    protocol: string;
    equipmentType: string;
    deviceCode: string;
    port: number;
    imeiCommand: string;
    imeiDesc: string;
    getApnCommand: (apn: string) => string;
    getConfigCommand: (ip: string, port: number) => string;
  }
> = {
  gt: {
    name: "GT06N / Concox",
    badge: "Concox",
    protocol: "Puerto 5023",
    equipmentType: "GT06N",
    deviceCode: "gt06n",
    port: 5023,
    imeiCommand: "PARAM#",
    imeiDesc: "Envia el comando PARAM# para consultar el IMEI y configuración",
    getApnCommand: (apn) => `APN,${apn}#`,
    getConfigCommand: (ip, port) => `SERVER,0,${ip},${port},0#`,
  },
  tk: {
    name: "TK103 / Coban",
    badge: "Coban",
    protocol: "Puerto 5001",
    equipmentType: "TK103",
    deviceCode: "tk103",
    port: 5001,
    imeiCommand: "imei123456",
    imeiDesc: "Envia el comando imei123456 para solicitar el IMEI al equipo",
    getApnCommand: (apn) => `apn123456 ${apn}`,
    getConfigCommand: (ip, port) => `adminip123456 ${ip} ${port}`,
  },
  teltonika: {
    name: "Teltonika (FMB / FMC)",
    badge: "Teltonika",
    protocol: "Puerto 5027",
    equipmentType: "Teltonika",
    deviceCode: "teltonika",
    port: 5027,
    imeiCommand: "getver",
    imeiDesc: "Envia getver para obtener firmware, versión e IMEI",
    getApnCommand: (apn) => `setparam 2001:${apn}`,
    getConfigCommand: (ip, port) => `setparam 2004:${ip};2005:${port};2006:0`,
  },
};

const APN_PRESETS = [
  { id: "movistar", name: "Movistar", apn: "movistar.pe" },
  { id: "claro", name: "Claro", apn: "claro.pe" },
  { id: "entel", name: "Entel", apn: "entel.pe" },
  { id: "bitel", name: "Bitel", apn: "bitel.pe" },
];

const TRACCAR_SERVERS = [
  {
    id: "linux1",
    name: "Servidor Linux 1 (DO)",
    ip: "164.92.70.28",
    host: "do.velsat.pe",
    url: "https://do.velsat.pe:2087",
    badge: "Linux 1 • do.velsat.pe",
  },
  {
    id: "linux2",
    name: "Servidor Linux 2 (SR)",
    ip: "165.227.9.191",
    host: "sr.velsat.pe",
    url: "https://sr.velsat.pe:2087",
    badge: "Linux 2 • sr.velsat.pe",
  },
];

function cleanPeruPhone(val: string): string {
  if (!val) return "";
  let digits = val.replace(/[^0-9]/g, "");
  if (digits.startsWith("519") && digits.length >= 4) {
    digits = digits.slice(2);
  } else if (digits.startsWith("51") && digits.length > 9) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 9);
}

function formatPeruPhone(digits: string): string {
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

export default function AutoUnitWizard({
  role = "Servidor_125",
  actor = "Sistema",
  onClose,
  onUnitCreated,
}: Props) {
  // Wizard Step: 1, 2, 3, 4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Model & Basic info
  const [selectedModel, setSelectedModel] = useState<GpsModel>("gt");
  const [placa, setPlaca] = useState("");
  const [simDigits, setSimDigits] = useState("");
  const [accountID, setAccountID] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [customAccountMode, setCustomAccountMode] = useState(false);

  // APN Mobile Operator state
  const [selectedApn, setSelectedApn] = useState("movistar.pe");
  const [customApn, setCustomApn] = useState("");
  const [isCustomApn, setIsCustomApn] = useState(false);

  // Accounts list
  const [accounts, setAccounts] = useState<Usuario[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Step 2: IMEI SMS query
  const [imei, setImei] = useState("");
  const [isDetectedFromSms, setIsDetectedFromSms] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isWaitingSms, setIsWaitingSms] = useState(false);
  const [waitingElapsed, setWaitingElapsed] = useState(0);
  const [rawSmsReply, setRawSmsReply] = useState<string | null>(null);
  const sentSmsTimestamp = useRef<number>(0);

  // Step 3: Traccar Server
  const [selectedServerId, setSelectedServerId] = useState<"linux1" | "linux2">("linux1");

  // Step 4: Execution Pipeline
  const [isExecuting, setIsExecuting] = useState(false);
  const [pipelineState, setPipelineState] = useState({
    traccar: { status: "pending", message: "" } as { status: "pending" | "loading" | "success" | "error"; message?: string },
    unidades: { status: "pending", message: "" } as { status: "pending" | "loading" | "success" | "error"; message?: string },
    smsApn: { status: "pending", message: "" } as { status: "pending" | "loading" | "success" | "error"; message?: string },
    smsConfig: { status: "pending", message: "" } as { status: "pending" | "loading" | "success" | "error"; message?: string },
  });
  const [executionDone, setExecutionDone] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Effective APN and resulting commands
  const effectiveApn = isCustomApn ? customApn.trim() : selectedApn;

  // Load Accounts from API
  useEffect(() => {
    let isMounted = true;
    const loadAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        const api = getUsuariosApi(role);
        const res = await axios.get<Usuario[]>(api.list);
        if (isMounted && Array.isArray(res.data)) {
          setAccounts(res.data);
        }
      } catch (err) {
        console.error("Error al cargar lista de usuarios:", err);
      } finally {
        if (isMounted) setIsLoadingAccounts(false);
      }
    };
    loadAccounts();
    return () => {
      isMounted = false;
    };
  }, [role]);

  // Click outside listener for accounts dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setShowAccountDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return accounts.slice(0, 15);
    return accounts
      .filter(
        (a) =>
          a.accountID?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.ruc?.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [accounts, accountSearch]);

  // Model Specs
  const currentModelSpec = MODEL_CONFIGS[selectedModel];
  const currentServer = TRACCAR_SERVERS.find((s) => s.id === selectedServerId) || TRACCAR_SERVERS[0];
  const resultingApnCommand = currentModelSpec.getApnCommand(effectiveApn || "movistar.pe");
  const resultingConfigCommand = currentModelSpec.getConfigCommand(currentServer.ip, currentModelSpec.port);

  const isWithin12Hours = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return !isNaN(t) && Date.now() - t < 12 * 60 * 60 * 1000;
  };

  // Step 2: Poll for incoming SMS while waiting
  useEffect(() => {
    if (!isWaitingSms) return;

    const timer = setInterval(() => {
      setWaitingElapsed((prev) => prev + 1);
    }, 1000);

    const poller = setInterval(async () => {
      try {
        // "light=1": sondeo del historial sin consultar a sms-gate.app.
        // /api/send-sms ya devuelve los mismos SMS recibidos que /api/gps-webhook.
        const [sendRes] = await Promise.allSettled([axios.get("/api/send-sms?light=1")]);

        const incoming: any[] = [];
        const history: any[] = [];

        if (sendRes.status === "fulfilled" && sendRes.value.data) {
          if (Array.isArray(sendRes.value.data.incoming)) incoming.push(...sendRes.value.data.incoming);
          if (Array.isArray(sendRes.value.data.history)) history.push(...sendRes.value.data.history);
        }

        if (typeof window !== "undefined") {
          try {
            const rawInc = localStorage.getItem("velsat_sms_incoming");
            if (rawInc) {
              const parsed = JSON.parse(rawInc);
              if (Array.isArray(parsed)) incoming.push(...parsed);
            }
          } catch (e) {}
        }

        const checkMessages = [
          ...incoming,
          ...history.map((h: any) => h.response).filter(Boolean),
        ];

        for (const item of checkMessages) {
          const sender = (item.sender || item.phoneNumber || "").replace(/[^0-9]/g, "");
          const target = simDigits.replace(/[^0-9]/g, "");

          if (sender.endsWith(target) || target.endsWith(sender.slice(-9))) {
            const msg = item.message || "";
            // Look for 15-digit IMEI
            const match15 = msg.match(/\b(\d{15})\b/);
            const matchGeneral = msg.match(/imei[:\s=]*(\d{14,16})/i);
            const foundImei = match15 ? match15[1] : matchGeneral ? matchGeneral[1] : null;

            if (foundImei) {
              setImei(foundImei);
              setIsDetectedFromSms(true);
              setRawSmsReply(msg);
              setIsWaitingSms(false);
              toast.success(`¡IMEI ${foundImei} detectado con éxito!`, {
                icon: "🎉",
                duration: 5000,
              });
              break;
            } else if (msg.length > 5 && !rawSmsReply) {
              // Received something from GPS, record it
              setRawSmsReply(msg);
            }
          }
        }
      } catch (err) {
        console.error("Error al sondear respuesta SMS:", err);
      }
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [isWaitingSms, simDigits, rawSmsReply]);

  // Handler: Send IMEI SMS
  const handleSendImeiSms = async () => {
    if (!simDigits || simDigits.length !== 9) {
      toast.error("Ingresa un número de celular válido de 9 dígitos.");
      return;
    }

    setIsSendingSms(true);
    setWaitingElapsed(0);
    setRawSmsReply(null);

    try {
      const payload = {
        phoneNumber: `+51${simDigits}`,
        message: currentModelSpec.imeiCommand,
        placa: placa.trim(),
        model: selectedModel,
      };

      const res = await axios.post("/api/send-sms", payload);
      if (res.data?.success) {
        toast.success(`Comando ${currentModelSpec.imeiCommand} enviado a +51 ${simDigits}`);
        if (res.data?.record && typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("velsat_sms_history");
            const prev = raw ? JSON.parse(raw) : [];
            const updated = [res.data.record, ...prev.filter((r: any) => r.id !== res.data.record.id && isWithin12Hours(r?.sentAt))];
            localStorage.setItem("velsat_sms_history", JSON.stringify(updated.slice(0, 100)));
          } catch (e) {}
        }
        sentSmsTimestamp.current = Date.now();
        setIsWaitingSms(true);
      } else {
        toast.error(res.data?.error || "No se pudo enviar el SMS al Gateway");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al conectar con SMS Gateway");
    } finally {
      setIsSendingSms(false);
    }
  };

  // Execution: 1-Click Pipeline
  const handleRunPipeline = async () => {
    if (!placa.trim()) {
      toast.error("La placa es requerida.");
      setStep(1);
      return;
    }
    if (!imei.trim()) {
      toast.error("El IMEI es requerido.");
      setStep(2);
      return;
    }
    if (!accountID.trim()) {
      toast.error("El Account ID / Usuario es requerido.");
      setStep(1);
      return;
    }

    setIsExecuting(true);
    setExecutionDone(false);

    const formattedPlaca = placa.trim();
    const cleanPhone = simDigits.trim();
    const cleanImei = imei.trim();
    const cleanAccount = accountID.trim();

    // Step 4.1: Register in Traccar
    setPipelineState({
      traccar: { status: "loading", message: `Conectando con ${currentServer.name}...` },
      unidades: { status: "pending", message: "" },
      smsApn: { status: "pending", message: "" },
      smsConfig: { status: "pending", message: "" },
    });

    let traccarSuccess = false;
    try {
      const traccarPayload = {
        serverUrl: currentServer.url,
        device: {
          name: formattedPlaca,
          uniqueId: cleanImei,
          phone: `+51${cleanPhone}`,
          model: currentModelSpec.equipmentType,
          category: "car",
          groupId: 0,
          attributes: {
            deviceID: formattedPlaca,
            accountID: cleanAccount,
          },
        },
      };

      const traccarRes = await axios.post("/api/traccar/devices", traccarPayload);
      if (traccarRes.data?.success) {
        traccarSuccess = true;
        setPipelineState((prev) => ({
          ...prev,
          traccar: {
            status: "success",
            message: `Dispositivo registrado en Traccar (${currentServer.host})`,
          },
        }));
      } else {
        throw new Error(traccarRes.data?.error || "Error desconocido en Traccar");
      }
    } catch (err: any) {
      console.error("Traccar error:", err);
      const errMsg = err.response?.data?.error || err.message || "Error al registrar en Traccar";
      setPipelineState((prev) => ({
        ...prev,
        traccar: { status: "error", message: errMsg },
      }));
    }

    // Step 4.2: Register in Unidades Velsat
    setPipelineState((prev) => ({
      ...prev,
      unidades: { status: "loading", message: "Registrando unidad en base de datos Velsat..." },
    }));

    let unidadesSuccess = false;
    try {
      const unidadesApi = getUnidadesApi(role);
      const insertUrl = unidadesApi.insert(actor, "Alta automática vía Asistente SMS");
      const unidadesPayload = {
        deviceID: formattedPlaca,
        accountID: cleanAccount,
        equipmentType: currentModelSpec.equipmentType,
        uniqueID: cleanImei,
        deviceCode: currentModelSpec.deviceCode,
        simPhoneNumber: cleanPhone,
        imeiNumber: cleanImei,
      };

      await axios.post(insertUrl, unidadesPayload);
      unidadesSuccess = true;
      setPipelineState((prev) => ({
        ...prev,
        unidades: {
          status: "success",
          message: "Unidad creada exitosamente en el sistema Velsat",
        },
      }));
    } catch (err: any) {
      console.error("Unidades error:", err);
      const errMsg = err.response?.data?.message || err.message || "Error al registrar en Unidades";
      setPipelineState((prev) => ({
        ...prev,
        unidades: { status: "error", message: errMsg },
      }));
    }

    // Step 4.3: Send APN Configuration SMS
    setPipelineState((prev) => ({
      ...prev,
      smsApn: { status: "loading", message: `Configurando APN móvil (${effectiveApn}): ${resultingApnCommand}` },
    }));

    let apnSuccess = false;
    try {
      const apnPayload = {
        phoneNumber: `+51${cleanPhone}`,
        message: resultingApnCommand,
        placa: formattedPlaca,
        model: selectedModel,
      };

      const apnRes = await axios.post("/api/send-sms", apnPayload);
      if (apnRes.data?.success) {
        apnSuccess = true;
        if (apnRes.data?.record && typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("velsat_sms_history");
            const prev = raw ? JSON.parse(raw) : [];
            const updated = [apnRes.data.record, ...prev.filter((r: any) => r.id !== apnRes.data.record.id && isWithin12Hours(r?.sentAt))];
            localStorage.setItem("velsat_sms_history", JSON.stringify(updated.slice(0, 100)));
          } catch (e) {}
        }
        setPipelineState((prev) => ({
          ...prev,
          smsApn: {
            status: "success",
            message: `APN '${resultingApnCommand}' enviado al chip +51 ${cleanPhone}`,
          },
        }));
      } else {
        throw new Error(apnRes.data?.error || "Fallo al enviar SMS de APN");
      }
    } catch (err: any) {
      console.error("SMS APN error:", err);
      const errMsg = err.response?.data?.error || err.message || "Error al enviar SMS de APN";
      setPipelineState((prev) => ({
        ...prev,
        smsApn: { status: "error", message: errMsg },
      }));
    }

    // Pausa de 1.8 segundos entre SMS para permitir procesamiento del módem
    await new Promise((r) => setTimeout(r, 1800));

    // Step 4.4: Send Server Configuration SMS
    setPipelineState((prev) => ({
      ...prev,
      smsConfig: { status: "loading", message: `Enviando comando de configuración: ${resultingConfigCommand}` },
    }));

    let smsSuccess = false;
    try {
      const smsPayload = {
        phoneNumber: `+51${cleanPhone}`,
        message: resultingConfigCommand,
        placa: formattedPlaca,
        model: selectedModel,
      };

      const smsRes = await axios.post("/api/send-sms", smsPayload);
      if (smsRes.data?.success) {
        smsSuccess = true;
        if (smsRes.data?.record && typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("velsat_sms_history");
            const prev = raw ? JSON.parse(raw) : [];
            const updated = [smsRes.data.record, ...prev.filter((r: any) => r.id !== smsRes.data.record.id && isWithin12Hours(r?.sentAt))];
            localStorage.setItem("velsat_sms_history", JSON.stringify(updated.slice(0, 100)));
          } catch (e) {}
        }
        setPipelineState((prev) => ({
          ...prev,
          smsConfig: {
            status: "success",
            message: `Comando '${resultingConfigCommand}' enviado al chip +51 ${cleanPhone}`,
          },
        }));
      } else {
        throw new Error(smsRes.data?.error || "Fallo al enviar SMS de configuración");
      }
    } catch (err: any) {
      console.error("SMS Config error:", err);
      const errMsg = err.response?.data?.error || err.message || "Error al enviar SMS de configuración";
      setPipelineState((prev) => ({
        ...prev,
        smsConfig: { status: "error", message: errMsg },
      }));
    }

    setIsExecuting(false);
    setExecutionDone(true);

    if (traccarSuccess && unidadesSuccess && apnSuccess && smsSuccess) {
      toast.success("¡Unidad dada de alta y configurada exitosamente!", {
        icon: "🚀",
        duration: 6000,
      });
      if (onUnitCreated) onUnitCreated(formattedPlaca);
    } else {
      toast.error("El proceso se completó con observaciones. Revisa el estado de cada paso.");
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResetWizard = () => {
    setStep(1);
    setPlaca("");
    setSimDigits("");
    setSelectedApn("movistar.pe");
    setCustomApn("");
    setIsCustomApn(false);
    setAccountID("");
    setAccountSearch("");
    setImei("");
    setIsDetectedFromSms(false);
    setRawSmsReply(null);
    setIsWaitingSms(false);
    setExecutionDone(false);
    setPipelineState({
      traccar: { status: "pending", message: "" },
      unidades: { status: "pending", message: "" },
      smsApn: { status: "pending", message: "" },
      smsConfig: { status: "pending", message: "" },
    });
  };

  return (
    <div
      className="w-full max-w-4xl mx-auto my-3 text-[#ECECEE] bg-[#161719] border border-[#26272B] rounded-[12px] overflow-hidden"
    >
      {/* Top Banner Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#18191C] border-b border-[#26272B]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[7px] bg-[#1A1210] border border-[#5A2A18] flex items-center justify-center text-[#F05A28]">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-[#ECECEE] tracking-tight leading-none">
                Asistente de Alta Automática de Unidades
              </h2>
              <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[#1C1714] text-[#F05A28] border border-[#8A3A1C] uppercase tracking-wide">
                1-Click Wizard
              </span>
            </div>
            <p className="text-[11px] text-[#9B9CA1] mt-0.5">
              Consulta IMEI por SMS, registra en Traccar y Unidades, y apunta el servidor sin errores.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#CFCFD3] hover:text-[#ECECEE] bg-[#121214] hover:bg-[#1D1E21] transition-colors border border-[#2D2E32] cursor-pointer"
        >
          <X size={14} />
          <span>Volver al Modo Manual</span>
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="px-6 py-3 bg-[#121214] border-b border-[#222327]">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1, label: "Vehículo & Chip", icon: Car },
            { num: 2, label: "Consulta IMEI", icon: Radio },
            { num: 3, label: "Servidor Traccar", icon: Server },
            { num: 4, label: "Alta & Configuración", icon: ShieldCheck },
          ].map((s, idx, arr) => {
            const isDone = step > s.num || (executionDone && step === 4);
            const isCurrent = step === s.num;
            const Icon = s.icon;

            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => {
                    if (s.num < step && !isExecuting) setStep(s.num as any);
                  }}
                  className={`flex items-center gap-2.5 cursor-pointer select-none transition-all ${
                    isCurrent
                      ? "text-[#F05A28]"
                      : isDone
                      ? "text-emerald-400 hover:text-emerald-300"
                      : "text-[#76777C]"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : isCurrent
                        ? "bg-[#F05A28] text-white"
                        : "bg-[#161719] text-[#76777C] border border-[#26272B]"
                    }`}
                  >
                    {isDone ? <Check size={14} strokeWidth={3} /> : s.num}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-[11px] font-bold leading-tight flex items-center gap-1">
                      {s.label}
                    </div>
                    <div className="text-[9px] text-[#76777C] font-medium">
                      {isDone ? "Completado" : isCurrent ? "En progreso" : "Pendiente"}
                    </div>
                  </div>
                </div>

                {idx < arr.length - 1 && (
                  <div
                    className={`flex-1 mx-3 h-[2px] rounded transition-all ${
                      step > s.num ? "bg-emerald-500/40" : "bg-[#26272B]"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <div className="p-6">
        {/* ========================================================================= */}
        {/* STEP 1: VEHICULO, MODELO & CHIP                                           */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-[#9B9CA1] mb-2 uppercase tracking-wider">
                1. Selecciona el Modelo de GPS Instalado
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["gt", "tk", "teltonika"] as GpsModel[]).map((mKey) => {
                  const m = MODEL_CONFIGS[mKey];
                  const isSel = selectedModel === mKey;
                  return (
                    <div
                      key={mKey}
                      onClick={() => setSelectedModel(mKey)}
                      className={`p-3.5 rounded-[8px] border cursor-pointer transition-all ${
                        isSel
                          ? "bg-[#1C1714] border-[#8A3A1C]"
                          : "bg-[#121214] border-[#26272B] hover:border-[#3A3B40] hover:bg-[#1D1E21]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isSel
                              ? "bg-[#F05A28] text-white"
                              : "bg-[#161719] border border-[#26272B] text-[#9B9CA1]"
                          }`}
                        >
                          {m.badge}
                        </span>
                        <span className="text-[10px] text-[#9B9CA1] font-mono">
                          {m.protocol}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#ECECEE] mb-0.5">{m.name}</div>
                      <div className="text-[10px] text-[#9B9CA1] line-clamp-1">{m.imeiDesc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Placa Input */}
              <div>
                <label className="block text-xs font-semibold text-[#CFCFD3] mb-1.5 flex items-center justify-between">
                  <span>Placa del Vehículo</span>
                  <span className="text-[10px] text-[#76777C] font-normal">Identificador único</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#76777C]">
                    <Car size={15} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. ABC-123"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    className="w-full bg-[#121214] border border-[#2D2E32] rounded-[8px] pl-9 pr-3 py-2 text-sm text-[#ECECEE] font-mono placeholder:text-[#76777C] focus:outline-none focus:border-[#F05A28] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-[#76777C] mt-1">
                  Se asignará automáticamente como <code className="text-[#9B9CA1]">deviceID</code> y nombre en Traccar.
                </p>
              </div>

              {/* SIM Phone Input */}
              <div>
                <label className="block text-xs font-semibold text-[#CFCFD3] mb-1.5 flex items-center justify-between">
                  <span>Número de Chip (SIM GPS)</span>
                  <span className="text-[10px] text-[#76777C] font-normal">9 dígitos Perú</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-2.5 rounded-l-[8px] border border-r-0 border-[#2D2E32] bg-[#161719] text-[#9B9CA1] text-xs font-mono select-none">
                    🇵🇪 +51
                  </span>
                  <input
                    type="tel"
                    placeholder="912 345 678"
                    value={formatPeruPhone(simDigits)}
                    onChange={(e) => setSimDigits(cleanPeruPhone(e.target.value))}
                    maxLength={11}
                    className="w-full bg-[#121214] border border-[#2D2E32] rounded-r-[8px] px-3 py-2 text-sm text-[#ECECEE] font-mono placeholder:text-[#76777C] focus:outline-none focus:border-[#F05A28] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-[#76777C] mt-1">
                  A este número se enviarán los comandos de consulta y configuración.
                </p>
              </div>
            </div>

            {/* Operador Móvil / APN Selector */}
            <div className="p-3.5 rounded-[8px] bg-[#121214] border border-[#26272B] space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-semibold text-[#CFCFD3] flex items-center gap-1.5">
                  <Signal size={13} className="text-[#F05A28]" />
                  <span>Operador Móvil / APN de Internet del Chip</span>
                </label>
                <div className="flex items-center gap-1 text-[10px] text-[#9B9CA1] font-mono bg-[#161719] px-2 py-0.5 rounded border border-[#26272B]">
                  <span className="text-[#76777C]">Comando:</span>
                  <span className="text-amber-400 font-bold">{resultingApnCommand}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {APN_PRESETS.map((preset) => {
                  const isSel = !isCustomApn && selectedApn === preset.apn;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedApn(preset.apn);
                        setIsCustomApn(false);
                      }}
                      className={`px-3 py-2 rounded-[8px] border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSel
                          ? "bg-[#1C1714] border-[#8A3A1C] text-[#F05A28]"
                          : "bg-[#161719] border-[#26272B] text-[#9B9CA1] hover:text-[#ECECEE] hover:border-[#3A3B40]"
                      }`}
                    >
                      <span className="text-[11px]">{preset.name}</span>
                      <span className="text-[9px] font-mono text-[#76777C] font-normal">
                        {preset.apn}
                      </span>
                    </button>
                  );
                })}

                {/* Otro / Personalizado */}
                <button
                  type="button"
                  onClick={() => setIsCustomApn(true)}
                  className={`px-3 py-2 rounded-[8px] border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isCustomApn
                      ? "bg-[#1C1714] border-[#8A3A1C] text-[#F05A28]"
                      : "bg-[#161719] border-[#26272B] text-[#9B9CA1] hover:text-[#ECECEE] hover:border-[#3A3B40]"
                  }`}
                >
                  <span className="text-[11px]">Otro APN</span>
                  <span className="text-[9px] font-mono text-[#76777C] font-normal">
                    Personalizado
                  </span>
                </button>
              </div>

              {isCustomApn && (
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Escribe el APN (ej. m2m.movistar.pe)..."
                    value={customApn}
                    onChange={(e) => setCustomApn(e.target.value)}
                    className="w-full bg-[#161719] border border-[#2D2E32] rounded-[8px] px-3 py-1.5 text-xs text-[#ECECEE] font-mono placeholder:text-[#76777C] focus:outline-none focus:border-[#F05A28]"
                  />
                </div>
              )}

              <p className="text-[10px] text-[#76777C]">
                Se enviará este comando por SMS durante el alta para que el chip active datos móviles GPRS y reporte a Traccar.
              </p>
            </div>

            {/* Account / Usuario Selector */}
            <div ref={accountRef} className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#CFCFD3] flex items-center gap-1.5">
                  <User size={13} className="text-[#F05A28]" />
                  <span>Usuario / Cliente Propietario (accountID)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCustomAccountMode(!customAccountMode);
                    setShowAccountDropdown(false);
                  }}
                  className="text-[11px] text-[#F05A28] hover:underline cursor-pointer"
                >
                  {customAccountMode ? "Seleccionar de la lista de usuarios" : "Escribir cuenta manualmente"}
                </button>
              </div>

              {customAccountMode ? (
                <input
                  type="text"
                  placeholder="Ingresa el accountID del cliente..."
                  value={accountID}
                  onChange={(e) => setAccountID(e.target.value)}
                  className="w-full bg-[#121214] border border-[#2D2E32] rounded-[8px] px-3 py-2 text-sm text-[#ECECEE] placeholder:text-[#76777C] focus:outline-none focus:border-[#F05A28]"
                />
              ) : (
                <div className="relative">
                  <div
                    onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                    className="w-full bg-[#121214] border border-[#2D2E32] rounded-[8px] px-3 py-2 text-sm text-[#ECECEE] flex items-center justify-between cursor-pointer hover:border-[#3A3B40] transition-colors"
                  >
                    <span className={accountID ? "text-[#ECECEE] font-medium" : "text-[#76777C]"}>
                      {accountID
                        ? accounts.find((a) => a.accountID === accountID)
                          ? `${accountID} • ${accounts.find((a) => a.accountID === accountID)?.description || ""}`
                          : accountID
                        : isLoadingAccounts
                        ? "Cargando usuarios..."
                        : "Seleccionar usuario / cliente..."}
                    </span>
                    <ChevronDown size={15} className="text-[#76777C]" />
                  </div>

                  {showAccountDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-[#161719] border border-[#26272B] rounded-[8px] shadow-2xl overflow-hidden max-h-56 flex flex-col">
                      <div className="p-2 border-b border-[#222327] bg-[#121214]">
                        <input
                          type="text"
                          placeholder="Buscar usuario por nombre o RUC..."
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                          className="w-full bg-[#161719] border border-[#2D2E32] rounded-[6px] px-2.5 py-1 text-xs text-[#ECECEE] placeholder:text-[#76777C] focus:outline-none focus:border-[#F05A28]"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto divide-y divide-[#222327]">
                        {filteredAccounts.length === 0 ? (
                          <div className="p-3 text-center text-xs text-[#76777C]">
                            No se encontraron usuarios
                          </div>
                        ) : (
                          filteredAccounts.map((a) => (
                            <div
                              key={a.accountID}
                              onClick={() => {
                                setAccountID(a.accountID);
                                setShowAccountDropdown(false);
                              }}
                              className="px-3 py-2 hover:bg-[#1C1714] hover:text-[#F05A28] cursor-pointer flex items-center justify-between text-xs transition-colors"
                            >
                              <div>
                                <span className="font-bold text-[#ECECEE]">{a.accountID}</span>
                                {a.description && (
                                  <span className="text-[#9B9CA1] ml-2">({a.description})</span>
                                )}
                              </div>
                              {a.ruc && (
                                <span className="text-[10px] text-[#76777C] font-mono">
                                  RUC: {a.ruc}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#222327]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-[8px] text-xs font-medium text-[#CFCFD3] hover:text-[#ECECEE] bg-[#121214] hover:bg-[#1D1E21] border border-[#2D2E32] transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!placa.trim() || simDigits.length !== 9 || !accountID.trim()}
                onClick={() => setStep(2)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-xs font-bold transition-all ${
                  placa.trim() && simDigits.length === 9 && accountID.trim()
                    ? "bg-[#F05A28] text-white hover:bg-[#FF6A35] cursor-pointer"
                    : "bg-[#121214] text-[#76777C] border border-[#26272B] cursor-not-allowed"
                }`}
              >
                <span>Siguiente: Consultar IMEI</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: OBTENCION DE IMEI POR SMS                                         */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-[8px] bg-[#121214] border border-[#26272B] flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-[7px] bg-[#1A1210] border border-[#5A2A18] flex items-center justify-center text-[#F05A28] shrink-0 mt-0.5">
                <Radio size={18} />
              </div>
              <div className="flex-1 text-xs">
                <div className="font-bold text-[#ECECEE] text-sm mb-1">
                  Consulta de IMEI Automática vía SMS
                </div>
                <p className="text-[#9B9CA1] leading-relaxed mb-2">
                  Enviaremos un SMS al número{" "}
                  <strong className="text-[#ECECEE] font-mono">+51 {formatPeruPhone(simDigits)}</strong>{" "}
                  con el comando oficial de lectura para el modelo{" "}
                  <strong className="text-[#F05A28]">{currentModelSpec.name}</strong>:
                </p>

                <div className="flex items-center gap-2 p-2 rounded-[8px] bg-[#161719] border border-[#26272B] font-mono text-xs text-amber-400">
                  <Send size={13} className="text-[#76777C]" />
                  <span>{currentModelSpec.imeiCommand}</span>
                  <span className="text-[#76777C] text-[10px] ml-auto">
                    {currentModelSpec.imeiDesc}
                  </span>
                </div>
              </div>
            </div>

            {/* Waiting State or Action Box */}
            <div className="p-4 rounded-[8px] bg-[#121214] border border-[#26272B]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#CFCFD3] mb-0.5">
                    {isDetectedFromSms ? "IMEI recibido y validado" : "¿Listo para enviar la consulta?"}
                  </div>
                  <div className="text-[11px] text-[#76777C]">
                    {isWaitingSms
                      ? `Esperando respuesta del GPS... (${waitingElapsed}s transcurridos)`
                      : isDetectedFromSms
                      ? "El GPS respondió con éxito y extrajimos los 15 dígitos."
                      : "Presiona el botón para disparar el SMS a través del celular Gateway."}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isWaitingSms ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Esperando SMS...</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsWaitingSms(false)}
                        className="px-3 py-2 rounded-[8px] bg-[#161719] hover:bg-[#1D1E21] border border-[#2D2E32] text-[#76777C] hover:text-[#ECECEE] text-xs transition-colors cursor-pointer"
                      >
                        Cancelar espera
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSendingSms}
                      onClick={handleSendImeiSms}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#F05A28] hover:bg-[#FF6A35] text-white text-xs font-bold cursor-pointer transition-all"
                    >
                      {isSendingSms ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>{isDetectedFromSms ? "Reenviar SMS de Consulta" : "Consultar IMEI por SMS"}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Raw SMS Reply Viewer if any */}
              {rawSmsReply && (
                <div className="mt-3 pt-3 border-t border-[#222327] text-xs">
                  <span className="text-[10px] text-[#76777C] font-semibold uppercase tracking-wider block mb-1">
                    Último mensaje recibido del GPS:
                  </span>
                  <div className="p-2 rounded-[8px] bg-[#161719] border border-[#26272B] font-mono text-[11px] text-emerald-400 break-all">
                    {rawSmsReply}
                  </div>
                </div>
              )}
            </div>

            {/* Editable IMEI Field */}
            <div className="p-4 rounded-[8px] bg-[#121214] border border-[#26272B]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#CFCFD3] flex items-center gap-2">
                  <Hash size={14} className="text-[#F05A28]" />
                  <span>IMEI del Dispositivo GPS (15 dígitos)</span>
                </label>
                {isDetectedFromSms && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    Detectado automáticamente por SMS
                  </span>
                )}
              </div>

              <input
                type="text"
                placeholder="Ej. 864501041234567"
                value={imei}
                onChange={(e) => {
                  setImei(e.target.value.replace(/[^0-9]/g, "").slice(0, 16));
                  setIsDetectedFromSms(false);
                }}
                maxLength={16}
                className="w-full bg-[#161719] border border-[#2D2E32] rounded-[8px] px-3.5 py-2.5 text-base text-[#ECECEE] font-mono placeholder:text-[#76777C] focus:outline-none focus:border-[#F05A28] transition-colors"
              />
              <p className="text-[10px] text-[#76777C] mt-1.5 flex items-center justify-between">
                <span>
                  El IMEI debe tener 15 dígitos numéricos. Puedes editarlo libremente si prefieres ingresarlo a mano.
                </span>
                <span className={`font-mono font-bold ${imei.length === 15 ? "text-emerald-400" : "text-amber-400"}`}>
                  {imei.length} / 15 dígitos
                </span>
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#222327]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-medium text-[#CFCFD3] hover:text-[#ECECEE] bg-[#121214] hover:bg-[#1D1E21] border border-[#2D2E32] transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Atrás</span>
              </button>

              <button
                type="button"
                disabled={imei.length < 14}
                onClick={() => setStep(3)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-xs font-bold transition-all ${
                  imei.length >= 14
                    ? "bg-[#F05A28] text-white hover:bg-[#FF6A35] cursor-pointer"
                    : "bg-[#121214] text-[#76777C] border border-[#26272B] cursor-not-allowed"
                }`}
              >
                <span>Siguiente: Servidor Traccar</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: ELECCION DE SERVIDOR TRACCAR                                      */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-[#9B9CA1] mb-2 uppercase tracking-wider">
                3. Selecciona el Servidor Traccar de Destino
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRACCAR_SERVERS.map((srv) => {
                  const isSel = selectedServerId === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedServerId(srv.id as any)}
                      className={`p-4 rounded-[8px] border cursor-pointer transition-all ${
                        isSel
                          ? "bg-[#1C1714] border-[#8A3A1C]"
                          : "bg-[#121214] border-[#26272B] hover:border-[#3A3B40] hover:bg-[#1D1E21]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isSel ? "bg-[#F05A28] text-white" : "bg-[#161719] border border-[#26272B] text-[#9B9CA1]"
                          }`}
                        >
                          {srv.badge}
                        </span>
                        <Server size={15} className={isSel ? "text-[#F05A28]" : "text-[#76777C]"} />
                      </div>

                      <div className="text-sm font-bold text-[#ECECEE] mb-1">{srv.name}</div>
                      <div className="text-xs text-[#9B9CA1] font-mono space-y-0.5">
                        <div>
                          IP Reporte: <span className="text-amber-400">{srv.ip}</span>
                        </div>
                        <div>
                          Puerto {currentModelSpec.name}:{" "}
                          <span className="text-emerald-400 font-bold">{currentModelSpec.port}</span>
                        </div>
                        <div className="text-[10px] text-[#76777C]">{srv.url}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="p-4 rounded-[8px] bg-[#121214] border border-[#26272B]">
              <div className="text-xs font-bold text-[#ECECEE] mb-3 flex items-center justify-between">
                <span>Resumen de la Configuración a Ejecutar</span>
                <span className="text-[10px] text-[#76777C] font-normal">
                  Listo para dar de alta en 1 click
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-[6px] bg-[#161719] border border-[#26272B]">
                  <span className="text-[10px] text-[#76777C] block uppercase">Placa / DeviceID</span>
                  <span className="font-mono font-bold text-[#ECECEE]">{placa}</span>
                </div>

                <div className="p-2.5 rounded-[6px] bg-[#161719] border border-[#26272B]">
                  <span className="text-[10px] text-[#76777C] block uppercase">IMEI / UniqueID</span>
                  <span className="font-mono font-bold text-[#ECECEE]">{imei}</span>
                </div>

                <div className="p-2.5 rounded-[6px] bg-[#161719] border border-[#26272B]">
                  <span className="text-[10px] text-[#76777C] block uppercase">Número Chip SIM</span>
                  <span className="font-mono font-bold text-[#ECECEE]">+51 {formatPeruPhone(simDigits)}</span>
                </div>

                <div className="p-2.5 rounded-[6px] bg-[#161719] border border-[#26272B]">
                  <span className="text-[10px] text-[#76777C] block uppercase">Usuario (AccountID)</span>
                  <span className="font-bold text-[#F05A28] truncate block">{accountID}</span>
                </div>

                <div className="p-2.5 rounded-[6px] bg-[#161719] border border-[#26272B]">
                  <span className="text-[10px] text-[#76777C] block uppercase">Modelo & Puerto</span>
                  <span className="font-medium text-[#ECECEE]">
                    {currentModelSpec.name} ({currentModelSpec.port})
                  </span>
                </div>

                <div className="p-2.5 rounded-[6px] bg-[#161719] border border-[#26272B]">
                  <span className="text-[10px] text-[#76777C] block uppercase">Servidor Destino</span>
                  <span className="font-medium text-emerald-400">{currentServer.name}</span>
                </div>
              </div>

              {/* Resulting SMS Previews (APN + Server) */}
              <div className="mt-3 pt-3 border-t border-[#222327] space-y-2">
                <div>
                  <span className="text-[10px] text-[#76777C] block mb-1 uppercase font-semibold flex items-center justify-between">
                    <span>1. Comando SMS de APN Móvil (Internet):</span>
                    <span className="text-[#9B9CA1] font-mono text-[9px]">{effectiveApn}</span>
                  </span>
                  <div className="p-2 rounded-[6px] bg-[#161719] border border-[#26272B] font-mono text-xs text-amber-300 flex items-center justify-between">
                    <span>{resultingApnCommand}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(resultingApnCommand, "apn_cmd")}
                      className="text-[#76777C] hover:text-[#ECECEE] p-1 cursor-pointer"
                    >
                      {copiedKey === "apn_cmd" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#76777C] block mb-1 uppercase font-semibold flex items-center justify-between">
                    <span>2. Comando SMS de Servidor Traccar:</span>
                    <span className="text-[#9B9CA1] font-mono text-[9px]">{currentServer.ip}:{currentModelSpec.port}</span>
                  </span>
                  <div className="p-2 rounded-[6px] bg-[#161719] border border-[#26272B] font-mono text-xs text-amber-300 flex items-center justify-between">
                    <span>{resultingConfigCommand}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(resultingConfigCommand, "cmd")}
                      className="text-[#76777C] hover:text-[#ECECEE] p-1 cursor-pointer"
                    >
                      {copiedKey === "cmd" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#222327]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-medium text-[#CFCFD3] hover:text-[#ECECEE] bg-[#121214] hover:bg-[#1D1E21] border border-[#2D2E32] transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Atrás</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(4);
                  handleRunPipeline();
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-[8px] text-xs font-bold bg-[#F05A28] hover:bg-[#FF6A35] text-white cursor-pointer transition-all"
              >
                <Sparkles size={14} />
                <span>Dar de Alta y Configurar Unidad (1-Click)</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: EJECUCION Y CONFIRMACION                                          */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center py-2">
              <div className="text-base font-bold text-[#ECECEE] mb-1">
                {isExecuting
                  ? "Ejecutando Pipeline de Alta y Configuración..."
                  : executionDone &&
                    pipelineState.traccar.status === "success" &&
                    pipelineState.unidades.status === "success" &&
                    pipelineState.smsApn.status === "success" &&
                    pipelineState.smsConfig.status === "success"
                  ? "¡Unidad dada de alta y configurada exitosamente!"
                  : "Proceso completado con observaciones"}
              </div>
              <p className="text-xs text-[#9B9CA1]">
                Placa: <strong className="text-[#ECECEE]">{placa}</strong> • IMEI:{" "}
                <strong className="text-[#ECECEE] font-mono">{imei}</strong> • Servidor:{" "}
                <strong className="text-[#F05A28]">{currentServer.name}</strong>
              </p>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-3 max-w-xl mx-auto">
              {/* Item 1: Traccar */}
              <div className="p-3.5 rounded-[8px] bg-[#121214] border border-[#26272B] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      pipelineState.traccar.status === "success"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : pipelineState.traccar.status === "loading"
                        ? "bg-[#1C1714] text-[#F05A28] border border-[#8A3A1C]"
                        : pipelineState.traccar.status === "error"
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-[#161719] text-[#76777C] border border-[#26272B]"
                    }`}
                  >
                    {pipelineState.traccar.status === "loading" ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : pipelineState.traccar.status === "success" ? (
                      <Check size={14} strokeWidth={3} />
                    ) : pipelineState.traccar.status === "error" ? (
                      <X size={14} strokeWidth={3} />
                    ) : (
                      "1"
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#ECECEE]">
                      1. Registro en Servidor Traccar ({currentServer.host})
                    </div>
                    <div className="text-[11px] text-[#9B9CA1]">
                      {pipelineState.traccar.message || "Registrando nombre, uniqueId, chip y atributos..."}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    pipelineState.traccar.status === "success"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : pipelineState.traccar.status === "loading"
                      ? "bg-[#1C1714] text-[#F05A28] border border-[#8A3A1C]"
                      : pipelineState.traccar.status === "error"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-[#161719] text-[#76777C] border border-[#26272B]"
                  }`}
                >
                  {pipelineState.traccar.status === "success"
                    ? "COMPLETADO"
                    : pipelineState.traccar.status === "loading"
                    ? "EN PROGRESO"
                    : pipelineState.traccar.status === "error"
                    ? "FALLÓ"
                    : "PENDIENTE"}
                </span>
              </div>

              {/* Item 2: Unidades Velsat */}
              <div className="p-3.5 rounded-[8px] bg-[#121214] border border-[#26272B] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      pipelineState.unidades.status === "success"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : pipelineState.unidades.status === "loading"
                        ? "bg-[#1C1714] text-[#F05A28] border border-[#8A3A1C]"
                        : pipelineState.unidades.status === "error"
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-[#161719] text-[#76777C] border border-[#26272B]"
                    }`}
                  >
                    {pipelineState.unidades.status === "loading" ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : pipelineState.unidades.status === "success" ? (
                      <Check size={14} strokeWidth={3} />
                    ) : pipelineState.unidades.status === "error" ? (
                      <X size={14} strokeWidth={3} />
                    ) : (
                      "2"
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#ECECEE]">
                      2. Registro en Módulo de Unidades Velsat
                    </div>
                    <div className="text-[11px] text-[#9B9CA1]">
                      {pipelineState.unidades.message || "Creando vehículo en base de datos central..."}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    pipelineState.unidades.status === "success"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : pipelineState.unidades.status === "loading"
                      ? "bg-[#1C1714] text-[#F05A28] border border-[#8A3A1C]"
                      : pipelineState.unidades.status === "error"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-[#161719] text-[#76777C] border border-[#26272B]"
                  }`}
                >
                  {pipelineState.unidades.status === "success"
                    ? "COMPLETADO"
                    : pipelineState.unidades.status === "loading"
                    ? "EN PROGRESO"
                    : pipelineState.unidades.status === "error"
                    ? "FALLÓ"
                    : "PENDIENTE"}
                </span>
              </div>

              {/* Item 3: SMS APN */}
              <div className="p-3.5 rounded-[8px] bg-[#121214] border border-[#26272B] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      pipelineState.smsApn.status === "success"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : pipelineState.smsApn.status === "loading"
                        ? "bg-[#1C1714] text-[#F05A28] border border-[#8A3A1C]"
                        : pipelineState.smsApn.status === "error"
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-[#161719] text-[#76777C] border border-[#26272B]"
                    }`}
                  >
                    {pipelineState.smsApn.status === "loading" ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : pipelineState.smsApn.status === "success" ? (
                      <Check size={14} strokeWidth={3} />
                    ) : pipelineState.smsApn.status === "error" ? (
                      <X size={14} strokeWidth={3} />
                    ) : (
                      "3"
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#ECECEE]">
                      3. Configuración de APN Móvil ({effectiveApn})
                    </div>
                    <div className="text-[11px] text-[#9B9CA1]">
                      {pipelineState.smsApn.message || `Enviando comando APN: ${resultingApnCommand}`}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    pipelineState.smsApn.status === "success"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : pipelineState.smsApn.status === "loading"
                      ? "bg-[#1C1714] text-[#F05A28] border border-[#8A3A1C]"
                      : pipelineState.smsApn.status === "error"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-[#161719] text-[#76777C] border border-[#26272B]"
                  }`}
                >
                  {pipelineState.smsApn.status === "success"
                    ? "COMPLETADO"
                    : pipelineState.smsApn.status === "loading"
                    ? "EN PROGRESO"
                    : pipelineState.smsApn.status === "error"
                    ? "FALLÓ"
                    : "PENDIENTE"}
                </span>
              </div>

              {/* Item 4: SMS Config Servidor */}
              <div className="p-3.5 rounded-[8px] bg-[#121214] border border-[#26272B] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      pipelineState.smsConfig.status === "success"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : pipelineState.smsConfig.status === "loading"
                        ? "bg-[#1C1714] text-[#F05A28] border border-[#8A3A1C]"
                        : pipelineState.smsConfig.status === "error"
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-[#161719] text-[#76777C] border border-[#26272B]"
                    }`}
                  >
                    {pipelineState.smsConfig.status === "loading" ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : pipelineState.smsConfig.status === "success" ? (
                      <Check size={14} strokeWidth={3} />
                    ) : pipelineState.smsConfig.status === "error" ? (
                      <X size={14} strokeWidth={3} />
                    ) : (
                      "4"
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#ECECEE]">
                      4. Envío de SMS de Servidor Traccar ({currentServer.ip}:{currentModelSpec.port})
                    </div>
                    <div className="text-[11px] text-[#9B9CA1]">
                      {pipelineState.smsConfig.message || "Apuntando el GPS a la IP y puerto correspondientes..."}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    pipelineState.smsConfig.status === "success"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : pipelineState.smsConfig.status === "loading"
                      ? "bg-[#1C1714] text-[#F05A28] border border-[#8A3A1C]"
                      : pipelineState.smsConfig.status === "error"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-[#161719] text-[#76777C] border border-[#26272B]"
                  }`}
                >
                  {pipelineState.smsConfig.status === "success"
                    ? "COMPLETADO"
                    : pipelineState.smsConfig.status === "loading"
                    ? "EN PROGRESO"
                    : pipelineState.smsConfig.status === "error"
                    ? "FALLÓ"
                    : "PENDIENTE"}
                </span>
              </div>
            </div>

            {/* Bottom Final Actions */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-[#222327]">
              {executionDone && (
                <>
                  <button
                    type="button"
                    onClick={handleResetWizard}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-xs font-bold bg-[#F05A28] hover:bg-[#FF6A35] text-white cursor-pointer transition-all"
                  >
                    <Sparkles size={14} />
                    <span>Configurar Otra Unidad</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-[8px] text-xs font-medium text-[#CFCFD3] hover:text-[#ECECEE] bg-[#121214] hover:bg-[#1D1E21] border border-[#2D2E32] transition-colors cursor-pointer"
                  >
                    <span>Volver a Comandos SMS</span>
                  </button>
                </>
              )}

              {isExecuting && (
                <div className="text-xs text-[#76777C] font-mono animate-pulse">
                  Por favor no cierres la ventana mientras se completan las peticiones...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
