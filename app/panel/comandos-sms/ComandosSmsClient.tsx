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
} from "lucide-react";
import toast from "react-hot-toast";
import { Vehiculo } from "@/app/interfaces/vehiculo.interface";
import { Role } from "@/app/constants/roles";
import { getUnidadesApi } from "@/app/services/unidadesApi";
import AutoUnitWizard from "./AutoUnitWizard";

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
    description: "Estado de una IO específica por su ID (ej. 1 = ignición, 21 = batería)",
    params: [
      { key: "id", label: "ID de Entrada/Salida (IO)", placeholder: "1", defaultValue: "1", quickOptions: ["1", "21", "66", "179"] },
    ],
  },
  {
    id: "t_getparam",
    name: "getparam",
    rawTemplate: "getparam {id}",
    category: "LECTURA",
    description: "Devuelve el valor de un parámetro del equipo por su ID",
    params: [
      { key: "id", label: "ID del Parámetro", placeholder: "2001", defaultValue: "2001", quickOptions: ["2001", "2004", "2005", "2006"] },
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

  // Gateway & Execution state
  const [gatewayConfigured, setGatewayConfigured] = useState<boolean | null>(null);
  const [gatewayUser, setGatewayUser] = useState<string | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);

  // History & Webhook responses (Auto-clean after 12 hours)
  const STORAGE_KEY_HISTORY = "velsat_sms_history";
  const STORAGE_KEY_INCOMING = "velsat_sms_incoming";
  const MAX_SMS_RETENTION_MS = 12 * 60 * 60 * 1000; // 12 horas

  const isWithin12Hours = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return !isNaN(t) && Date.now() - t < MAX_SMS_RETENTION_MS;
  };

  const [history, setHistory] = useState<SentRecord[]>([]);
  const [incomingLogs, setIncomingLogs] = useState<WebhookLog[]>([]);
  const [consoleTab, setConsoleTab] = useState<"sent" | "incoming">("sent");
  const [registeredWebhooks, setRegisteredWebhooks] = useState<any[]>([]);
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
      } catch (err) {
        console.error("Error al cargar historial local de SMS:", err);
      }
    }
  }, []);

  // Vehicles list from api
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Fetch Vehicles from server API (same as /panel/unidades)
  const loadVehiculos = async () => {
    setLoadingVehiculos(true);
    try {
      const api = getUnidadesApi(role);
      const res = await axios.get<Vehiculo[]>(api.list);
      if (Array.isArray(res.data)) {
        setVehiculos(res.data);
      }
    } catch (err) {
      console.error("Error al cargar unidades para SMS:", err);
    } finally {
      setLoadingVehiculos(false);
    }
  };

  useEffect(() => {
    loadVehiculos();
  }, [role]);

  // Load gateway status, history and active webhooks (merging with localStorage & auto-cleaning > 12h)
  const loadGatewayAndHistory = async () => {
    try {
      const [sendRes, webhookRes] = await Promise.allSettled([
        axios.get("/api/send-sms"),
        axios.get("/api/gps-webhook"),
      ]);

      let serverRecords: SentRecord[] = [];
      let serverIncoming: WebhookLog[] = [];

      if (sendRes.status === "fulfilled" && sendRes.value.data) {
        setGatewayConfigured(sendRes.value.data.configured);
        setGatewayUser(sendRes.value.data.gatewayUser);
        if (sendRes.value.data.deviceStatus) {
          setDeviceStatus(sendRes.value.data.deviceStatus);
        }
        if (Array.isArray(sendRes.value.data.history)) {
          serverRecords = sendRes.value.data.history;
        }
        if (Array.isArray(sendRes.value.data.incoming)) {
          serverIncoming = [...serverIncoming, ...sendRes.value.data.incoming];
        }
      }

      if (webhookRes.status === "fulfilled" && webhookRes.value.data) {
        if (Array.isArray(webhookRes.value.data.records)) {
          serverRecords = [...serverRecords, ...webhookRes.value.data.records];
        }
        if (Array.isArray(webhookRes.value.data.incoming)) {
          serverIncoming = [...serverIncoming, ...webhookRes.value.data.incoming];
        }
        if (Array.isArray(webhookRes.value.data.registeredWebhooks)) {
          setRegisteredWebhooks(webhookRes.value.data.registeredWebhooks);
          if (webhookRes.value.data.registeredWebhooks.length > 0 && !webhookInputUrl) {
            setWebhookInputUrl(webhookRes.value.data.registeredWebhooks[0].url || "");
          }
        }
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
        [...serverRecords, ...prevHist].forEach((rec) => {
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

        // Link incoming replies to matching sent records
        allInc.forEach((inc) => {
          const senderDigits = (inc.sender || "").replace(/[^0-9]/g, "");
          if (senderDigits.length >= 9) {
            const targetPhone = senderDigits.slice(-9);
            const match = mergedList.find((r) => {
              const rDigits = (r.phoneNumber || "").replace(/[^0-9]/g, "");
              return rDigits.slice(-9) === targetPhone;
            });
            if (match) {
              if (match.status !== "answered" || !match.response) {
                match.status = "answered";
                match.response = {
                  message: inc.message,
                  receivedAt: inc.receivedAt,
                  sender: inc.sender,
                };
              }
            }
          }
        });

        mergedList.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
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
    loadGatewayAndHistory();
    // Poll for responses every 3.5 seconds
    const interval = setInterval(loadGatewayAndHistory, 3500);
    return () => clearInterval(interval);
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
        loadGatewayAndHistory();
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
        loadGatewayAndHistory();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message, { id: t });
    }
  };

  return (
    <div
      className="flex flex-col gap-3 pb-6 text-[#F4F5F7]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER DE CONTROL                                          */}
      {/* ------------------------------------------------------------- */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E85D2F]/15 border border-[#E85D2F]/30 flex items-center justify-center text-[#E85D2F]">
              <MessageSquare size={17} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#F4F5F7] m-0 leading-tight">
                Comandos SMS <span className="text-[#E85D2F]">GPS</span>
              </h1>
              <p className="text-[11px] text-[#8A9099] mt-0.5 m-0 leading-tight">
                Configuración remota y telemetría de unidades Teltonika, TK y GT
              </p>
            </div>
          </div>
        </div>

        {/* Badges de estado & Botones de Cabecera */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge Gateway API */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#1C1F26] border border-white/5 shadow-sm">
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#E85D2F]/20 text-[#E85D2F]">
              API
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-gray-200 leading-none">Gateway SMS</span>
              <span className="text-[8px] text-[#8A9099]">sms-gate.app</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                gatewayConfigured
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}
            >
              {gatewayConfigured ? "ACTIVO" : "PENDIENTE"}
            </span>
          </div>

          {/* Badge Celular Módem (Dispositivo Físico) */}
          {deviceStatus && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#1C1F26] border border-white/5 shadow-sm">
              <Smartphone size={14} className={deviceStatus.isOnline ? "text-emerald-400" : "text-amber-400"} />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-200 leading-none">
                  {deviceStatus.name.split("/")[0]} ({deviceStatus.carrier})
                </span>
                <span className="text-[8px] text-[#8A9099]">
                  {deviceStatus.isOnline
                    ? "Conectado"
                    : `Standby (${deviceStatus.diffMinutes} min)`}
                </span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  deviceStatus.isOnline
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
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
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer shadow-sm ${
              autoWizardMode
                ? "bg-[#E85D2F] text-white border-[#E85D2F] shadow-[0_0_15px_rgba(232,93,47,0.35)]"
                : "bg-[#1C1F26] text-slate-300 border-white/10 hover:border-[#E85D2F]/50 hover:text-white"
            }`}
          >
            <Sparkles size={13} className={autoWizardMode ? "text-white animate-pulse" : "text-[#E85D2F]"} />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold leading-none">
                Crear Unidad en automático
              </span>
              <span className={`text-[8px] leading-tight ${autoWizardMode ? "text-orange-100" : "text-[#8A9099]"}`}>
                {autoWizardMode ? "Asistente 1-Click Activo" : "Activar Pasarela"}
              </span>
            </div>
            {/* Pill Switch */}
            <div
              className={`w-7 h-3.5 rounded-full relative flex items-center p-0.5 transition-colors ${
                autoWizardMode ? "bg-white/30" : "bg-white/10"
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full transition-transform ${
                  autoWizardMode ? "translate-x-3.5 bg-white" : "translate-x-0 bg-slate-400"
                }`}
              />
            </div>
          </button>

          {/* Botón Webhook */}
          <button
            onClick={() => setShowWebhookModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1F26] border border-white/10 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-[#E85D2F]/50 transition-all cursor-pointer shadow-sm"
          >
            <Radio size={13} className={registeredWebhooks.length > 0 ? "text-emerald-400 animate-pulse" : "text-[#E85D2F]"} />
            <span>Webhook Respuestas</span>
            {registeredWebhooks.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#2ECC71]" />
            )}
          </button>
        </div>
      </header>

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
          className={`relative p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedModel === "teltonika"
              ? "bg-[#1C1F26] border-2 border-[#E85D2F] shadow-[0_0_20px_rgba(232,93,47,0.15)]"
              : "bg-[#16181D] border border-white/5 hover:border-white/20 hover:bg-[#1C1F26]"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A9099]">
              MODELO 01
            </span>
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                selectedModel === "teltonika"
                  ? "bg-[#E85D2F] text-white shadow-[0_2px_8px_rgba(232,93,47,0.4)]"
                  : "bg-white/5 text-gray-400"
              }`}
            >
              T
            </div>
          </div>
          <h2 className="text-sm font-bold text-white mt-0.5 mb-0.5">Teltonika</h2>
          <p className="text-[11px] text-slate-400 line-clamp-1 mb-1.5">
            FMB920, FMB120, FMC920 y compatibles
          </p>
          <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-white/5">
            <span className="text-slate-400 font-medium">{TELTONIKA_COMMANDS.length} comandos</span>
            <span
              className={`text-[9px] font-bold tracking-wider uppercase ${
                selectedModel === "teltonika" ? "text-[#E85D2F]" : "text-slate-500"
              }`}
            >
              {selectedModel === "teltonika" ? "SELECCIONADO" : "Disponible"}
            </span>
          </div>
        </div>

        {/* MODELO 02: TK */}
        <div
          onClick={() => handleSelectModel("tk")}
          className={`relative p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedModel === "tk"
              ? "bg-[#1C1F26] border-2 border-[#E85D2F] shadow-[0_0_20px_rgba(232,93,47,0.15)]"
              : "bg-[#16181D] border border-white/5 hover:border-white/20 hover:bg-[#1C1F26]"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A9099]">
              MODELO 02
            </span>
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                selectedModel === "tk"
                  ? "bg-[#E85D2F] text-white shadow-[0_2px_8px_rgba(232,93,47,0.4)]"
                  : "bg-white/5 text-gray-400"
              }`}
            >
              K
            </div>
          </div>
          <h2 className="text-sm font-bold text-white mt-0.5 mb-0.5">TK / Coban</h2>
          <p className="text-[11px] text-slate-400 line-clamp-1 mb-1.5">
            TK103, TK102, TK303 y familia Coban
          </p>
          <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-white/5">
            <span className="text-slate-400 font-medium">{TK_COMMANDS.length} comandos</span>
            <span
              className={`text-[9px] font-bold tracking-wider uppercase ${
                selectedModel === "tk" ? "text-[#E85D2F]" : "text-slate-500"
              }`}
            >
              {selectedModel === "tk" ? "SELECCIONADO" : "Disponible"}
            </span>
          </div>
        </div>

        {/* MODELO 03: GT */}
        <div
          onClick={() => handleSelectModel("gt")}
          className={`relative p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedModel === "gt"
              ? "bg-[#1C1F26] border-2 border-[#E85D2F] shadow-[0_0_20px_rgba(232,93,47,0.15)]"
              : "bg-[#16181D] border border-white/5 hover:border-white/20 hover:bg-[#1C1F26]"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A9099]">
              MODELO 03
            </span>
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                selectedModel === "gt"
                  ? "bg-[#E85D2F] text-white shadow-[0_2px_8px_rgba(232,93,47,0.4)]"
                  : "bg-white/5 text-gray-400"
              }`}
            >
              G
            </div>
          </div>
          <h2 className="text-sm font-bold text-white mt-0.5 mb-0.5">GT / Concox</h2>
          <p className="text-[11px] text-slate-400 line-clamp-1 mb-1.5">
            GT06N, Concox, VL03, ET200 y clones
          </p>
          <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-white/5">
            <span className="text-slate-400 font-medium">{GT_COMMANDS.length} comandos</span>
            <span
              className={`text-[9px] font-bold tracking-wider uppercase ${
                selectedModel === "gt" ? "text-[#E85D2F]" : "text-slate-500"
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
          <div className="bg-[#1C1F26] border border-white/5 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Car size={14} className="text-[#E85D2F]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#8A9099] m-0">
                Destino y Acceso de la Unidad
              </h2>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Buscador de Placa */}
              <div ref={searchBoxRef} className="relative">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                    className="w-full bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-1.5 pr-8 text-xs text-white outline-none focus:ring-1 focus:ring-[#E85D2F] transition-all"
                  />
                  <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                {/* Dropdown flotante */}
                {showPlacaDropdown && vehiculosFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#16181D] border border-white/15 rounded-xl z-50 max-h-48 overflow-y-auto shadow-2xl custom-scrollbar">
                    {vehiculosFiltrados.map((v) => (
                      <div
                        key={`${v.accountID}_${v.deviceID}`}
                        onClick={() => handleSelectVehiculo(v)}
                        className="p-2 border-b border-white/5 hover:bg-white/5 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#E85D2F]">{v.deviceID}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({v.accountID})</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            SIM: {v.simPhoneNumber || "Sin SIM"} • {v.equipmentType || "GPS"}
                          </span>
                        </div>
                        <ChevronRight size={13} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* INPUT NÚMERO SIM CON PREFIJO +51 FIJO */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Número de la SIM (Perú)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {simLocalNumber.length === 9 ? "✓ 9 dígitos" : `${simLocalNumber.length}/9`}
                  </span>
                </div>

                <div className="flex items-center bg-[#0A0C0F] border border-white/10 rounded-lg overflow-hidden focus-within:border-[#E85D2F] transition-colors">
                  {/* Badge +51 PERÚ FIJO */}
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white/[0.04] border-r border-white/10 select-none flex-shrink-0">
                    <span className="text-xs">🇵🇪</span>
                    <span className="text-xs font-bold text-[#E85D2F] tracking-wide">+51</span>
                  </div>

                  {/* Campo editable de 9 dígitos */}
                  <input
                    type="tel"
                    placeholder="900 000 000"
                    value={formatPeruPhone(simLocalNumber)}
                    onChange={(e) => handleSimNumberChange(e.target.value)}
                    className="w-full bg-transparent px-2.5 py-1.5 text-xs text-white font-mono font-medium tracking-wider outline-none"
                  />
                  {simLocalNumber && (
                    <button
                      type="button"
                      onClick={() => setSimLocalNumber("")}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer mr-0.5"
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
              <div className="mt-2.5 p-2 rounded-lg bg-[#E85D2F]/10 border border-[#E85D2F]/25 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-[#E85D2F]/20 flex items-center justify-center text-[#E85D2F]">
                    <Car size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{vehiculoSeleccionado.deviceID}</span>
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-slate-300 font-medium">
                        {vehiculoSeleccionado.equipmentType || "GPS"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Cliente: {vehiculoSeleccionado.accountID}</span>
                  </div>
                </div>
                <button
                  onClick={handleClearVehiculo}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
                  title="Quitar selección"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Clave según modelo */}
            <div className="mt-2.5 pt-2.5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedModel === "teltonika" ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Login SMS (Opcional)</label>
                    <input
                      type="text"
                      placeholder="ej. admin"
                      value={teltonikaLogin}
                      onChange={(e) => setTeltonikaLogin(e.target.value)}
                      className="w-full bg-[#0A0C0F] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#E85D2F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Password SMS (Opcional)</label>
                    <input
                      type="text"
                      placeholder="ej. 123456"
                      value={teltonikaPass}
                      onChange={(e) => setTeltonikaPass(e.target.value)}
                      className="w-full bg-[#0A0C0F] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#E85D2F]"
                    />
                  </div>
                </>
              ) : selectedModel === "tk" ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Password (Fábrica: 123456)</label>
                  <input
                    type="text"
                    value={tkPass}
                    onChange={(e) => setTkPass(e.target.value)}
                    className="w-full bg-[#0A0C0F] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#E85D2F]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Password de Fábrica</label>
                  <input
                    type="text"
                    value={gtPass}
                    onChange={(e) => setGtPass(e.target.value)}
                    className="w-full bg-[#0A0C0F] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#E85D2F]"
                  />
                </div>
              )}

              {/* Nota de modelo */}
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 sm:col-span-2">
                <Info size={14} className="text-[#E85D2F] flex-shrink-0" />
                <span>
                  {selectedModel === "teltonika" && "Teltonika agrega 2 espacios automáticos si no hay login/pass."}
                  {selectedModel === "tk" && "TK103 integra la contraseña de 6 dígitos en cada comando."}
                  {selectedModel === "gt" && "Los GT06 terminan obligatoriamente con «#»."}
                </span>
              </div>
            </div>
          </div>

          {/* BLOQUE: MENSAJE FINAL A ENVIAR */}
          <div className="bg-[#1C1F26] border border-white/5 rounded-xl p-3.5 shadow-sm flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A9099]">
                Comando ensamblado a enviar
              </span>
              {isCustomEdited && (
                <button
                  onClick={() => setIsCustomEdited(false)}
                  className="text-[11px] font-semibold text-[#E85D2F] hover:underline cursor-pointer"
                >
                  Restaurar automático
                </button>
              )}
            </div>

            {/* Caja Monospace estilizada */}
            <div className="relative bg-[#0A0C0F] border border-[#E85D2F]/30 rounded-lg p-2.5 focus-within:border-[#E85D2F] transition-colors">
              <textarea
                value={assembledMessage}
                onChange={(e) => {
                  setCustomMessage(e.target.value);
                  setIsCustomEdited(true);
                }}
                rows={2}
                placeholder="El comando ensamblado aparecerá aquí..."
                className="w-full bg-transparent border-none outline-none text-white font-mono text-xs font-medium resize-none"
              />
            </div>

            {/* Footer de envío */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <span className="text-[11px] text-slate-400 font-mono">
                <strong>{charCount}</strong> car. • <strong>{smsParts}</strong> SMS
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCommand}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copiar</span>
                </button>

                <button
                  onClick={handleSendSms}
                  disabled={isSending}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-md shadow-[#E85D2F]/20 cursor-pointer transition-all ${
                    isSending ? "bg-[#b8451f] opacity-80" : "bg-[#E85D2F] hover:bg-[#ff6b3d] active:scale-95"
                  }`}
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
          <div className="bg-[#1C1F26] border border-white/5 rounded-xl p-3.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sliders size={14} className="text-[#E85D2F]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#8A9099] m-0">
                  Comandos {selectedModel.toUpperCase()}
                </h2>
              </div>

              {/* Filtros de Categoría */}
              <div className="flex items-center gap-1 bg-[#0A0C0F] p-0.5 rounded-lg border border-white/5">
                {(["TODOS", "LECTURA", "CONFIG", "CRÍTICO"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? "bg-[#E85D2F] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
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
                  className="w-full bg-[#0A0C0F] border border-white/10 rounded-lg px-2.5 py-1 pr-7 text-xs text-white outline-none focus:border-[#E85D2F]"
                />
                <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
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
                    className={`p-2 rounded-lg cursor-pointer transition-all duration-150 flex flex-col justify-between gap-1 ${
                      isSelected
                        ? "bg-[#E85D2F]/10 border border-[#E85D2F] shadow-[0_0_12px_rgba(232,93,47,0.15)]"
                        : "bg-[#0A0C0F] border border-white/5 hover:border-white/15 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1.5">
                      <span className={`text-xs font-bold break-all ${isSelected ? "text-[#E85D2F]" : "text-white"}`}>
                        {cmd.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase flex-shrink-0 ${catColor}`}>
                        {cmd.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight line-clamp-1 m-0">
                      {cmd.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Panel de Parámetros Dinámicos si el comando los requiere */}
            {selectedCommand?.params && selectedCommand.params.length > 0 && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-[#0A0C0F] border border-[#E85D2F]/20 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#E85D2F]" />
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-200">
                    Parámetros para: <code className="text-[#E85D2F] font-semibold">{selectedCommand.name}</code>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCommand.params.map((param) => (
                    <div key={param.key}>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
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
                        className="w-full bg-[#16181D] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-medium outline-none focus:border-[#E85D2F]"
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
                                    ? "bg-[#E85D2F]/20 text-[#E85D2F] border-[#E85D2F]/40 shadow-sm"
                                    : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
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
      <section className="bg-[#1C1F26] border border-white/5 rounded-xl p-3.5 shadow-sm flex flex-col gap-2.5">
        {/* Cabecera de la Consola */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E85D2F]/15 border border-[#E85D2F]/30 flex items-center justify-center text-[#E85D2F]">
              <Terminal size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white m-0">
                Consola de Telemetría y Respuestas GPS
              </h2>
              <p className="text-[11px] text-[#8A9099] mt-0.5 m-0 leading-tight">
                Historial de comandos y respuestas devueltas por los módems GPS vía Webhook
              </p>
            </div>
          </div>

          {/* Acciones y Pestañas de la Consola */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Pestañas: Enviados vs Entrantes */}
            <div className="flex items-center bg-[#0A0C0F] p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => setConsoleTab("sent")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                  consoleTab === "sent"
                    ? "bg-[#E85D2F] text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Comandos ({history.length})
              </button>
              <button
                onClick={() => setConsoleTab("incoming")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                  consoleTab === "incoming"
                    ? "bg-[#E85D2F] text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                SMS Recibidos ({incomingLogs.length})
              </button>
            </div>

            <button
              onClick={loadGatewayAndHistory}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Actualizar registro"
            >
              <RefreshCw size={12} />
              <span>Actualizar</span>
            </button>

            {(history.length > 0 || incomingLogs.length > 0) && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-400 transition-colors cursor-pointer"
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
              <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 mb-2">
                  <MessageSquare size={16} />
                </div>
                <span className="text-xs font-bold text-slate-300">Sin Comandos Enviados</span>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
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
                    className={`p-2.5 rounded-lg border transition-all ${
                      hasResponse
                        ? "bg-[#14171D] border-emerald-500/30"
                        : item.status === "failed"
                        ? "bg-[#161214] border-rose-500/30"
                        : "bg-[#14171D] border-white/5"
                    }`}
                  >
                    {/* Encabezado del Registro */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-white/5">
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
                          <span className="text-[10px] font-bold bg-[#E85D2F]/20 border border-[#E85D2F]/40 text-[#E85D2F] px-1.5 py-0.2 rounded">
                            {item.placa}
                          </span>
                        )}

                        {/* Número destino */}
                        <span className="text-xs font-semibold text-slate-200 font-mono">
                          {item.phoneNumber}
                        </span>

                        {/* Modelo */}
                        {item.model && (
                          <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-1.5 py-0.2 rounded uppercase">
                            {item.model}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </span>
                    </div>

                    {/* Cuerpo: Comando Enviado y Respuesta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {/* Comando Enviado */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9099]">
                          Comando Enviado
                        </span>
                        <div className="bg-[#0A0C0F] border border-white/10 rounded-lg p-2 flex justify-between items-start gap-1.5">
                          <code className="text-xs font-mono text-white font-medium break-all leading-relaxed">
                            {item.message}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.message);
                              toast.success("Comando copiado");
                            }}
                            className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer flex-shrink-0"
                            title="Copiar comando"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Respuesta Recibida */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9099]">
                            Respuesta del Dispositivo GPS
                          </span>
                          {item.response && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              {new Date(item.response.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {hasResponse ? (
                          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-2 flex flex-col gap-1.5">
                            <code className="text-xs font-mono text-emerald-300 font-medium break-all leading-relaxed">
                              {item.response?.message}
                            </code>

                            {mapsUrl && (
                              <div>
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors no-underline shadow-sm"
                                >
                                  <span>Abrir en Maps</span>
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            )}
                          </div>
                        ) : item.status === "failed" ? (
                          <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-2 text-xs text-rose-300">
                            {item.error || "No se pudo entregar el mensaje al módem"}
                          </div>
                        ) : (
                          <div className="bg-[#0A0C0F]/60 border border-dashed border-white/10 rounded-lg p-2 text-xs text-slate-400 flex items-center gap-1.5">
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
              <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 mb-2">
                  <Radio size={16} />
                </div>
                <span className="text-xs font-bold text-slate-300">Sin Mensajes Entrantes Registrados</span>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
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
                    className="p-2.5 rounded-lg border border-white/10 bg-[#14171D] flex flex-col gap-2 hover:border-[#E85D2F]/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Check size={11} />
                          SMS RECIBIDO
                        </span>

                        <span className="text-xs font-mono font-bold text-white">
                          {inc.sender}
                        </span>

                        {inc.matchedRecordId && (
                          <span className="text-[10px] font-semibold bg-white/5 text-slate-400 px-1.5 py-0.2 rounded">
                            Vinculado a comando
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
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
                          className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                          title="Cargar número para enviarle un comando"
                        >
                          Cargar Número
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#0A0C0F] border border-white/10 rounded-lg p-2 flex justify-between items-start gap-2">
                      <code className="text-xs font-mono text-emerald-300 font-medium break-all leading-relaxed">
                        {inc.message}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inc.message);
                          toast.success("Mensaje copiado");
                        }}
                        className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer flex-shrink-0"
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
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors no-underline shadow-sm"
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

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL DE CONFIGURACIÓN DE WEBHOOK RESPUESTAS                */}
      {/* ------------------------------------------------------------- */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-[#1C1F26] border border-white/10 rounded-2xl max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E85D2F]/20 flex items-center justify-center text-[#E85D2F]">
                  <Radio size={16} />
                </div>
                <h2 className="text-sm font-bold text-white m-0">Webhook de Respuestas SMS</h2>
              </div>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Estado del webhook */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                registeredWebhooks.length > 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold tracking-wide">
                  {registeredWebhooks.length > 0
                    ? "🟢 WEBHOOK ACTIVO EN SMS-GATE.APP"
                    : "⚠️ SIN WEBHOOK REGISTRADO EN SMS-GATE.APP"}
                </span>
                {registeredWebhooks.length > 0 && (
                  <button
                    onClick={() => handleDeleteWebhook(registeredWebhooks[0]?.id || "gps-respuestas")}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                  >
                    Eliminar Webhook
                  </button>
                )}
              </div>

              {registeredWebhooks.length > 0 ? (
                <div className="text-xs text-white mt-1">
                  <p className="font-mono text-[11px] break-all m-0">
                    URL: <strong>{registeredWebhooks[0]?.url}</strong>
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Evento suscrito: {registeredWebhooks[0]?.event || "sms:received"}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-300 m-0">
                  sms-gate.app no tiene ninguna URL registrada donde enviar las respuestas que recibe tu celular.
                </p>
              )}
            </div>

            {/* Input URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL Pública del Webhook (debe iniciar con https://):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://tu-dominio.com/api/gps-webhook"
                  value={webhookInputUrl}
                  onChange={(e) => setWebhookInputUrl(e.target.value)}
                  className="flex-1 bg-[#0A0C0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#E85D2F]"
                />
                <button
                  onClick={handleSaveWebhook}
                  className="px-4 py-2 rounded-xl bg-[#E85D2F] hover:bg-[#ff6b3d] text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
                >
                  Registrar (1 Clic)
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                En producción usa tu enlace de Vercel (ej: <code>https://tu-app.vercel.app/api/gps-webhook</code>).
              </span>
            </div>

            {/* Ayuda */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-400">
              <span className="font-bold text-[#E85D2F] block mb-1">💡 ¿Cómo funciona en producción?</span>
              <p className="m-0 leading-relaxed text-[11px]">
                Cuando subas tu web a Vercel, abres este modal, pegas tu URL con <code>/api/gps-webhook</code> y presionas <strong>Registrar</strong>. Quedará activo de forma permanente sin necesidad de terminales.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowWebhookModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


