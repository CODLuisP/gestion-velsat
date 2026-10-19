"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  MessageSquare,
  Search,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  Car,
  X,
  Radio,
  ExternalLink,
  RefreshCw,
  Sliders,
  Terminal,
  Zap,
  Trash2,
  Smartphone,
  Signal,
  Wifi,
  Battery,
  ChevronRight,
  Sparkles,
  Info,
  Check,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Vehiculo } from "@/app/interfaces/vehiculo.interface";
import { Role } from "@/app/constants/roles";
import AutoUnitWizard from "./AutoUnitWizard";
import PanelHeader from "@/app/components/nav/PanelHeader";
import { obtenerAyuda, type AyudaComando } from "./comandosAyuda";

type GpsModel = "teltonika" | "tk" | "gt";
type CommandCategory = "LECTURA" | "CONFIG" | "CRÍTICO";

interface QuickOption {
  label: string;
  value: string;
}

interface CommandParam {
  key: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  quickOptions?: (string | QuickOption)[];
}

const IO_OPTIONS: QuickOption[] = [
  { label: "1 · Entrada DIN1", value: "1" },
  { label: "21 · Señal GSM", value: "21" },
  { label: "66 · Voltaje del vehículo", value: "66" },
  { label: "67 · Batería interna GPS", value: "67" },
  { label: "179 · Relé de corte (DOUT1)", value: "179" },
  { label: "180 · Salida DOUT2", value: "180" },
  { label: "239 · Ignición", value: "239" },
  { label: "240 · Movimiento", value: "240" },
];

const PARAM_OPTIONS: QuickOption[] = [
  { label: "2001 · APN", value: "2001" },
  { label: "2002 · Usuario APN", value: "2002" },
  { label: "2003 · Clave APN", value: "2003" },
  { label: "2004 · IP del servidor", value: "2004" },
  { label: "2005 · Puerto", value: "2005" },
  { label: "2006 · Protocolo", value: "2006" },
];

const SERVER_IP_OPTIONS: QuickOption[] = [
  { label: "Linux 1 (164.92.70.28)", value: "164.92.70.28" },
  { label: "Linux 2 (165.227.9.191)", value: "165.227.9.191" },
];

interface GpsCommand {
  id: string;
  name: string;
  rawTemplate: string;
  category: CommandCategory;
  description: string;
  params?: CommandParam[];
}

interface SentRecord {
  id: string;
  phoneNumber: string;
  normalizedPhone: string;
  placa?: string;
  model?: string;
  message: string;
  status: "sent" | "failed" | "delivered" | "answered";
  sentAt: string;
  error?: string;
  response?: {
    message: string;
    receivedAt: string;
    sender: string;
  };
}

interface WebhookLog {
  id: string;
  sender: string;
  normalizedSender: string;
  recipient?: string;
  message: string;
  receivedAt: string;
  matchedRecordId?: string;
}

// --------------------------------------------------------------------------
// LISTA COMPLETA DE COMANDOS POR MODELO
// --------------------------------------------------------------------------

const TELTONIKA_COMMANDS: GpsCommand[] = [
  {
    id: "t_getinfo",
    name: "getinfo",
    rawTemplate: "getinfo",
    category: "LECTURA",
    description: "Información de estado del sistema (runtime, uptime, cpu)",
  },
  {
    id: "t_getver",
    name: "getver",
    rawTemplate: "getver",
    category: "LECTURA",
    description: "Versión de firmware, IMEI, tiempo de encendido, MAC BT",
  },
  {
    id: "t_getstatus",
    name: "getstatus",
    rawTemplate: "getstatus",
    category: "LECTURA",
    description: "Estado del módem GSM/GPRS, operador y señal",
  },
  {
    id: "t_getgps",
    name: "getgps",
    rawTemplate: "getgps",
    category: "LECTURA",
    description: "Datos GPS actuales + fecha/hora, satélites y altitud",
  },
  {
    id: "t_ggps",
    name: "ggps",
    rawTemplate: "ggps",
    category: "LECTURA",
    description: "Ubicación actual con link directo a Google Maps",
  },
  {
    id: "t_getio",
    name: "getio",
    rawTemplate: "getio",
    category: "LECTURA",
    description: "Lectura completa de entradas/salidas digitales y analógicas",
  },
  {
    id: "t_readio",
    name: "readio",
    rawTemplate: "readio {id}",
    category: "LECTURA",
    description: "Estado de una IO específica: voltaje, batería interna, relé, ignición",
    params: [
      {
        key: "id",
        label: "ID de Entrada/Salida (IO)",
        placeholder: "1",
        defaultValue: "66",
        quickOptions: IO_OPTIONS,
      },
    ],
  },
  {
    id: "t_getparam",
    name: "getparam",
    rawTemplate: "getparam {id}",
    category: "LECTURA",
    description: "Devuelve el valor de un parámetro del equipo por su ID",
    params: [
      { key: "id", label: "ID del Parámetro", placeholder: "2001", defaultValue: "2001", quickOptions: PARAM_OPTIONS },
    ],
  },
  {
    id: "t_setparam",
    name: "setparam",
    rawTemplate: "setparam {id}:{valor}",
    category: "CONFIG",
    description: "Cambia el valor de un parámetro específico (ID:valor)",
    params: [
      { key: "id", label: "ID Parámetro", placeholder: "2001", defaultValue: "2001" },
      { key: "valor", label: "Nuevo Valor", placeholder: "movistar.pe", defaultValue: "movistar.pe" },
    ],
  },
  {
    id: "t_setdigout",
    name: "setdigout",
    rawTemplate: "setdigout {d1} {d2}",
    category: "CRÍTICO",
    description: "Activa/desactiva salidas digitales (corte de motor relé DOUT1 / DOUT2)",
    params: [
      { key: "d1", label: "Salida 1 (DOUT1 / Relé)", placeholder: "1 (Cortar) o 0 (Restaurar)", defaultValue: "1", quickOptions: ["1", "0"] },
      { key: "d2", label: "Salida 2 (DOUT2)", placeholder: "0", defaultValue: "0", quickOptions: ["0", "1"] },
    ],
  },
  {
    id: "t_flush",
    name: "flush",
    rawTemplate: "flush {imei},{apn},{login},{pass},{ip},{port},{modo}",
    category: "CONFIG",
    description: "Redirige el equipo a otro servidor / IP de destino",
    params: [
      { key: "imei", label: "IMEI", placeholder: "0", defaultValue: "0" },
      { key: "apn", label: "APN", placeholder: "movistar.pe", defaultValue: "movistar.pe", quickOptions: ["movistar.pe", "claro.pe", "entel.pe"] },
      { key: "login", label: "Usuario APN", placeholder: "", defaultValue: "" },
      { key: "pass", label: "Pass APN", placeholder: "", defaultValue: "" },
      { key: "ip", label: "IP Servidor", placeholder: "164.92.70.28", defaultValue: "164.92.70.28", quickOptions: SERVER_IP_OPTIONS },
      { key: "port", label: "Puerto", placeholder: "5027", defaultValue: "5027", quickOptions: ["5027"] },
      { key: "modo", label: "Modo (0:TCP, 1:UDP)", placeholder: "0", defaultValue: "0", quickOptions: ["0", "1"] },
    ],
  },
  {
    id: "t_setserver",
    name: "setparam 2004:{ip};2005:{port};2006:0",
    rawTemplate: "setparam 2004:{ip};2005:{port};2006:0",
    category: "CONFIG",
    description: "Configura IP y puerto del servidor Traccar (puerto 5027, TCP)",
    params: [
      { key: "ip", label: "IP Servidor Traccar", placeholder: "164.92.70.28", defaultValue: "164.92.70.28", quickOptions: SERVER_IP_OPTIONS },
      { key: "port", label: "Puerto Traccar", placeholder: "5027", defaultValue: "5027", quickOptions: ["5027"] },
    ],
  },
  {
    id: "t_countrecs",
    name: "countrecs",
    rawTemplate: "countrecs",
    category: "LECTURA",
    description: "Cantidad de registros guardados en la memoria interna/SD",
  },
  {
    id: "t_battery",
    name: "battery",
    rawTemplate: "battery",
    category: "LECTURA",
    description: "Estado, voltaje de alimentación externa y nivel de batería de respaldo",
  },
  {
    id: "t_getvin",
    name: "getvin",
    rawTemplate: "getvin",
    category: "LECTURA",
    description: "Obtiene el número de chasis / VIN leído por el bus CAN",
  },
  {
    id: "t_deleterecords",
    name: "deleterecords",
    rawTemplate: "deleterecords",
    category: "CRÍTICO",
    description: "Borra todos los registros acumulados de la memoria flash/SD",
  },
  {
    id: "t_defaultcfg",
    name: "defaultcfg",
    rawTemplate: "defaultcfg",
    category: "CRÍTICO",
    description: "Restaura la configuración de fábrica original del equipo",
  },
  {
    id: "t_cpureset",
    name: "cpureset",
    rawTemplate: "cpureset",
    category: "CRÍTICO",
    description: "Reinicia el procesador y módem del dispositivo inmediatamente",
  },
];

const TK_COMMANDS: GpsCommand[] = [
  {
    id: "tk_check",
    name: "check{pass}",
    rawTemplate: "check{pass}",
    category: "LECTURA",
    description: "Consulta estado general: GPS, GSM, GPRS, batería y relé",
  },
  {
    id: "tk_begin",
    name: "begin{pass}",
    rawTemplate: "begin{pass}",
    category: "CONFIG",
    description: "Inicializa el equipo con valores por defecto (ej. begin123456)",
  },
  {
    id: "tk_admin",
    name: "admin{pass} {telefono}",
    rawTemplate: "admin{pass} {telefono}",
    category: "CONFIG",
    description: "Registra tu número como administrador autorizado",
    params: [
      { key: "telefono", label: "Número Celular Administrador", placeholder: "987654321", defaultValue: "987654321" },
    ],
  },
  {
    id: "tk_adminip",
    name: "adminip{pass} {ip} {puerto}",
    rawTemplate: "adminip{pass} {ip} {puerto}",
    category: "CONFIG",
    description: "Configura IP y puerto del servidor Traccar (puerto 5001)",
    params: [
      { key: "ip", label: "IP Servidor Traccar", placeholder: "164.92.70.28", defaultValue: "164.92.70.28", quickOptions: SERVER_IP_OPTIONS },
      { key: "puerto", label: "Puerto Traccar", placeholder: "5001", defaultValue: "5001", quickOptions: ["5001"] },
    ],
  },
  {
    id: "tk_apn",
    name: "apn{pass} {apn}",
    rawTemplate: "apn{pass} {apn}",
    category: "CONFIG",
    description: "Configura el APN del operador telefónico",
    params: [
      { key: "apn", label: "Nombre del APN", placeholder: "movistar.pe", defaultValue: "movistar.pe", quickOptions: ["movistar.pe", "claro.pe", "entel.pe", "bitel.pe"] },
    ],
  },
  {
    id: "tk_apn_auth",
    name: "apn{pass} {apn} {user} {pass_apn}",
    rawTemplate: "apn{pass} {apn} {user} {pass_apn}",
    category: "CONFIG",
    description: "Configura APN con usuario y contraseña",
    params: [
      { key: "apn", label: "APN", placeholder: "movistar.pe", defaultValue: "movistar.pe", quickOptions: ["movistar.pe", "claro.pe", "entel.pe"] },
      { key: "user", label: "Usuario", placeholder: "movistar", defaultValue: "movistar" },
      { key: "pass_apn", label: "Password APN", placeholder: "movistar", defaultValue: "movistar" },
    ],
  },
  {
    id: "tk_gprs_tcp",
    name: "gprs{pass},0,0",
    rawTemplate: "gprs{pass},0,0",
    category: "CONFIG",
    description: "Activa transmisión de datos GPRS en modo TCP/IP",
  },
  {
    id: "tk_gprs_udp",
    name: "gprs{pass},1,1",
    rawTemplate: "gprs{pass},1,1",
    category: "CONFIG",
    description: "Activa transmisión de datos GPRS en modo UDP",
  },
  {
    id: "tk_timezone",
    name: "time zone{pass} {offset}",
    rawTemplate: "time zone{pass} {offset}",
    category: "CONFIG",
    description: "Configura el huso horario (ej: -5 para hora de Perú)",
    params: [
      { key: "offset", label: "Huso Horario", placeholder: "-5", defaultValue: "-5", quickOptions: ["-5", "-4", "0"] },
    ],
  },
  {
    id: "tk_fix_interval",
    name: "fix010m030m***n{pass}",
    rawTemplate: "fix{t_on}m{t_off}m***n{pass}",
    category: "CONFIG",
    description: "Frecuencia de reporte: T1 motor encendido, T2 motor apagado",
    params: [
      { key: "t_on", label: "Minutos encendido (3 dígitos)", placeholder: "010", defaultValue: "010", quickOptions: ["001", "005", "010"] },
      { key: "t_off", label: "Minutos apagado (3 dígitos)", placeholder: "030", defaultValue: "030", quickOptions: ["015", "030", "060"] },
    ],
  },
  {
    id: "tk_fix_continuous",
    name: "fix005m***n{pass}",
    rawTemplate: "fix{minutos}m***n{pass}",
    category: "CONFIG",
    description: "Reporta continuamente cada X minutos sin importar ignición",
    params: [
      { key: "minutos", label: "Minutos (3 dígitos)", placeholder: "005", defaultValue: "005", quickOptions: ["001", "003", "005", "010"] },
    ],
  },
  {
    id: "tk_stop",
    name: "stop{pass}",
    rawTemplate: "stop{pass}",
    category: "CRÍTICO",
    description: "Corte de motor / combustible inmediato (corta el relé)",
  },
  {
    id: "tk_resume",
    name: "resume{pass}",
    rawTemplate: "resume{pass}",
    category: "CRÍTICO",
    description: "Restablece el flujo de combustible y permite encender el motor",
  },
  {
    id: "tk_monitor",
    name: "monitor{pass}",
    rawTemplate: "monitor{pass}",
    category: "CONFIG",
    description: "Activa modo escucha / micrófono espía al llamar al equipo",
  },
  {
    id: "tk_tracker",
    name: "tracker{pass}",
    rawTemplate: "tracker{pass}",
    category: "CONFIG",
    description: "Restaura modo rastreo normal y desactiva modo monitor",
  },
  {
    id: "tk_help",
    name: "help me",
    rawTemplate: "help me",
    category: "CONFIG",
    description: "Desactiva la alarma SOS disparada por el botón de pánico",
  },
  {
    id: "tk_reset",
    name: "reset{pass}",
    rawTemplate: "reset{pass}",
    category: "CRÍTICO",
    description: "Reinicia el equipo y restaura configuración de fábrica",
  },
];

const GT_COMMANDS: GpsCommand[] = [
  {
    id: "gt_status",
    name: "STATUS#",
    rawTemplate: "STATUS#",
    category: "LECTURA",
    description: "Estado de batería, GSM, GPS y ACC",
  },
  {
    id: "gt_check",
    name: "CHECK#",
    rawTemplate: "CHECK#",
    category: "LECTURA",
    description: "Verificación de red, servidor IP, puerto, APN, señal GSM y satélites",
  },
  {
    id: "gt_param",
    name: "PARAM#",
    rawTemplate: "PARAM#",
    category: "LECTURA",
    description: "Devuelve los parámetros configurados",
  },
  {
    id: "gt_where",
    name: "WHERE#",
    rawTemplate: "WHERE#",
    category: "LECTURA",
    description: "Coordenadas de la última posición",
  },
  {
    id: "gt_url",
    name: "URL#",
    rawTemplate: "URL#",
    category: "LECTURA",
    description: "Enlace de Google Maps con la ubicación",
  },
  {
    id: "gt_version",
    name: "VERSION#",
    rawTemplate: "VERSION#",
    category: "LECTURA",
    description: "Versión de firmware e IMEI",
  },
  {
    id: "gt_server_ip",
    name: "SERVER,0,{ip},{puerto},0#",
    rawTemplate: "SERVER,0,{ip},{puerto},0#",
    category: "CONFIG",
    description: "Define servidor por IP y puerto de reporte Traccar (puerto 5023)",
    params: [
      { key: "ip", label: "IP Servidor Traccar", placeholder: "164.92.70.28", defaultValue: "164.92.70.28", quickOptions: SERVER_IP_OPTIONS },
      { key: "puerto", label: "Puerto Traccar", placeholder: "5023", defaultValue: "5023", quickOptions: ["5023"] },
    ],
  },
  {
    id: "gt_server_domain",
    name: "SERVER,1,{dominio},{puerto},0#",
    rawTemplate: "SERVER,1,{dominio},{puerto},0#",
    category: "CONFIG",
    description: "Define servidor por dominio/IP y puerto de reporte Traccar (puerto 5023)",
    params: [
      { key: "dominio", label: "IP / Dominio Traccar", placeholder: "164.92.70.28", defaultValue: "164.92.70.28", quickOptions: SERVER_IP_OPTIONS },
      { key: "puerto", label: "Puerto Traccar", placeholder: "5023", defaultValue: "5023", quickOptions: ["5023"] },
    ],
  },
  {
    id: "gt_apn",
    name: "APN,{apn}#",
    rawTemplate: "APN,{apn}#",
    category: "CONFIG",
    description: "Configura el APN del operador",
    params: [
      { key: "apn", label: "APN", placeholder: "movistar.pe", defaultValue: "movistar.pe", quickOptions: ["movistar.pe", "claro.pe", "entel.pe", "bitel.pe"] },
    ],
  },
  {
    id: "gt_apn_auth",
    name: "APN,{apn},{usuario},{pass}#",
    rawTemplate: "APN,{apn},{usuario},{pass}#",
    category: "CONFIG",
    description: "Configura APN con usuario y contraseña",
    params: [
      { key: "apn", label: "APN", placeholder: "movistar.pe", defaultValue: "movistar.pe", quickOptions: ["movistar.pe", "claro.pe", "entel.pe"] },
      { key: "usuario", label: "Usuario APN", placeholder: "movistar", defaultValue: "movistar" },
      { key: "pass", label: "Password APN", placeholder: "movistar", defaultValue: "movistar" },
    ],
  },
  {
    id: "gt_timer",
    name: "TIMER,{segundos}#",
    rawTemplate: "TIMER,{segundos}#",
    category: "CONFIG",
    description: "Intervalo de reporte con motor encendido",
    params: [
      { key: "segundos", label: "Segundos", placeholder: "60", defaultValue: "60", quickOptions: ["30", "60", "120", "300"] },
    ],
  },
  {
    id: "gt_timer_double",
    name: "TIMER,{t1},{t2}#",
    rawTemplate: "TIMER,{t1},{t2}#",
    category: "CONFIG",
    description: "Frecuencia de reporte: motor encendido (T1) y apagado (T2)",
    params: [
      { key: "t1", label: "Encendido (segundos)", placeholder: "30", defaultValue: "30", quickOptions: ["15", "30", "60"] },
      { key: "t2", label: "Apagado (segundos)", placeholder: "180", defaultValue: "180", quickOptions: ["120", "180", "300"] },
    ],
  },
  {
    id: "gt_gprson_1",
    name: "GPRSON,1#",
    rawTemplate: "GPRSON,1#",
    category: "CONFIG",
    description: "Activa transmisión de datos GPRS",
  },
  {
    id: "gt_gprson_0",
    name: "GPRSON,0#",
    rawTemplate: "GPRSON,0#",
    category: "CONFIG",
    description: "Desactiva transmisión de datos GPRS",
  },
  {
    id: "gt_gmt",
    name: "GMT,W,{offset}#",
    rawTemplate: "GMT,W,{offset}#",
    category: "CONFIG",
    description: "Ajusta el huso horario (ej. 5 para GMT-5 Perú)",
    params: [
      { key: "offset", label: "Offset GMT Occidental", placeholder: "5", defaultValue: "5", quickOptions: ["5", "4", "0"] },
    ],
  },
  {
    id: "gt_sos",
    name: "SOS,A,{telefono}#",
    rawTemplate: "SOS,A,{telefono}#",
    category: "CONFIG",
    description: "Registra número SOS autorizado",
    params: [
      { key: "telefono", label: "Número Celular SOS", placeholder: "987654321", defaultValue: "987654321" },
    ],
  },
  {
    id: "gt_speed",
    name: "SPEED,{kmh}#",
    rawTemplate: "SPEED,{kmh}#",
    category: "CONFIG",
    description: "Alerta por exceso de velocidad",
    params: [
      { key: "kmh", label: "Límite en km/h", placeholder: "90", defaultValue: "90", quickOptions: ["70", "80", "90", "100"] },
    ],
  },
  {
    id: "gt_relay_1",
    name: "RELAY,1#",
    rawTemplate: "RELAY,1#",
    category: "CRÍTICO",
    description: "Corta el motor mediante el relé",
  },
  {
    id: "gt_relay_0",
    name: "RELAY,0#",
    rawTemplate: "RELAY,0#",
    category: "CRÍTICO",
    description: "Restablece el motor",
  },
  {
    id: "gt_reset",
    name: "RESET#",
    rawTemplate: "RESET#",
    category: "CRÍTICO",
    description: "Reinicia el dispositivo inmediatamente",
  },
  {
    id: "gt_factory",
    name: "FACTORY#",
    rawTemplate: "FACTORY#",
    category: "CRÍTICO",
    description: "Borra toda la configuración y regresa a fábrica",
  },
  {
    id: "gt_begin",
    name: "#begin#123456#",
    rawTemplate: "#begin#123456#",
    category: "CONFIG",
    description: "Inicializa / restaura parámetros de fábrica",
  },
];

type Props = {
  role?: Role;
  actor?: string;
};

// Limpia y extrae los 9 dígitos peruanos
function cleanPeruPhone(val: string): string {
  if (!val) return "";
  let digits = val.replace(/[^0-9]/g, "");
  // Si empieza con 519 (código de país Perú + celular que empieza con 9)
  if (digits.startsWith("519") && digits.length >= 4) {
    digits = digits.slice(2);
  } else if (digits.startsWith("51") && digits.length > 9) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 9);
}

// Formato visual amigable "912 903 330"
function formatPeruPhone(digits: string): string {
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

export default function ComandosSmsClient({ role = "Servidor_125", actor }: Props) {
  // Mode switch: Wizard Auto-create vs Manual SMS console
  const [autoWizardMode, setAutoWizardMode] = useState(false);

  // Model state
  const [selectedModel, setSelectedModel] = useState<GpsModel>("gt");

  // Destination & Access state
  const [simLocalNumber, setSimLocalNumber] = useState(""); // solo los 9 dígitos locales
  const [placaBusqueda, setPlacaBusqueda] = useState("");
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);
  const [showPlacaDropdown, setShowPlacaDropdown] = useState(false);

  // Model credentials
  const [teltonikaLogin, setTeltonikaLogin] = useState("");
  const [teltonikaPass, setTeltonikaPass] = useState("");
  const [tkPass, setTkPass] = useState("123456");
  const [gtPass, setGtPass] = useState("123456");

  // Commands state
  const [commandSearch, setCommandSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [selectedCommand, setSelectedCommand] = useState<GpsCommand>(GT_COMMANDS[7]); // default APN
  const [paramValues, setParamValues] = useState<Record<string, string>>({
    apn: "movistar.pe",
  });
  const [customMessage, setCustomMessage] = useState("");
  const [isCustomEdited, setIsCustomEdited] = useState(false);
  // Guía del comando seleccionado (panel inferior derecho). Oculta por defecto:
  // el usuario la despliega cuando quiere saber qué hace el comando.
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  // Gateway & Execution state
  const [gatewayConfigured, setGatewayConfigured] = useState<boolean | null>(null);
  const [gatewayUser, setGatewayUser] = useState<string | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);

  // History & Webhook responses (Auto-clean after 12 hours)
  const STORAGE_KEY_HISTORY = "velsat_sms_history";
  const STORAGE_KEY_INCOMING = "velsat_sms_incoming";
  // Último estado conocido del gateway: evita mostrar "PENDIENTE"/"CONSULTANDO"
  // al volver a entrar a la página mientras se revalida en segundo plano
  const STORAGE_KEY_STATUS = "velsat_sms_gateway_status";
  const MAX_SMS_RETENTION_MS = 12 * 60 * 60 * 1000; // 12 horas

  const isWithin12Hours = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return !isNaN(t) && Date.now() - t < MAX_SMS_RETENTION_MS;
  };

  const [history, setHistory] = useState<SentRecord[]>([]);
  const [incomingLogs, setIncomingLogs] = useState<WebhookLog[]>([]);
  const [consoleTab, setConsoleTab] = useState<"sent" | "incoming">("sent");
  const [registeredWebhooks, setRegisteredWebhooks] = useState<any[] | null>(null);
  const [webhookInputUrl, setWebhookInputUrl] = useState("");
  const [showWebhookModal, setShowWebhookModal] = useState(false);

  // Hydrate history and incomingLogs from localStorage on initial mount (pruning > 12h)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter((r: any) => isWithin12Hours(r?.sentAt));
            setHistory(valid);
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(valid));
          }
        }
        const savedIncoming = localStorage.getItem(STORAGE_KEY_INCOMING);
        if (savedIncoming) {
          const parsedInc = JSON.parse(savedIncoming);
          if (Array.isArray(parsedInc)) {
            const valid = parsedInc.filter((inc: any) => isWithin12Hours(inc?.receivedAt));
            setIncomingLogs(valid);
            localStorage.setItem(STORAGE_KEY_INCOMING, JSON.stringify(valid));
          }
        }
        // Estado del gateway y webhooks: se pinta al instante el último conocido
        const savedStatus = localStorage.getItem(STORAGE_KEY_STATUS);
        if (savedStatus) {
          const st = JSON.parse(savedStatus);
          if (typeof st?.gatewayConfigured === "boolean") setGatewayConfigured(st.gatewayConfigured);
          if (st?.gatewayUser) setGatewayUser(st.gatewayUser);
          if (st?.deviceStatus) setDeviceStatus(st.deviceStatus);
          if (Array.isArray(st?.registeredWebhooks)) {
            setRegisteredWebhooks(st.registeredWebhooks);
            if (st.registeredWebhooks[0]?.url) setWebhookInputUrl(st.registeredWebhooks[0].url);
          }
        }
      } catch (err) {
        console.error("Error al cargar historial local de SMS:", err);
      }
    }
  }, []);

  // Vehicles list from api
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Unidades de los tres servidores: el comando se manda a la SIM del GPS,
  // así que se puede buscar cualquier placa sin importar con qué usuario se entró.
  const loadVehiculos = async () => {
    setLoadingVehiculos(true);
    try {
      const res = await axios.get("/api/placas");
      if (Array.isArray(res.data?.placas)) {
        setVehiculos(
          res.data.placas.map((p: any) => ({
            deviceID: p.placa,
            accountID: p.cuenta,
            equipmentType: p.equipmentType || "",
            uniqueID: p.imeiNumber || "",
            deviceCode: p.deviceCode || "",
            simPhoneNumber: p.simPhoneNumber || "",
            imeiNumber: p.imeiNumber || "",
            isActive: "1",
          }))
        );
      }
    } catch (err) {
      console.error("Error al cargar unidades para SMS:", err);
    } finally {
      setLoadingVehiculos(false);
    }
  };

  useEffect(() => {
    loadVehiculos();
  }, []);

  // Load gateway status, history and active webhooks (merging with localStorage & auto-cleaning > 12h)
  // includeStatus=false (sondeo del historial): no consulta a sms-gate.app,
  // solo lee el historial del servidor. El estado del gateway/celular/webhook
  // se revisa cada 30 s para no saturar el gateway ni la propia web.
  const loadGatewayAndHistory = async (includeStatus = false) => {
    try {
      const [sendRes, webhookRes] = await Promise.allSettled([
        axios.get(includeStatus ? "/api/send-sms" : "/api/send-sms?light=1"),
        includeStatus ? axios.get("/api/gps-webhook") : Promise.resolve(null),
      ]);

      let serverRecords: SentRecord[] = [];
      let serverIncoming: WebhookLog[] = [];
      const statusSnapshot: any = {};

      if (sendRes.status === "fulfilled" && sendRes.value.data) {
        setGatewayConfigured(sendRes.value.data.configured);
        setGatewayUser(sendRes.value.data.gatewayUser);
        statusSnapshot.gatewayConfigured = sendRes.value.data.configured;
        statusSnapshot.gatewayUser = sendRes.value.data.gatewayUser;
        if (sendRes.value.data.deviceStatus) {
          setDeviceStatus(sendRes.value.data.deviceStatus);
          statusSnapshot.deviceStatus = sendRes.value.data.deviceStatus;
        }
        if (Array.isArray(sendRes.value.data.history)) {
          serverRecords = sendRes.value.data.history;
        }
        if (Array.isArray(sendRes.value.data.incoming)) {
          serverIncoming = [...serverIncoming, ...sendRes.value.data.incoming];
        }
      }

      if (webhookRes.status === "fulfilled" && webhookRes.value?.data) {
        if (Array.isArray(webhookRes.value.data.records)) {
          serverRecords = [...serverRecords, ...webhookRes.value.data.records];
        }
        if (Array.isArray(webhookRes.value.data.incoming)) {
          serverIncoming = [...serverIncoming, ...webhookRes.value.data.incoming];
        }
        if (Array.isArray(webhookRes.value.data.registeredWebhooks)) {
          setRegisteredWebhooks(webhookRes.value.data.registeredWebhooks);
          statusSnapshot.registeredWebhooks = webhookRes.value.data.registeredWebhooks;
          if (webhookRes.value.data.registeredWebhooks.length > 0 && !webhookInputUrl) {
            setWebhookInputUrl(webhookRes.value.data.registeredWebhooks[0].url || "");
          }
        }
      }

      // Guarda el último estado conocido para la próxima visita a la página
      if (typeof window !== "undefined" && Object.keys(statusSnapshot).length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(statusSnapshot));
        } catch (e) {}
      }

      // 1. Merge incoming webhook logs (only kept if < 12 hours)
      setIncomingLogs((prevInc) => {
        const incMap = new Map<string, WebhookLog>();
        [...serverIncoming, ...prevInc].forEach((item) => {
          if (item && item.id && isWithin12Hours(item.receivedAt)) {
            incMap.set(item.id, item);
          }
        });
        const mergedInc = Array.from(incMap.values()).slice(0, 100);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY_INCOMING, JSON.stringify(mergedInc));
          } catch (e) {}
        }
        return mergedInc;
      });

      // 2. Merge sent records and link any incoming responses by phone digits (only kept if < 12 hours)
      setHistory((prevHist) => {
        const recordMap = new Map<string, SentRecord>();
        // Fresh serverRecords overwrite prevHist if IDs match
        [...prevHist, ...serverRecords].forEach((rec) => {
          if (rec && rec.id && isWithin12Hours(rec.sentAt)) {
            recordMap.set(rec.id, rec);
          }
        });
        const mergedList = Array.from(recordMap.values());

        // Gather all known incoming logs
        const allInc = [...serverIncoming];
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem(STORAGE_KEY_INCOMING);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) allInc.push(...parsed);
            }
          } catch (e) {}
        }

        // Sort records by sentAt descending
        mergedList.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

        // Link incoming replies to matching sent records:
        // Each command receives its matching replies, and displays the most recent one received
        mergedList.forEach((record, idx) => {
          const recDigits = (record.phoneNumber || "").replace(/[^0-9]/g, "");
          if (recDigits.length >= 9) {
            const phoneSuffix = recDigits.slice(-9);
            const sentMs = new Date(record.sentAt).getTime();

            // Find if there is a newer command sent to the exact same phone number
            const newerCommand = mergedList.slice(0, idx).find((r) => {
              const rDigits = (r.phoneNumber || "").replace(/[^0-9]/g, "");
              return rDigits.slice(-9) === phoneSuffix;
            });
            const nextSentMs = newerCommand ? new Date(newerCommand.sentAt).getTime() : Infinity;

            // Find all replies from this phone that arrived for this command:
            // (after this command was sent, with 15s grace for clock skew, and before the next command to this phone)
            const matchingReplies = allInc.filter((inc) => {
              const incDigits = (inc.sender || "").replace(/[^0-9]/g, "");
              if (incDigits.slice(-9) !== phoneSuffix) return false;
              const incMs = new Date(inc.receivedAt).getTime();
              const afterThis = isNaN(sentMs) || isNaN(incMs) || incMs >= sentMs - 15000;
              const beforeNext = isNaN(nextSentMs) || isNaN(incMs) || incMs < nextSentMs - 15000;
              return afterThis && beforeNext;
            });

            if (matchingReplies.length > 0) {
              // Sort descending: index 0 is always the latest/newest response received
              matchingReplies.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
              const latest = matchingReplies[0];
              record.status = "answered";
              record.response = {
                message: latest.message,
                receivedAt: latest.receivedAt,
                sender: latest.sender,
              };
            }
          }
        });

        const finalRecords = mergedList.slice(0, 100);

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(finalRecords));
          } catch (e) {}
        }
        return finalRecords;
      });
    } catch (err) {
      console.error("Error al cargar estado de Gateway:", err);
    }
  };

  useEffect(() => {
    // Primera carga completa (historial + estado del gateway y del webhook)
    loadGatewayAndHistory(true);
    // El historial se refresca seguido: es barato, no consulta a sms-gate.app
    const historyInterval = setInterval(() => loadGatewayAndHistory(false), 3000);
    // El estado del gateway, celular y webhook se revisa cada 30 s
    const statusInterval = setInterval(() => loadGatewayAndHistory(true), 30000);
    return () => {
      clearInterval(historyInterval);
      clearInterval(statusInterval);
    };
  }, []);

  // Filter vehicles by search query
  const vehiculosFiltrados = useMemo(() => {
    const q = placaBusqueda.trim().toLowerCase();
    if (!q) return [];
    return vehiculos
      .filter((v) =>
        [v.deviceID, v.accountID, v.simPhoneNumber, v.imeiNumber, v.equipmentType]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 8);
  }, [placaBusqueda, vehiculos]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowPlacaDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Change model
  const commandsForModel = useMemo(() => {
    switch (selectedModel) {
      case "teltonika":
        return TELTONIKA_COMMANDS;
      case "tk":
        return TK_COMMANDS;
      case "gt":
      default:
        return GT_COMMANDS;
    }
  }, [selectedModel]);

  const handleSelectModel = (model: GpsModel) => {
    setSelectedModel(model);
    const newCommands =
      model === "teltonika" ? TELTONIKA_COMMANDS : model === "tk" ? TK_COMMANDS : GT_COMMANDS;
    const defaultCmd = newCommands[0];
    setSelectedCommand(defaultCmd);
    const initialParams: Record<string, string> = {};
    defaultCmd.params?.forEach((p) => {
      initialParams[p.key] = p.defaultValue;
    });
    setParamValues(initialParams);
    setIsCustomEdited(false);
  };

  const handleSelectCommand = (cmd: GpsCommand) => {
    setSelectedCommand(cmd);
    const initialParams: Record<string, string> = {};
    cmd.params?.forEach((p) => {
      if (p.key === "puerto" || p.key === "port") {
        initialParams[p.key] = p.defaultValue;
      } else if (p.key === "ip" || p.key === "dominio") {
        const prev = paramValues[p.key];
        initialParams[p.key] = (prev === "165.227.9.191" || prev === "164.92.70.28") ? prev : p.defaultValue;
      } else if (p.key === "id") {
        // Cada comando tiene sus propios IDs: no se hereda el del comando anterior
        initialParams[p.key] = p.defaultValue;
      } else {
        initialParams[p.key] = paramValues[p.key] || p.defaultValue;
      }
    });
    setParamValues((prev) => ({ ...prev, ...initialParams }));
    setIsCustomEdited(false);
  };

  // Manejador del número manual: solo 9 dígitos, sin el +51
  const handleSimNumberChange = (raw: string) => {
    const digits = cleanPeruPhone(raw);
    setSimLocalNumber(digits);
  };

  // Select a unit from dropdown
  const handleSelectVehiculo = (v: Vehiculo) => {
    setVehiculoSeleccionado(v);
    setPlacaBusqueda(v.deviceID);
    setShowPlacaDropdown(false);

    // Auto-fill SIM number (solo 9 dígitos)
    if (v.simPhoneNumber) {
      const digits = cleanPeruPhone(v.simPhoneNumber);
      setSimLocalNumber(digits);
      toast.success(`SIM de unidad ${v.deviceID} cargada`);
    } else {
      toast.error(`La unidad ${v.deviceID} no tiene número SIM registrado`);
    }

    // Auto-detect model
    const eq = (v.equipmentType || "").toUpperCase();
    if (eq.includes("FMB") || eq.includes("FMC") || eq.includes("TELTONIKA")) {
      handleSelectModel("teltonika");
      toast("Modelo Teltonika detectado", { icon: "📡" });
    } else if (eq.includes("TK") || eq.includes("COBAN") || eq.includes("103") || eq.includes("303")) {
      handleSelectModel("tk");
      toast("Modelo TK detectado", { icon: "📡" });
    } else if (eq.includes("GT") || eq.includes("CONCOX") || eq.includes("VL") || eq.includes("ET")) {
      handleSelectModel("gt");
      toast("Modelo GT detectado", { icon: "📡" });
    }
  };

  const handleClearVehiculo = () => {
    setVehiculoSeleccionado(null);
    setPlacaBusqueda("");
    setSimLocalNumber("");
  };

  // Filter commands by search and category
  const filteredCommands = useMemo(() => {
    return commandsForModel.filter((cmd) => {
      const matchesSearch =
        cmd.name.toLowerCase().includes(commandSearch.toLowerCase()) ||
        cmd.description.toLowerCase().includes(commandSearch.toLowerCase());
      const matchesCat = selectedCategory === "TODOS" || cmd.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [commandsForModel, commandSearch, selectedCategory]);

  // Compute final message text
  const assembledMessage = useMemo(() => {
    if (isCustomEdited) return customMessage;
    if (!selectedCommand) return "";

    let template = selectedCommand.rawTemplate;

    if (selectedCommand.params) {
      selectedCommand.params.forEach((param) => {
        const val = paramValues[param.key] ?? param.defaultValue ?? "";
        template = template.replace(new RegExp(`\\{${param.key}\\}`, "g"), val);
      });
    }

    if (selectedModel === "teltonika") {
      const login = teltonikaLogin.trim();
      const pass = teltonikaPass.trim();
      if (!login && !pass) {
        return `  ${template}`;
      } else if (login && pass) {
        return `${login} ${pass} ${template}`;
      } else {
        return ` ${pass || login} ${template}`;
      }
    } else if (selectedModel === "tk") {
      const pass = tkPass.trim() || "123456";
      return template.replace(/\{pass\}/g, pass);
    } else if (selectedModel === "gt") {
      if (!template.endsWith("#")) {
        template += "#";
      }
      return template;
    }

    return template;
  }, [
    isCustomEdited,
    customMessage,
    selectedCommand,
    paramValues,
    selectedModel,
    teltonikaLogin,
    teltonikaPass,
    tkPass,
  ]);

  // Guía del comando seleccionado. En readio/getparam cambia según el ID elegido.
  const ayuda = useMemo(
    () => obtenerAyuda(selectedCommand?.id, paramValues),
    [selectedCommand, paramValues]
  );

  const charCount = assembledMessage.length;
  const smsParts = charCount <= 160 ? 1 : Math.ceil(charCount / 153);

  // Send SMS handler (envía internamente con +51)
  const handleSendSms = async () => {
    if (!simLocalNumber || simLocalNumber.length < 9) {
      toast.error("Por favor ingresa los 9 dígitos del número celular peruano");
      return;
    }
    if (!assembledMessage.trim()) {
      toast.error("El comando a enviar está vacío");
      return;
    }

    const fullInternationalNumber = `+51${simLocalNumber}`;

    setIsSending(true);
    const toastId = toast.loading(`Enviando a ${fullInternationalNumber}...`);

    try {
      const res = await axios.post("/api/send-sms", {
        phoneNumber: fullInternationalNumber,
        message: assembledMessage,
        placa: vehiculoSeleccionado?.deviceID || placaBusqueda || undefined,
        model: selectedModel.toUpperCase(),
      });

      if (res.data.success) {
        toast.success("Comando enviado exitosamente ✅", { id: toastId });
        if (res.data.record) {
          const sentRecord: SentRecord = res.data.record;
          setHistory((prev) => {
            const updated = [sentRecord, ...prev.filter((r) => r.id !== sentRecord.id && isWithin12Hours(r.sentAt))].slice(0, 100);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
              } catch (e) {}
            }
            return updated;
          });
        }
        loadGatewayAndHistory();
      } else {
        toast.error(res.data.error || "Error al enviar SMS", { id: toastId });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Error al conectar con el Gateway";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSending(false);
      loadGatewayAndHistory();
    }
  };

  const handleCopyCommand = () => {
    if (!assembledMessage) return;
    navigator.clipboard.writeText(assembledMessage);
    toast.success("Comando copiado al portapapeles", { icon: "📋" });
  };

  const handleClearHistory = async () => {
    if (!confirm("¿Deseas limpiar el historial de conversación con los GPS?")) return;
    try {
      await axios.delete("/api/send-sms");
      setHistory([]);
      setIncomingLogs([]);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(STORAGE_KEY_HISTORY);
          localStorage.removeItem(STORAGE_KEY_INCOMING);
        } catch (e) {}
      }
      toast.success("Historial limpiado");
    } catch (err: any) {
      toast.error("Error al limpiar: " + err.message);
    }
  };

  const handleSaveWebhook = async () => {
    if (!webhookInputUrl.trim() || !webhookInputUrl.startsWith("https://")) {
      toast.error("Ingresa una URL pública válida que comience con https://");
      return;
    }
    const t = toast.loading("Registrando webhook en sms-gate.app...");
    try {
      const res = await axios.put("/api/gps-webhook", { url: webhookInputUrl.trim() });
      if (res.data.success) {
        toast.success("Webhook registrado con éxito en sms-gate.app", { id: t });
        loadGatewayAndHistory(true);
      } else {
        toast.error(res.data.error || "Error al registrar webhook", { id: t });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message, { id: t });
    }
  };

  const handleDeleteWebhook = async (id: string = "gps-respuestas") => {
    if (!confirm("¿Deseas eliminar este webhook de sms-gate.app?")) return;
    const t = toast.loading("Eliminando webhook...");
    try {
      const res = await axios.delete(`/api/gps-webhook?id=${id}`);
      if (res.data.success) {
        toast.success("Webhook eliminado de sms-gate.app", { id: t });
        loadGatewayAndHistory(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message, { id: t });
    }
  };

  return (
    <div
      className="flex flex-col text-[#F4F5F7]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER DE CONTROL                                          */}
      {/* ------------------------------------------------------------- */}
      <PanelHeader
        title={
          <span>
            Comandos SMS <span className="text-[#F05A28]">GPS</span>
          </span>
        }
        subtitle="Configuración remota y telemetría de unidades Teltonika, TK y GT"
        rightContent={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Badge Gateway API */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#161719] border border-[#26272B]">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#F05A28]/20 text-[#F05A28]">
                API
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-[#ECECEE] leading-none">Gateway SMS</span>
                <span className="text-[8px] text-[#76777C]">sms-gate.app</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  gatewayConfigured
                    ? "bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                }`}
              >
                {gatewayConfigured ? "ACTIVO" : "PENDIENTE"}
              </span>
            </div>

            {/* Badge Celular Módem (Dispositivo Físico) */}
            {deviceStatus && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#161719] border border-[#26272B]">
                <Smartphone size={14} className={deviceStatus.isOnline ? "text-[#4ADE80]" : "text-amber-400"} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#ECECEE] leading-none">
                    {deviceStatus.name.split("/")[0]} ({deviceStatus.carrier})
                  </span>
                  <span className="text-[8px] text-[#76777C]">
                    {deviceStatus.isOnline
                      ? "Conectado"
                      : `Standby (${deviceStatus.diffMinutes} min)`}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    deviceStatus.isOnline
                      ? "bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {deviceStatus.isOnline ? "EN LÍNEA" : "EN REPOSO"}
                </span>
              </div>
            )}

            {/* Switch: Crear Unidad en Automático */}
            <button
              type="button"
              onClick={() => setAutoWizardMode(!autoWizardMode)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                autoWizardMode
                  ? "bg-[#F05A28] text-white border-[#F05A28] shadow-[0_0_15px_rgba(240,90,40,0.35)]"
                  : "bg-[#161719] text-[#CFCFD3] border-[#26272B] hover:border-[#F05A28]/50 hover:text-white"
              }`}
            >
              <Sparkles size={13} className={autoWizardMode ? "text-white animate-pulse" : "text-[#F05A28]"} />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold leading-none">
                  Crear Unidad en automático
                </span>
                <span className={`text-[8px] leading-tight ${autoWizardMode ? "text-orange-100" : "text-[#76777C]"}`}>
                  {autoWizardMode ? "Asistente 1-Click Activo" : "Activar Pasarela"}
                </span>
              </div>
              {/* Pill Switch */}
              <div
                className={`w-7 h-3.5 rounded-full relative flex items-center p-0.5 transition-colors ${
                  autoWizardMode ? "bg-white/30" : "bg-[#121214]"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-transform ${
                    autoWizardMode ? "translate-x-3.5 bg-white" : "translate-x-0 bg-[#76777C]"
                  }`}
                />
              </div>
            </button>

            {/* Botón Webhook */}
            <button
              onClick={() => setShowWebhookModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161719] border border-[#26272B] text-[11px] font-semibold text-[#CFCFD3] hover:text-white hover:border-[#F05A28]/50 transition-all cursor-pointer"
            >
              <Radio size={13} className={registeredWebhooks && registeredWebhooks.length > 0 ? "text-[#4ADE80] animate-pulse" : "text-[#F05A28]"} />
              <span>Webhook Respuestas</span>
              {registeredWebhooks && registeredWebhooks.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]" />
              )}
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
      {autoWizardMode ? (
        <AutoUnitWizard
          role={role}
          actor={actor}
          onClose={() => setAutoWizardMode(false)}
          onUnitCreated={(newPlaca) => {
            loadVehiculos();
          }}
        />
      ) : (
        <>
          {/* ------------------------------------------------------------- */}
          {/* 2. SELECTOR DE MODELOS (TELTONIKA, TK, GT)                    */}
          {/* ------------------------------------------------------------- */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* MODELO 01: TELTONIKA */}
        <div
          onClick={() => handleSelectModel("teltonika")}
          className={`relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedModel === "teltonika"
              ? "bg-[#1C1714] border-2 border-[#F05A28] shadow-[0_0_20px_rgba(240,90,40,0.15)]"
              : "bg-[#161719] border border-[#26272B] hover:border-[#2D2E32] hover:bg-[#1D1E21]"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#9B9CA1]">
              MODELO 01
            </span>
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                selectedModel === "teltonika"
                  ? "bg-[#F05A28] text-white shadow-sm"
                  : "bg-[#121214] text-[#9B9CA1]"
              }`}
            >
              T
            </div>
          </div>
          <h2 className="text-sm font-bold text-[#ECECEE] mt-0.5 mb-0.5">Teltonika</h2>
          <p className="text-[11px] text-[#9B9CA1] line-clamp-1 mb-1.5">
            FMB920, FMB120, FMC920 y compatibles
          </p>
          <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-[#26272B]">
            <span className="text-[#9B9CA1] font-mono">{TELTONIKA_COMMANDS.length} comandos</span>
            <span
              className={`text-[9px] font-bold tracking-wider uppercase ${
                selectedModel === "teltonika" ? "text-[#F05A28]" : "text-[#76777C]"
              }`}
            >
              {selectedModel === "teltonika" ? "SELECCIONADO" : "Disponible"}
            </span>
          </div>
        </div>

        {/* MODELO 02: TK */}
        <div
          onClick={() => handleSelectModel("tk")}
          className={`relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedModel === "tk"
              ? "bg-[#1C1714] border-2 border-[#F05A28] shadow-[0_0_20px_rgba(240,90,40,0.15)]"
              : "bg-[#161719] border border-[#26272B] hover:border-[#2D2E32] hover:bg-[#1D1E21]"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#9B9CA1]">
              MODELO 02
            </span>
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                selectedModel === "tk"
                  ? "bg-[#F05A28] text-white shadow-sm"
                  : "bg-[#121214] text-[#9B9CA1]"
              }`}
            >
              K
            </div>
          </div>
          <h2 className="text-sm font-bold text-[#ECECEE] mt-0.5 mb-0.5">TK / Coban</h2>
          <p className="text-[11px] text-[#9B9CA1] line-clamp-1 mb-1.5">
            TK103, TK102, TK303 y familia Coban
          </p>
          <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-[#26272B]">
            <span className="text-[#9B9CA1] font-mono">{TK_COMMANDS.length} comandos</span>
            <span
              className={`text-[9px] font-bold tracking-wider uppercase ${
                selectedModel === "tk" ? "text-[#F05A28]" : "text-[#76777C]"
              }`}
            >
              {selectedModel === "tk" ? "SELECCIONADO" : "Disponible"}
            </span>
          </div>
        </div>

        {/* MODELO 03: GT */}
        <div
          onClick={() => handleSelectModel("gt")}
          className={`relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedModel === "gt"
              ? "bg-[#1C1714] border-2 border-[#F05A28] shadow-[0_0_20px_rgba(240,90,40,0.15)]"
              : "bg-[#161719] border border-[#26272B] hover:border-[#2D2E32] hover:bg-[#1D1E21]"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#9B9CA1]">
              MODELO 03
            </span>
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                selectedModel === "gt"
                  ? "bg-[#F05A28] text-white shadow-sm"
                  : "bg-[#121214] text-[#9B9CA1]"
              }`}
            >
              G
            </div>
          </div>
          <h2 className="text-sm font-bold text-[#ECECEE] mt-0.5 mb-0.5">GT / Concox</h2>
          <p className="text-[11px] text-[#9B9CA1] line-clamp-1 mb-1.5">
            GT06N, Concox, VL03, ET200 y clones
          </p>
          <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-[#26272B]">
            <span className="text-[#9B9CA1] font-mono">{GT_COMMANDS.length} comandos</span>
            <span
              className={`text-[9px] font-bold tracking-wider uppercase ${
                selectedModel === "gt" ? "text-[#F05A28]" : "text-[#76777C]"
              }`}
            >
              {selectedModel === "gt" ? "SELECCIONADO" : "Disponible"}
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. WORKSPACE PRINCIPAL: CONFIGURADOR EN 2 COLUMNAS            */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* ========================================================= */}
        {/* COLUMNA IZQUIERDA: DESTINO Y ENVÍO                        */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* BLOQUE: DESTINO Y ACCESO */}
          <div className="bg-[#161719] border border-[#26272B] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Car size={15} className="text-[#F05A28]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9B9CA1] m-0">
                Destino y Acceso de la Unidad
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {/* Buscador de Placa */}
              <div ref={searchBoxRef} className="relative">
                <label className="block text-xs font-semibold text-[#ECECEE] mb-1.5">
                  Buscar Placa de la Unidad
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Escribe placa (ej: C8Z, ABC)..."
                    value={placaBusqueda}
                    onChange={(e) => {
                      setPlacaBusqueda(e.target.value);
                      setShowPlacaDropdown(true);
                    }}
                    onFocus={() => setShowPlacaDropdown(true)}
                    className="w-full bg-[#121214] border border-[#2D2E32] rounded-lg px-3 py-2 pr-8 text-xs text-[#ECECEE] placeholder-[#76777C] outline-none focus:border-[#F05A28] transition-all"
                  />
                  <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#76777C]" />
                </div>

                {/* Dropdown flotante */}
                {showPlacaDropdown && vehiculosFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#161719] border border-[#26272B] rounded-xl z-50 max-h-48 overflow-y-auto shadow-2xl custom-scrollbar">
                    {vehiculosFiltrados.map((v) => (
                      <div
                        key={`${v.accountID}_${v.deviceID}`}
                        onClick={() => handleSelectVehiculo(v)}
                        className="p-2.5 border-b border-[#222327] hover:bg-[#1D1E21] cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#F05A28] font-mono">{v.deviceID}</span>
                            <span className="text-[10px] text-[#9B9CA1] font-medium">({v.accountID})</span>
                          </div>
                          <span className="text-[11px] text-[#9B9CA1] block mt-0.5 font-mono">
                            SIM: {v.simPhoneNumber || "Sin SIM"} • {v.equipmentType || "GPS"}
                          </span>
                        </div>
                        <ChevronRight size={13} className="text-[#76777C]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* INPUT NÚMERO SIM CON PREFIJO +51 FIJO */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[#ECECEE]">
                    Número de la SIM (Perú)
                  </label>
                  <span className="text-[10px] text-[#9B9CA1] font-mono">
                    {simLocalNumber.length === 9 ? "✓ 9 dígitos" : `${simLocalNumber.length}/9`}
                  </span>
                </div>

                <div className="flex items-center bg-[#121214] border border-[#2D2E32] rounded-lg overflow-hidden focus-within:border-[#F05A28] transition-colors">
                  {/* Badge +51 PERÚ FIJO */}
                  <div className="flex items-center gap-1 px-2.5 py-2 bg-[#1A1210] border-r border-[#5A2A18] select-none flex-shrink-0">
                    <span className="text-xs">🇵🇪</span>
                    <span className="text-xs font-bold text-[#F05A28] tracking-wide">+51</span>
                  </div>

                  {/* Campo editable de 9 dígitos */}
                  <input
                    type="tel"
                    placeholder="900 000 000"
                    value={formatPeruPhone(simLocalNumber)}
                    onChange={(e) => handleSimNumberChange(e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-xs text-[#ECECEE] font-mono font-medium tracking-wider outline-none placeholder-[#76777C]"
                  />
                  {simLocalNumber && (
                    <button
                      type="button"
                      onClick={() => setSimLocalNumber("")}
                      className="p-1.5 text-[#76777C] hover:text-[#ECECEE] transition-colors cursor-pointer mr-1"
                      title="Borrar número"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Ficha de vehículo seleccionado si existe */}
            {vehiculoSeleccionado && (
              <div className="mt-3 p-2.5 rounded-lg bg-[#1A1210] border border-[#5A2A18] flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-[#251814] border border-[#5A2A18] flex items-center justify-center text-[#F05A28]">
                    <Car size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#ECECEE] font-mono">{vehiculoSeleccionado.deviceID}</span>
                      <span className="text-[10px] bg-[#121214] border border-[#26272B] px-1.5 py-0.5 rounded text-[#CFCFD3] font-medium">
                        {vehiculoSeleccionado.equipmentType || "GPS"}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#9B9CA1]">Cliente: {vehiculoSeleccionado.accountID}</span>
                  </div>
                </div>
                <button
                  onClick={handleClearVehiculo}
                  className="p-1 text-[#76777C] hover:text-red-400 hover:bg-[#251814] rounded transition-colors cursor-pointer"
                  title="Quitar selección"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Clave según modelo */}
            <div className="mt-3 pt-3 border-t border-[#26272B] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedModel === "teltonika" ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#9B9CA1] mb-1">Login SMS (Opcional)</label>
                    <input
                      type="text"
                      placeholder="ej. admin"
                      value={teltonikaLogin}
                      onChange={(e) => setTeltonikaLogin(e.target.value)}
                      className="w-full bg-[#121214] border border-[#2D2E32] rounded-lg px-2.5 py-1.5 text-xs text-[#ECECEE] placeholder-[#76777C] outline-none focus:border-[#F05A28]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#9B9CA1] mb-1">Password SMS (Opcional)</label>
                    <input
                      type="text"
                      placeholder="ej. 123456"
                      value={teltonikaPass}
                      onChange={(e) => setTeltonikaPass(e.target.value)}
                      className="w-full bg-[#121214] border border-[#2D2E32] rounded-lg px-2.5 py-1.5 text-xs text-[#ECECEE] placeholder-[#76777C] outline-none focus:border-[#F05A28]"
                    />
                  </div>
                </>
              ) : selectedModel === "tk" ? (
                <div>
                  <label className="block text-[11px] font-semibold text-[#9B9CA1] mb-1">Password (Fábrica: 123456)</label>
                  <input
                    type="text"
                    value={tkPass}
                    onChange={(e) => setTkPass(e.target.value)}
                    className="w-full bg-[#121214] border border-[#2D2E32] rounded-lg px-2.5 py-1.5 text-xs text-[#ECECEE] font-mono outline-none focus:border-[#F05A28]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-[#9B9CA1] mb-1">Password de Fábrica</label>
                  <input
                    type="text"
                    value={gtPass}
                    onChange={(e) => setGtPass(e.target.value)}
                    className="w-full bg-[#121214] border border-[#2D2E32] rounded-lg px-2.5 py-1.5 text-xs text-[#ECECEE] font-mono outline-none focus:border-[#F05A28]"
                  />
                </div>
              )}

              {/* Nota de modelo */}
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#121214] border border-[#26272B] text-[11px] text-[#9B9CA1] sm:col-span-2">
                <Info size={14} className="text-[#F05A28] flex-shrink-0" />
                <span>
                  {selectedModel === "teltonika" && "Teltonika agrega 2 espacios automáticos si no hay login/pass."}
                  {selectedModel === "tk" && "TK103 integra la contraseña de 6 dígitos en cada comando."}
                  {selectedModel === "gt" && "Los GT06 terminan obligatoriamente con «#»."}
                </span>
              </div>
            </div>
          </div>

          {/* BLOQUE: MENSAJE FINAL A ENVIAR */}
          <div className="bg-[#161719] border border-[#26272B] rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9B9CA1]">
                Comando ensamblado a enviar
              </span>
              {isCustomEdited && (
                <button
                  onClick={() => setIsCustomEdited(false)}
                  className="text-[11px] font-semibold text-[#F05A28] hover:underline cursor-pointer"
                >
                  Restaurar automático
                </button>
              )}
            </div>

            {/* Caja Monospace estilizada */}
            <div className="relative bg-[#121214] border border-[#2D2E32] rounded-lg p-2.5 focus-within:border-[#F05A28] transition-colors">
              <textarea
                value={assembledMessage}
                onChange={(e) => {
                  setCustomMessage(e.target.value);
                  setIsCustomEdited(true);
                }}
                rows={2}
                placeholder="El comando ensamblado aparecerá aquí..."
                className="w-full bg-transparent border-none outline-none text-[#ECECEE] font-mono text-xs font-medium resize-none placeholder-[#76777C]"
              />
            </div>

            {/* Footer de envío */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <span className="text-[11px] text-[#9B9CA1] font-mono">
                <strong>{charCount}</strong> car. • <strong>{smsParts}</strong> SMS
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCommand}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121214] border border-[#2D2E32] text-xs font-semibold text-[#CFCFD3] hover:text-[#ECECEE] hover:border-[#F05A28] transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copiar</span>
                </button>

                <button
                  onClick={handleSendSms}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#F05A28] hover:bg-[#FF6A35] active:scale-95 transition-all cursor-pointer shadow"
                >
                  <Send size={13} className={isSending ? "animate-spin" : ""} />
                  <span>{isSending ? "Enviando..." : "Enviar SMS al GPS"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMNA DERECHA: CATÁLOGO DE COMANDOS                     */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* BLOQUE: CATÁLOGO DE COMANDOS */}
          <div className="bg-[#161719] border border-[#26272B] rounded-xl p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sliders size={14} className="text-[#F05A28]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#9B9CA1] m-0">
                  Comandos {selectedModel.toUpperCase()}
                </h2>
              </div>

              {/* Filtros de Categoría */}
              <div className="flex items-center gap-1 bg-[#121214] p-0.5 rounded-[8px] border border-[#26272B]">
                {(["TODOS", "LECTURA", "CONFIG", "CRÍTICO"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? "bg-[#F05A28] text-white"
                        : "text-[#9B9CA1] hover:text-[#ECECEE]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Buscador de comando */}
              <div className="relative w-full sm:w-48">
                <input
                  type="text"
                  placeholder="Buscar comando..."
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  className="w-full bg-[#121214] border border-[#2D2E32] rounded-[8px] px-2.5 py-1 pr-7 text-xs text-[#ECECEE] placeholder:text-[#76777C] outline-none focus:border-[#F05A28]"
                />
                <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#76777C]" />
              </div>
            </div>

            {/* Grid de Comandos con Scroll Suave */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredCommands.map((cmd) => {
                const isSelected = selectedCommand?.id === cmd.id;
                const catColor =
                  cmd.category === "LECTURA"
                    ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
                    : cmd.category === "CONFIG"
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/20";

                return (
                  <div
                    key={cmd.id}
                    onClick={() => handleSelectCommand(cmd)}
                    className={`p-2 rounded-[8px] cursor-pointer transition-all duration-150 flex flex-col justify-between gap-1 ${
                      isSelected
                        ? "bg-[#1C1714] border border-[#8A3A1C]"
                        : "bg-[#121214] border border-[#26272B] hover:border-[#3A3B40] hover:bg-[#1D1E21]"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1.5">
                      <span className={`text-xs font-bold break-all ${isSelected ? "text-[#F05A28]" : "text-[#ECECEE]"}`}>
                        {cmd.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase flex-shrink-0 ${catColor}`}>
                        {cmd.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9B9CA1] leading-tight line-clamp-1 m-0">
                      {cmd.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Panel de Parámetros Dinámicos si el comando los requiere */}
            {selectedCommand?.params && selectedCommand.params.length > 0 && (
              <div className="mt-2.5 p-2.5 rounded-[8px] bg-[#121214] border border-[#26272B] flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#F05A28]" />
                  <span className="text-xs font-bold uppercase tracking-wide text-[#ECECEE]">
                    Parámetros para: <code className="text-[#F05A28] font-semibold">{selectedCommand.name}</code>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCommand.params.map((param) => (
                    <div key={param.key}>
                      <label className="block text-[11px] font-semibold text-[#CFCFD3] mb-0.5">
                        {param.label}
                      </label>
                      <input
                        type="text"
                        placeholder={param.placeholder}
                        value={paramValues[param.key] ?? param.defaultValue}
                        onChange={(e) => {
                          setParamValues({ ...paramValues, [param.key]: e.target.value });
                          setIsCustomEdited(false);
                        }}
                        className="w-full bg-[#161719] border border-[#2D2E32] rounded-[8px] px-2.5 py-1 text-xs text-[#ECECEE] font-mono outline-none focus:border-[#F05A28]"
                      />

                      {/* Chips rápidos de sugerencias (APNs de Perú, Servidores Linux 1 y 2, etc.) */}
                      {param.quickOptions && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {param.quickOptions.map((optItem, idx) => {
                            const optValue = typeof optItem === "string" ? optItem : optItem.value;
                            const optLabel = typeof optItem === "string" ? optItem : optItem.label;
                            const isSelected = (paramValues[param.key] ?? param.defaultValue) === optValue;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setParamValues({ ...paramValues, [param.key]: optValue });
                                  setIsCustomEdited(false);
                                }}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer border transition-colors ${
                                  isSelected
                                    ? "bg-[#1C1714] text-[#F05A28] border-[#8A3A1C]"
                                    : "bg-[#161719] text-[#9B9CA1] border-[#26272B] hover:text-[#ECECEE]"
                                }`}
                              >
                                {optLabel}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )}

      {/* ------------------------------------------------------------- */}
      {/* 4. CONSOLA DE TELEMETRÍA Y RESPUESTAS GPS (FULL WIDTH)         */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-[#161719] border border-[#26272B] rounded-xl p-3.5 flex flex-col gap-2.5">
        {/* Cabecera de la Consola */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#222327]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-[#1A1210] border border-[#5A2A18] flex items-center justify-center text-[#F05A28]">
              <Terminal size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#ECECEE] m-0">
                Consola de Telemetría y Respuestas GPS
              </h2>
              <p className="text-[11px] text-[#9B9CA1] mt-0.5 m-0 leading-tight">
                Historial de comandos y respuestas devueltas por los módems GPS vía Webhook
              </p>
            </div>
          </div>

          {/* Acciones y Pestañas de la Consola */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Pestañas: Enviados vs Entrantes */}
            <div className="flex items-center bg-[#121214] p-0.5 rounded-[8px] border border-[#26272B]">
              <button
                onClick={() => setConsoleTab("sent")}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-bold cursor-pointer transition-all ${
                  consoleTab === "sent"
                    ? "bg-[#F05A28] text-white"
                    : "text-[#9B9CA1] hover:text-[#ECECEE]"
                }`}
              >
                Comandos ({history.length})
              </button>
              <button
                onClick={() => setConsoleTab("incoming")}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-bold cursor-pointer transition-all ${
                  consoleTab === "incoming"
                    ? "bg-[#F05A28] text-white"
                    : "text-[#9B9CA1] hover:text-[#ECECEE]"
                }`}
              >
                SMS Recibidos ({incomingLogs.length})
              </button>
            </div>

            <button
              onClick={() => loadGatewayAndHistory(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[#121214] hover:bg-[#1D1E21] border border-[#2D2E32] text-xs font-semibold text-[#CFCFD3] hover:text-white transition-colors cursor-pointer"
              title="Actualizar registro"
            >
              <RefreshCw size={12} />
              <span>Actualizar</span>
            </button>

            {(history.length > 0 || incomingLogs.length > 0) && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-400 transition-colors cursor-pointer"
                title="Limpiar historial"
              >
                <Trash2 size={12} />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Listado de Tarjetas: Enviados (sent) */}
        {consoleTab === "sent" && (
          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
            {history.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-[#76777C]">
                <div className="w-8 h-8 rounded-[8px] bg-[#121214] border border-[#26272B] flex items-center justify-center text-[#76777C] mb-2">
                  <MessageSquare size={16} />
                </div>
                <span className="text-xs font-bold text-[#CFCFD3]">Sin Comandos Enviados</span>
                <p className="text-[11px] text-[#76777C] mt-0.5 max-w-sm">
                  Selecciona un comando y presiona <strong>Enviar SMS al GPS</strong>. Las respuestas aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              history.map((item) => {
                const hasResponse = !!item.response;
                const mapsUrlMatch = item.response?.message.match(/(https?:\/\/[^\s]+)/g);
                const mapsUrl = mapsUrlMatch ? mapsUrlMatch[0] : null;

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-[8px] border transition-all ${
                      hasResponse
                        ? "bg-[#121214] border-emerald-500/30"
                        : item.status === "failed"
                        ? "bg-[#161214] border-rose-500/30"
                        : "bg-[#121214] border-[#26272B]"
                    }`}
                  >
                    {/* Encabezado del Registro */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-[#222327]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Estado */}
                        {hasResponse ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 uppercase">
                            <CheckCircle2 size={11} />
                            Respuesta Recibida
                          </span>
                        ) : item.status === "failed" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/15 border border-rose-500/40 text-rose-300 uppercase">
                            Falló el Envío
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            Esperando GPS
                          </span>
                        )}

                        {/* Placa si existe */}
                        {item.placa && (
                          <span className="text-[10px] font-bold bg-[#1C1714] border border-[#8A3A1C] text-[#F05A28] px-1.5 py-0.2 rounded">
                            {item.placa}
                          </span>
                        )}

                        {/* Número destino */}
                        <span className="text-xs font-semibold text-[#ECECEE] font-mono">
                          {item.phoneNumber}
                        </span>

                        {/* Modelo */}
                        {item.model && (
                          <span className="text-[10px] font-bold text-[#9B9CA1] bg-[#161719] border border-[#26272B] px-1.5 py-0.2 rounded uppercase">
                            {item.model}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-[#76777C] font-mono">
                        {new Date(item.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </span>
                    </div>

                    {/* Cuerpo: Comando Enviado y Respuesta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {/* Comando Enviado */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9B9CA1]">
                          Comando Enviado
                        </span>
                        <div className="bg-[#161719] border border-[#26272B] rounded-[8px] p-2 flex justify-between items-start gap-1.5">
                          <code className="text-xs font-mono text-[#ECECEE] font-medium break-all leading-relaxed">
                            {item.message}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.message);
                              toast.success("Comando copiado");
                            }}
                            className="text-[#76777C] hover:text-[#ECECEE] p-0.5 transition-colors cursor-pointer flex-shrink-0"
                            title="Copiar comando"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Respuesta Recibida */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9B9CA1]">
                            Respuesta del Dispositivo GPS
                          </span>
                          {item.response && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              {new Date(item.response.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {hasResponse ? (
                          <div className="bg-emerald-950/25 border border-emerald-500/35 rounded-[8px] p-2 flex flex-col gap-1.5">
                            <code className="text-xs font-mono text-emerald-300 font-medium break-all leading-relaxed">
                              {item.response?.message}
                            </code>

                            {mapsUrl && (
                              <div>
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors no-underline"
                                >
                                  <span>Abrir en Maps</span>
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            )}
                          </div>
                        ) : item.status === "failed" ? (
                          <div className="bg-rose-950/20 border border-rose-500/30 rounded-[8px] p-2 text-xs text-rose-300">
                            {item.error || "No se pudo entregar el mensaje al módem"}
                          </div>
                        ) : (
                          <div className="bg-[#161719] border border-dashed border-[#26272B] rounded-[8px] p-2 text-xs text-[#76777C] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Esperando respuesta vía SMS del dispositivo GPS...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Listado de Tarjetas: Mensajes Entrantes vía Webhook (incoming) */}
        {consoleTab === "incoming" && (
          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
            {incomingLogs.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-[#76777C]">
                <div className="w-8 h-8 rounded-[8px] bg-[#121214] border border-[#26272B] flex items-center justify-center text-[#76777C] mb-2">
                  <Radio size={16} />
                </div>
                <span className="text-xs font-bold text-[#CFCFD3]">Sin Mensajes Entrantes Registrados</span>
                <p className="text-[11px] text-[#76777C] mt-0.5 max-w-sm">
                  Cuando un GPS o número telefónico responda un SMS al celular del módem, la notificación aparecerá aquí inmediatamente vía Webhook.
                </p>
              </div>
            ) : (
              incomingLogs.map((inc) => {
                const mapsUrlMatch = inc.message.match(/(https?:\/\/[^\s]+)/g);
                const mapsUrl = mapsUrlMatch ? mapsUrlMatch[0] : null;
                const cleanDigits = (inc.sender || "").replace(/[^0-9]/g, "");
                const peruvian9 = cleanDigits.slice(-9);

                return (
                  <div
                    key={inc.id}
                    className="p-2.5 rounded-[8px] border border-[#26272B] bg-[#121214] flex flex-col gap-2 hover:border-[#3A3B40] transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-[#222327]">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Check size={11} />
                          SMS RECIBIDO
                        </span>

                        <span className="text-xs font-mono font-bold text-[#ECECEE]">
                          {inc.sender}
                        </span>

                        {inc.matchedRecordId && (
                          <span className="text-[10px] font-semibold bg-[#161719] border border-[#26272B] text-[#9B9CA1] px-1.5 py-0.2 rounded">
                            Vinculado a comando
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#76777C]">
                          {new Date(inc.receivedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                        </span>

                        {/* Botón para cargar número en el panel de envío */}
                        <button
                          onClick={() => {
                            if (peruvian9.length === 9) {
                              setSimLocalNumber(peruvian9);
                              toast.success(`Número +51 ${peruvian9} cargado en el panel de comandos`, { icon: "📱" });
                            }
                          }}
                          className="px-2 py-0.5 rounded-[6px] bg-[#161719] hover:bg-[#1D1E21] border border-[#2D2E32] text-[#CFCFD3] hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                          title="Cargar número para enviarle un comando"
                        >
                          Cargar Número
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#161719] border border-[#26272B] rounded-[8px] p-2 flex justify-between items-start gap-2">
                      <code className="text-xs font-mono text-emerald-300 font-medium break-all leading-relaxed">
                        {inc.message}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inc.message);
                          toast.success("Mensaje copiado");
                        }}
                        className="text-[#76777C] hover:text-[#ECECEE] p-0.5 transition-colors cursor-pointer flex-shrink-0"
                        title="Copiar contenido"
                      >
                        <Copy size={12} />
                      </button>
                    </div>

                    {mapsUrl && (
                      <div>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors no-underline"
                        >
                          <span>Abrir en Maps</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL DE CONFIGURACIÓN DE WEBHOOK RESPUESTAS                */}
      {/* ------------------------------------------------------------- */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161719] border border-[#26272B] rounded-[12px] max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[7px] bg-[#1A1210] border border-[#5A2A18] flex items-center justify-center text-[#F05A28]">
                  <Radio size={16} />
                </div>
                <h2 className="text-sm font-bold text-[#ECECEE] m-0">Webhook de Respuestas SMS</h2>
              </div>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="text-[#76777C] hover:text-[#ECECEE] cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Estado del webhook */}
            <div
              className={`p-3.5 rounded-[8px] border flex flex-col gap-2 ${
                registeredWebhooks === null
                  ? "bg-[#121214] border-[#26272B] text-[#9B9CA1]"
                  : registeredWebhooks.length > 0
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-950/20 border-amber-500/30 text-amber-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold tracking-wide flex items-center gap-2">
                  {registeredWebhooks === null ? (
                    <>
                      <RefreshCw size={13} className="animate-spin text-[#F05A28]" />
                      <span>CONSULTANDO ESTADO EN SMS-GATE.APP...</span>
                    </>
                  ) : registeredWebhooks.length > 0 ? (
                    "🟢 WEBHOOK ACTIVO EN SMS-GATE.APP"
                  ) : (
                    "⚠️ SIN WEBHOOK REGISTRADO EN SMS-GATE.APP"
                  )}
                </span>
                {registeredWebhooks && registeredWebhooks.length > 0 && (
                  <button
                    onClick={() => handleDeleteWebhook(registeredWebhooks[0]?.id || "gps-respuestas")}
                    className="px-2.5 py-1 rounded-[6px] bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                  >
                    Eliminar Webhook
                  </button>
                )}
              </div>

              {registeredWebhooks === null ? (
                <p className="text-xs text-[#76777C] m-0">
                  Verificando conexión con el servidor del SMS Gateway...
                </p>
              ) : registeredWebhooks.length > 0 ? (
                <div className="text-xs text-[#ECECEE] mt-1">
                  <p className="font-mono text-[11px] break-all m-0">
                    URL: <strong>{registeredWebhooks[0]?.url}</strong>
                  </p>
                  <span className="text-[10px] text-[#76777C] mt-1 block">
                    Evento suscrito: {registeredWebhooks[0]?.event || "sms:received"}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-[#CFCFD3] m-0">
                  sms-gate.app no tiene ninguna URL registrada donde enviar las respuestas que recibe tu celular.
                </p>
              )}
            </div>

            {/* Input URL */}
            <div>
              <label className="block text-xs font-semibold text-[#CFCFD3] mb-1.5">
                URL Pública del Webhook (debe iniciar con https://):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://tu-dominio.com/api/gps-webhook"
                  value={webhookInputUrl}
                  onChange={(e) => setWebhookInputUrl(e.target.value)}
                  className="flex-1 bg-[#121214] border border-[#2D2E32] rounded-[8px] px-3 py-2 text-xs text-[#ECECEE] font-mono outline-none focus:border-[#F05A28]"
                />
                <button
                  onClick={handleSaveWebhook}
                  className="px-4 py-2 rounded-[8px] bg-[#F05A28] hover:bg-[#FF6A35] text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
                >
                  Registrar (1 Clic)
                </button>
              </div>
              <span className="text-[10px] text-[#76777C] mt-1 block">
                En producción usa tu enlace de Vercel (ej: <code>https://tu-app.vercel.app/api/gps-webhook</code>).
              </span>
            </div>

            {/* Ayuda */}
            <div className="p-3 rounded-[8px] bg-[#121214] border border-[#26272B] text-xs text-[#9B9CA1]">
              <span className="font-bold text-[#F05A28] block mb-1">💡 ¿Cómo funciona en producción?</span>
              <p className="m-0 leading-relaxed text-[11px]">
                Cuando subas tu web a Vercel, abres este modal, pegas tu URL con <code>/api/gps-webhook</code> y presionas <strong>Registrar</strong>. Quedará activo de forma permanente sin necesidad de terminales.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowWebhookModal(false)}
                className="px-4 py-2 rounded-[8px] bg-[#121214] hover:bg-[#1D1E21] border border-[#2D2E32] text-xs font-semibold text-[#ECECEE] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. GUÍA DEL COMANDO SELECCIONADO (abajo a la izquierda)        */}
      {/* ------------------------------------------------------------- */}
      {selectedCommand && (ayuda.general || ayuda.especifica) && (
        mostrarAyuda ? (
          <aside className="fixed bottom-4 right-4 z-40 w-[400px] max-w-[calc(100vw-290px)] max-h-[64vh] overflow-y-auto velsat-scroll bg-[#181C24] border border-[#343B4A] rounded-[12px] shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
            <div className="sticky top-0 bg-[#1E2330] border-b border-[#343B4A] px-3.5 py-2.5 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-[7px] bg-[#1A1210] border border-[#5A2A18] flex items-center justify-center text-[#F05A28] flex-shrink-0">
                  <BookOpen size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#ECECEE] m-0 leading-tight">
                    ¿Qué hace este comando?
                  </p>
                  <p className="text-[11px] font-mono text-[#F05A28] m-0 truncate leading-tight">
                    {assembledMessage || selectedCommand.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMostrarAyuda(false)}
                title="Ocultar la guía"
                className="text-[#76777C] hover:text-[#ECECEE] transition-colors cursor-pointer flex-shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-3.5 flex flex-col gap-3.5">
              {ayuda.general && <BloqueAyuda ayuda={ayuda.general} />}
              {ayuda.especifica && (
                <div className="pt-3 border-t border-[#343B4A] flex flex-col gap-3.5">
                  <BloqueAyuda ayuda={ayuda.especifica} destacado />
                </div>
              )}
            </div>
          </aside>
        ) : (
          <button
            onClick={() => setMostrarAyuda(true)}
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#181C24] border border-[#343B4A] text-[12px] text-[#CFD3DC] hover:text-[#ECECEE] hover:border-[#4A5365] shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors cursor-pointer"
          >
            <Info size={14} className="text-[#F05A28]" />
            ¿Qué hace <span className="font-mono text-[#ECECEE]">{selectedCommand.name}</span>?
          </button>
        )
      )}
    </div>
  );
}



// ---------------------------------------------------------------------------
// Bloque de la guía: para qué sirve, qué responde, ejemplo y cómo leerlo
// ---------------------------------------------------------------------------
function BloqueAyuda({ ayuda, destacado = false }: { ayuda: AyudaComando; destacado?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider m-0 mb-1 ${destacado ? "text-[#F05A28]" : "text-[#76777C]"}`}>
          {destacado ? "Sobre la opción elegida" : "Para qué sirve"}
        </p>
        <p className="text-[12.5px] text-[#D4D8E0] m-0 leading-relaxed">{ayuda.paraQue}</p>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B93A3] m-0 mb-1">
          Qué te va a responder
        </p>
        <p className="text-[12.5px] text-[#D4D8E0] m-0 leading-relaxed">{ayuda.queResponde}</p>
      </div>

      {ayuda.ejemplo && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B93A3] m-0 mb-1">
            Ejemplo de respuesta
          </p>
          <pre className="text-[11.5px] font-mono text-[#5EE89B] bg-[#10131A] border border-[#2B3140] rounded-[8px] p-2.5 m-0 whitespace-pre-wrap break-words leading-relaxed">
            {ayuda.ejemplo}
          </pre>
        </div>
      )}

      {ayuda.lectura && ayuda.lectura.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B93A3] m-0 mb-1.5">
            Cómo leerlo
          </p>
          <div className="flex flex-col gap-1.5">
            {ayuda.lectura.map((l) => (
              <div key={l.campo} className="flex gap-2 items-start">
                <span className="text-[11px] font-mono font-bold text-[#FF8A5B] bg-[#241A16] border border-[#5A2A18] rounded-[5px] px-1.5 py-0.5 flex-shrink-0">
                  {l.campo}
                </span>
                <span className="text-[12px] text-[#AEB5C2] leading-snug pt-0.5">{l.significado}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ayuda.ojo && (
        <div className="flex gap-2 items-start p-2.5 rounded-[8px] bg-[#2A2116] border border-[#6B4A1E]">
          <AlertTriangle size={14} className="text-[#F0A028] flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#E3C9A8] m-0 leading-relaxed">{ayuda.ojo}</p>
        </div>
      )}
    </div>
  );
}
