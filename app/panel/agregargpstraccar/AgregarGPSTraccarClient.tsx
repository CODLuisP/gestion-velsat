"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  LogIn,
  Table as TableIcon,
  Download,
  Keyboard,
  Trash2,
  FileSpreadsheet,
  Users,
  Link,
  Hash,
  List,
  RefreshCw,
  Pencil,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import ImputBuscar from "@/app/components/ui/ImputBuscar";
import ModalEliminar from "@/app/components/modal/ModalEliminar";
import ModalBase from "@/app/components/modal/ModalBase";
import ButtonBase from "@/app/components/ui/ButtonBase";
import InputBase1 from "@/app/components/ui/InputBase1";

interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string;
  phone?: string;
  model?: string;
  status: string;
  disabled: boolean;
  attributes?: {
    accountID?: string;
    deviceID?: string;
    [key: string]: unknown;
  };
}

interface DeviceResult {
  name: string;
  uniqueId: string;
  phone: string;
  model: string;
  deviceID: string;
  accountID: string;
  status: "pending" | "loading" | "success" | "error";
  message?: string;
}

interface PermissionResult {
  deviceId: string;
  status: "pending" | "loading" | "success" | "error";
  message?: string;
}

const SERVERS = [
  {
    id: "do",
    label: "Servidor DO (Linux 1)",
    host: "do.velsat.pe",
    url: "https://do.velsat.pe:2087",
  },
  {
    id: "sr",
    label: "Servidor SR (Linux 2)",
    host: "sr.velsat.pe",
    url: "https://sr.velsat.pe:2087",
  },
];

export default function AgregarGPSTraccarClient() {
  // Tabs
  const [activeTab, setActiveTab] = useState<"registrar" | "unidades">(
    "registrar",
  );

  // Login State
  const [email, setEmail] = useState("velsat@velsat.pe");
  const [password, setPassword] = useState("velsat2026");
  const [serverUrl, setServerUrl] = useState(SERVERS[0].url);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Unidades (listado) State
  const [devices, setDevices] = useState<TraccarDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [busquedaUnidad, setBusquedaUnidad] = useState("");
  const [deviceAEliminar, setDeviceAEliminar] = useState<TraccarDevice | null>(
    null,
  );
  const [openEliminarModal, setOpenEliminarModal] = useState(false);
  const [isDeletingDevice, setIsDeletingDevice] = useState(false);

  const [deviceAEditar, setDeviceAEditar] = useState<TraccarDevice | null>(
    null,
  );
  const [openEditarModal, setOpenEditarModal] = useState(false);
  const [isSavingDevice, setIsSavingDevice] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: "",
    model: "",
    uniqueId: "",
    accountID: "",
    deviceID: "",
  });

  // Manual Entry State
  const [manualDevice, setManualDevice] = useState({
    name: "",
    uniqueId: "",
    phone: "",
    model: "",
    deviceID: "",
    accountID: "",
  });

  // CSV/Process State
  const [results, setResults] = useState<DeviceResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Permission Assignment State
  const [assignUserId, setAssignUserId] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<"range" | "manual">(
    "range",
  );
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [manualDeviceIds, setManualDeviceIds] = useState("");
  const [permissionResults, setPermissionResults] = useState<
    PermissionResult[]
  >([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Stats
  const total = results.length;
  const successes = results.filter((r) => r.status === "success").length;
  const failures = results.filter((r) => r.status === "error").length;

  // Autenticación básica: cada petición se autentica por sí sola,
  // así no dependemos de la cookie de sesión (que puede bloquearse entre dominios).
  const authHeader = () => "Basic " + btoa(`${email}:${password}`);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const params = new URLSearchParams();
      params.append("email", email);
      params.append("password", password);

      await axios.post(`${serverUrl}/api/session`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        withCredentials: true,
      });

      setIsLoggedIn(true);
      const serverLabel = SERVERS.find((s) => s.url === serverUrl)?.label ?? "";
      toast.success(`Sesión iniciada en Traccar (${serverLabel})`);
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(
        "Error al iniciar sesión: " + (error.response?.data || error.message),
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isCsv = fileName.endsWith(".csv");

    if (!isExcel && !isCsv) {
      toast.error("Formato de archivo no soportado. Use .csv o .xlsx");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        let jsonData: any[] = [];

        if (isExcel) {
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(sheet);
        } else {
          // CSV parsing using XLSX to handle different delimiters automatically
          const workbook = XLSX.read(data, { type: "string" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(sheet);
        }

        const parsedResults: DeviceResult[] = jsonData
          .map((device: any) => ({
            name: String(device.name || ""),
            uniqueId: String(device.uniqueId || ""),
            phone: String(device.phone || ""),
            model: String(device.model || ""),
            deviceID: String(device.deviceID || device.name || ""),
            accountID: String(device.accountID || device.name || ""),
            status: "pending" as const,
          }))
          .filter((d) => d.name || d.uniqueId);

        setResults((prev) => [...prev, ...parsedResults]);
        toast.success(
          `${parsedResults.length} dispositivos cargados desde ${isExcel ? "Excel" : "CSV"}`,
        );
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Error al leer el archivo. Verifique el formato.");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (isExcel) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const addManualDevice = () => {
    if (!manualDevice.name || !manualDevice.uniqueId) {
      toast.error("Nombre e IMEI son obligatorios");
      return;
    }

    const newDevice: DeviceResult = {
      ...manualDevice,
      deviceID: manualDevice.deviceID || manualDevice.name,
      accountID: manualDevice.accountID || manualDevice.name,
      status: "pending" as const,
    };

    setResults((prev) => [...prev, newDevice]);
    setManualDevice({
      name: "",
      uniqueId: "",
      phone: "",
      model: "",
      deviceID: "",
      accountID: "",
    });
    toast.success("Dispositivo añadido a la lista");
  };

  const removeDevice = (idx: number) => {
    setResults((prev) => prev.filter((_, i) => i !== idx));
  };

  const processDevices = async () => {
    if (results.length === 0) {
      toast.error("No hay dispositivos para procesar");
      return;
    }

    setIsProcessing(true);
    const updatedResults = [...results];

    for (let i = 0; i < updatedResults.length; i++) {
      if (updatedResults[i].status === "success") continue;

      const device = updatedResults[i];

      updatedResults[i] = { ...updatedResults[i], status: "loading" };
      setResults([...updatedResults]);

      try {
        const payload = {
          name: device.name,
          uniqueId: device.uniqueId,
          phone: device.phone,
          model: device.model,
          category: "car",
          groupId: 0,
          attributes: {
            deviceID: device.deviceID,
            accountID: device.accountID,
          },
        };

        await axios.post(`${serverUrl}/api/devices`, payload, {
          headers: { Authorization: authHeader() },
          withCredentials: true,
        });

        updatedResults[i] = {
          ...updatedResults[i],
          status: "success",
          message: "Registrado correctamente",
        };
      } catch (error: any) {
        console.error(`Error registering ${device.name}:`, error);
        const errorMsg = error.response?.data || error.message;
        updatedResults[i] = {
          ...updatedResults[i],
          status: "error",
          message: errorMsg,
        };
      }

      setResults([...updatedResults]);
    }

    setIsProcessing(false);
    toast.success("Proceso finalizado");
  };

  const handleAssignPermissions = async () => {
    if (!assignUserId) {
      toast.error("Ingrese el ID del usuario");
      return;
    }

    let deviceIdsToAssign: string[] = [];

    if (assignmentMode === "range") {
      const from = parseInt(rangeFrom);
      const to = parseInt(rangeTo);
      if (isNaN(from) || isNaN(to) || from > to) {
        toast.error("Rango inválido");
        return;
      }
      for (let i = from; i <= to; i++) {
        deviceIdsToAssign.push(String(i));
      }
    } else {
      if (!manualDeviceIds.trim()) {
        toast.error("Ingrese al menos un ID de dispositivo");
        return;
      }
      deviceIdsToAssign = manualDeviceIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "");
    }

    if (deviceIdsToAssign.length === 0) {
      toast.error("No hay dispositivos para asignar");
      return;
    }

    setIsAssigning(true);
    const initialResults: PermissionResult[] = deviceIdsToAssign.map((id) => ({
      deviceId: id,
      status: "pending",
    }));
    setPermissionResults(initialResults);

    const updatedResults = [...initialResults];

    for (let i = 0; i < updatedResults.length; i++) {
      const deviceId = updatedResults[i].deviceId;
      updatedResults[i].status = "loading";
      setPermissionResults([...updatedResults]);

      try {
        await axios.post(
          `${serverUrl}/api/permissions`,
          {
            userId: Number(assignUserId),
            deviceId: Number(deviceId),
          },
          {
            headers: { Authorization: authHeader() },
            withCredentials: true,
          },
        );

        updatedResults[i].status = "success";
        updatedResults[i].message = "Asignado correctamente";
      } catch (error: any) {
        console.error(`Error assigning ${deviceId}:`, error);
        updatedResults[i].status = "error";
        updatedResults[i].message = error.response?.data || error.message;
      }
      setPermissionResults([...updatedResults]);
    }

    setIsAssigning(false);
    const successCount = updatedResults.filter(
      (r) => r.status === "success",
    ).length;
    const failCount = updatedResults.filter((r) => r.status === "error").length;
    toast.success(
      `Proceso terminado: ${successCount} éxitos, ${failCount} fallos`,
    );
  };

  const fetchDevices = async () => {
    if (!isLoggedIn) return;
    setIsLoadingDevices(true);
    try {
      const { data } = await axios.get<TraccarDevice[]>(
        `${serverUrl}/api/devices`,
        {
          headers: { Authorization: authHeader() },
          withCredentials: true,
        },
      );
      setDevices(data);
    } catch (error: any) {
      console.error("Error fetching devices:", error);
      toast.error(
        "Error al listar unidades: " +
          (error.response?.data || error.message),
      );
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (activeTab === "unidades" && isLoggedIn) {
      fetchDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isLoggedIn, serverUrl]);

  const abrirEliminarDevice = (device: TraccarDevice) => {
    setDeviceAEliminar(device);
    setOpenEliminarModal(true);
  };

  const eliminarDevice = async () => {
    if (!deviceAEliminar) return;
    setIsDeletingDevice(true);
    try {
      await axios.delete(`${serverUrl}/api/devices/${deviceAEliminar.id}`, {
        headers: { Authorization: authHeader() },
        withCredentials: true,
      });
      toast.success(`Unidad "${deviceAEliminar.name}" eliminada`);
      setOpenEliminarModal(false);
      setDeviceAEliminar(null);
      setDevices((prev) => prev.filter((d) => d.id !== deviceAEliminar.id));
    } catch (error: any) {
      console.error("Error deleting device:", error);
      toast.error(
        "Error al eliminar: " + (error.response?.data || error.message),
      );
    } finally {
      setIsDeletingDevice(false);
    }
  };

  const abrirEditarDevice = (device: TraccarDevice) => {
    setDeviceAEditar(device);
    setEditForm({
      phone: device.phone || "",
      model: device.model || "",
      uniqueId: device.uniqueId || "",
      accountID: device.attributes?.accountID || "",
      deviceID: device.attributes?.deviceID || "",
    });
    setOpenEditarModal(true);
  };

  const guardarEdicionDevice = async () => {
    if (!deviceAEditar) return;
    if (!editForm.uniqueId.trim()) {
      toast.error("El IMEI es obligatorio");
      return;
    }

    const uniqueId = editForm.uniqueId.trim();
    const phone = editForm.phone.trim();
    const accountID = editForm.accountID.trim();
    const deviceID = editForm.deviceID.trim();

    const otrosDevices = devices.filter((d) => d.id !== deviceAEditar.id);

    const imeiDuplicado = otrosDevices.find(
      (d) => d.uniqueId?.trim() === uniqueId,
    );
    if (imeiDuplicado) {
      toast.error(
        `El IMEI "${uniqueId}" ya está en uso por la unidad "${imeiDuplicado.name}"`,
      );
      return;
    }

    if (phone) {
      const phoneDuplicado = otrosDevices.find(
        (d) => d.phone?.trim() === phone,
      );
      if (phoneDuplicado) {
        toast.error(
          `El teléfono "${phone}" ya está en uso por la unidad "${phoneDuplicado.name}"`,
        );
        return;
      }
    }

    if (deviceID && accountID) {
      const comboDuplicado = otrosDevices.find(
        (d) =>
          d.attributes?.deviceID?.trim() === deviceID &&
          d.attributes?.accountID?.trim() === accountID,
      );
      if (comboDuplicado) {
        toast.error(
          `Ya existe una unidad con DeviceID "${deviceID}" y AccountID "${accountID}" (unidad "${comboDuplicado.name}")`,
        );
        return;
      }
    }

    setIsSavingDevice(true);
    try {
      const payload = {
        ...deviceAEditar,
        phone: editForm.phone,
        model: editForm.model,
        uniqueId: editForm.uniqueId,
        attributes: {
          ...deviceAEditar.attributes,
          accountID: editForm.accountID,
          deviceID: editForm.deviceID,
        },
      };

      await axios.put(`${serverUrl}/api/devices/${deviceAEditar.id}`, payload, {
        headers: { Authorization: authHeader() },
        withCredentials: true,
      });

      setDevices((prev) =>
        prev.map((d) => (d.id === deviceAEditar.id ? payload : d)),
      );
      toast.success(`Unidad "${deviceAEditar.name}" actualizada`);
      setOpenEditarModal(false);
      setDeviceAEditar(null);
    } catch (error: any) {
      console.error("Error updating device:", error);
      toast.error(
        "Error al actualizar: " + (error.response?.data || error.message),
      );
    } finally {
      setIsSavingDevice(false);
    }
  };

  const filteredDevices = devices.filter((d) => {
    const q = busquedaUnidad.trim().toLowerCase();
    if (!q) return true;
    return (
      d.name?.toLowerCase().includes(q) ||
      d.uniqueId?.toLowerCase().includes(q) ||
      d.phone?.toLowerCase().includes(q) ||
      d.model?.toLowerCase().includes(q) ||
      d.attributes?.accountID?.toLowerCase().includes(q) ||
      d.attributes?.deviceID?.toLowerCase().includes(q)
    );
  });

  const downloadSampleCSV = () => {
    const csvContent =
      "name,uniqueId,phone,model,deviceID,accountID\nGPS_Unit_01,123456789012345,987654321,Coban 303,GPS_Unit_01,GPS_Unit_01";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formato_gps_traccar.csv";
    a.click();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ---------- HEADER ---------- */}
      <section
        style={{
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#F4F5F7",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: "#E85D2F" }}>Traccar</span>
          </h1>
          <p style={{ fontSize: 11, color: "#8A9099", margin: "2px 0 0" }}>
            Registra dispositivos y administra las unidades del servidor
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#0A0C0F] rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("registrar")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "registrar"
                ? "bg-[#E85D2F] text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Registrar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("unidades")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "unidades"
                ? "bg-[#E85D2F] text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <List size={13} /> Unidades
          </button>
        </div>
      </section>

      <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0 mt-1">
        {activeTab === "registrar" && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT COLUMN: CONNECTION & INPUTS */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* STEP 1: LOGIN */}
            <div
              className={`flex flex-col gap-3 p-4 rounded-xl bg-[#1C1F26] border transition-all ${isLoggedIn ? "border-emerald-500/30" : "border-white/5 shadow-xl"}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <LogIn
                    className={
                      isLoggedIn ? "text-emerald-500" : "text-[#E85D2F]"
                    }
                    size={16}
                  />
                  1. Conexión
                </h2>
                {isLoggedIn && (
                  <CheckCircle2 className="text-emerald-500" size={16} />
                )}
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-2.5">
                {/* Selector de servidor */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold px-1">
                    Servidor
                  </label>
                  <div
                    className={`flex gap-1 p-1 bg-[#0A0C0F] rounded-lg border border-white/5 ${isLoggedIn ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {SERVERS.map((s) => {
                      const active = serverUrl === s.url;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setServerUrl(s.url)}
                          disabled={isLoggedIn}
                          title={s.url}
                          className={`flex-1 flex flex-col items-center py-1.5 rounded-md transition-all ${
                            active
                              ? "bg-[#E85D2F] text-white shadow"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <span className="text-[11px] font-bold leading-tight">
                            {s.label}
                          </span>
                          <span
                            className={`text-[9px] leading-tight ${active ? "text-white/70" : "text-slate-600"}`}
                          >
                            {s.host}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggedIn}
                  className="bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E85D2F]/50 transition-all disabled:opacity-50 text-xs"
                  placeholder="email@velsat.pe"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggedIn}
                  className="bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E85D2F]/50 transition-all disabled:opacity-50 text-xs"
                  placeholder="********"
                />
                <button
                  type="submit"
                  disabled={isLoggingIn || isLoggedIn}
                  className={`font-bold py-2 text-xs rounded-lg flex items-center justify-center gap-2 transition-all ${
                    isLoggedIn
                      ? "bg-emerald-500/20 text-emerald-500 cursor-default"
                      : "bg-[#E85D2F] hover:bg-[#ff6b3d] text-white shadow-lg active:scale-95"
                  }`}
                >
                  {isLoggingIn ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : isLoggedIn ? (
                    "Conectado"
                  ) : (
                    "Conectar"
                  )}
                </button>
              </form>
            </div>

            {/* STEP 2: MANUAL INPUT */}
            <div
              className={`flex flex-col gap-3 p-4 rounded-xl bg-[#1C1F26] border transition-all ${!isLoggedIn ? "opacity-50 pointer-events-none" : "border-white/5 shadow-xl"}`}
            >
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Keyboard className="text-[#E85D2F]" size={16} />
                2. Ingreso Manual
              </h2>

              <div className="grid grid-cols-1 gap-2">
                <input
                  placeholder="Nombre del GPS"
                  value={manualDevice.name}
                  onChange={(e) =>
                    setManualDevice({ ...manualDevice, name: e.target.value })
                  }
                  className="bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-[#E85D2F]"
                />
                <input
                  placeholder="IMEI (Unique ID)"
                  value={manualDevice.uniqueId}
                  onChange={(e) =>
                    setManualDevice({
                      ...manualDevice,
                      uniqueId: e.target.value,
                    })
                  }
                  className="bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-[#E85D2F]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Teléfono"
                    value={manualDevice.phone}
                    onChange={(e) =>
                      setManualDevice({
                        ...manualDevice,
                        phone: e.target.value,
                      })
                    }
                    className="bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-[#E85D2F]"
                  />
                  <select
                    value={manualDevice.model}
                    onChange={(e) =>
                      setManualDevice({
                        ...manualDevice,
                        model: e.target.value,
                      })
                    }
                    className="bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-[#E85D2F]"
                  >
                    <option value="" className="bg-[#0A0C0F] text-slate-500">
                      Seleccionar modelo
                    </option>
                    <option value="teltonika" className="bg-[#0A0C0F]">
                      teltonika
                    </option>
                    <option value="gt06" className="bg-[#0A0C0F]">
                      gt06
                    </option>
                    <option value="gps103" className="bg-[#0A0C0F]">
                      gps103
                    </option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 mt-0.5">
                  <input
                    placeholder="DeviceID (Attr)"
                    value={manualDevice.deviceID}
                    onChange={(e) =>
                      setManualDevice({
                        ...manualDevice,
                        deviceID: e.target.value,
                      })
                    }
                    className="bg-[#0A0C0F] border border-white/5 rounded-lg px-3 py-1.5 text-white text-[11px] focus:ring-1 focus:ring-[#E85D2F]"
                  />
                  <input
                    placeholder="AccountID (Attr)"
                    value={manualDevice.accountID}
                    onChange={(e) =>
                      setManualDevice({
                        ...manualDevice,
                        accountID: e.target.value,
                      })
                    }
                    className="bg-[#0A0C0F] border border-white/5 rounded-lg px-3 py-1.5 text-white text-[11px] focus:ring-1 focus:ring-[#E85D2F]"
                  />
                </div>
              </div>

              <button
                onClick={addManualDevice}
                className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-1.5 rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Añadir a la lista
              </button>
            </div>

            {/* STEP 3: FILE UPLOAD */}
            <div
              className={`flex flex-col gap-3 p-4 rounded-xl bg-[#1C1F26] border transition-all ${!isLoggedIn ? "opacity-50 pointer-events-none" : "border-white/5 shadow-xl"}`}
            >
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="text-[#E85D2F]" size={16} />
                3. Cargar Archivo
              </h2>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-[#E85D2F]/50 hover:bg-[#E85D2F]/5 cursor-pointer transition-all group"
              >
                <FileSpreadsheet
                  className="text-slate-400 group-hover:text-[#E85D2F]"
                  size={18}
                />
                <p className="text-white text-xs font-medium text-center">
                  Subir Excel (.xlsx) o CSV
                </p>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </div>

              <button
                onClick={downloadSampleCSV}
                className="flex items-center justify-center gap-2 text-[10px] text-slate-500 hover:text-white transition-colors"
              >
                <Download size={12} /> Descargar formato CSV
              </button>
            </div>

            {/* STEP 4: ASSIGN PERMISSIONS */}
            <div
              className={`flex flex-col gap-3 p-4 rounded-xl bg-[#1C1F26] border transition-all ${!isLoggedIn ? "opacity-50 pointer-events-none" : "border-white/5 shadow-xl"}`}
            >
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Link className="text-[#E85D2F]" size={16} />
                4. Asignar GPS a Usuario
              </h2>

              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold px-1">
                    ID de Usuario
                  </label>
                  <div className="relative">
                    <Users
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      size={14}
                    />
                    <input
                      type="number"
                      placeholder="Ej: 42"
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      className="w-full bg-[#0A0C0F] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-[#E85D2F]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 p-1 bg-[#0A0C0F] rounded-lg border border-white/5">
                  <button
                    onClick={() => setAssignmentMode("range")}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${assignmentMode === "range" ? "bg-[#E85D2F] text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    RANGO
                  </button>
                  <button
                    onClick={() => setAssignmentMode("manual")}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${assignmentMode === "manual" ? "bg-[#E85D2F] text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    MANUAL
                  </button>
                </div>

                {assignmentMode === "range" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold px-1">
                        Desde
                      </label>
                      <input
                        type="number"
                        placeholder="4"
                        value={rangeFrom}
                        onChange={(e) => setRangeFrom(e.target.value)}
                        className="bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-[#E85D2F]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold px-1">
                        Hasta
                      </label>
                      <input
                        type="number"
                        placeholder="10"
                        value={rangeTo}
                        onChange={(e) => setRangeTo(e.target.value)}
                        className="bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-[#E85D2F]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold px-1">
                      IDs (separados por coma)
                    </label>
                    <textarea
                      placeholder="4, 9, 10, 15..."
                      value={manualDeviceIds}
                      onChange={(e) => setManualDeviceIds(e.target.value)}
                      rows={2}
                      className="bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-[#E85D2F] resize-none"
                    />
                  </div>
                )}

                <button
                  onClick={handleAssignPermissions}
                  disabled={isAssigning}
                  className="bg-[#E85D2F] hover:bg-[#ff6b3d] text-white text-xs font-bold py-2 rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAssigning ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Zap size={16} />
                  )}
                  Asignar
                </button>
              </div>

              {permissionResults.length > 0 && (
                <div className="mt-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      Progreso
                    </span>
                    <div className="flex gap-2">
                      <span className="text-[10px] text-emerald-500 font-bold">
                        {
                          permissionResults.filter(
                            (r) => r.status === "success",
                          ).length
                        }{" "}
                        OK
                      </span>
                      <span className="text-[10px] text-red-500 font-bold">
                        {
                          permissionResults.filter((r) => r.status === "error")
                            .length
                        }{" "}
                        FAIL
                      </span>
                    </div>
                  </div>

                  <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 pr-2 custom-scrollbar">
                    {permissionResults.map((res, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-black/20 p-1.5 rounded-lg border border-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="text-slate-600" size={12} />
                          <span className="text-xs text-white font-mono">
                            ID: {res.deviceId}
                          </span>
                        </div>
                        <div>
                          {res.status === "loading" && (
                            <Loader2
                              className="animate-spin text-[#E85D2F]"
                              size={14}
                            />
                          )}
                          {res.status === "success" && (
                            <CheckCircle2
                              className="text-emerald-500"
                              size={14}
                            />
                          )}
                          {res.status === "error" && (
                            <div className="group relative">
                              <XCircle className="text-red-500" size={14} />
                              <div className="absolute right-0 bottom-full mb-2 w-32 p-2 bg-red-900 text-white text-[9px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                                {res.message}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: PROGRESS & SUMMARY */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* SUMMARY & ACTION */}
            <div
              className={`grid grid-cols-1 md:grid-cols-4 gap-3 transition-all ${results.length === 0 ? "opacity-50" : ""}`}
            >
              {/* Total */}
              <div className="rounded-xl p-3 flex flex-col backdrop-blur-xl bg-white/4 border border-white/10 transition-all hover:bg-white/6">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  Total
                </span>
                <span className="text-2xl font-black text-white mt-0.5">
                  {total}
                </span>
              </div>
              {/* Éxitos */}
              <div className="rounded-xl p-3 flex flex-col backdrop-blur-xl bg-white/4 border border-white/10 transition-all hover:bg-white/6">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  Éxitos
                </span>
                <span className="text-2xl font-black text-white mt-0.5">
                  {successes}
                </span>
              </div>
              {/* Fallos */}
              <div className="rounded-xl p-3 flex flex-col backdrop-blur-xl bg-white/4 border border-white/10 transition-all hover:bg-white/6">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  Fallos
                </span>
                <span className="text-2xl font-black text-white mt-0.5">
                  {failures}
                </span>
              </div>
              {/* Iniciar */}
              <button
                onClick={processDevices}
                disabled={isProcessing || results.length === 0}
                className="rounded-xl py-3 px-3 flex items-center justify-center gap-2 text-sm font-black text-white backdrop-blur-xl bg-white/4 border border-white/10 transition-all hover:bg-white/8 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Zap size={18} />
                )}
                {isProcessing ? "PROCESANDO..." : "INICIAR"}
              </button>
            </div>

            {/* TABLE */}
            <div className="bg-[#1C1F26] border border-white/5 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col">
              <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TableIcon className="text-slate-400" size={15} />
                  Lista de Dispositivos
                </h3>
                {results.length > 0 && !isProcessing && (
                  <button
                    onClick={() => setResults([])}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} /> Limpiar lista
                  </button>
                )}
              </div>

              <div className="overflow-y-auto max-h-150">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#1C1F26]">
                    <tr className="bg-[#0A0C0F]/50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                      <th className="px-3 py-2">Nombre / IMEI</th>
                      <th className="px-3 py-2">Phone / Model</th>
                      <th className="px-3 py-2">Attributes</th>
                      <th className="px-3 py-2 text-center">Estado</th>
                      {!isProcessing && <th className="px-3 py-2 w-8"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {results.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-12 text-center text-slate-600 italic text-xs"
                        >
                          No hay dispositivos en la lista. Carga un Excel/CSV o
                          ingresa uno manualmente.
                        </td>
                      </tr>
                    ) : (
                      results.map((res, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-white/2 transition-colors"
                        >
                          <td className="px-3 py-2">
                            <div className="text-white font-medium text-xs">
                              {res.name}
                            </div>
                            <div className="text-slate-500 font-mono text-[10px]">
                              {res.uniqueId}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-slate-300 text-[11px]">
                              {res.phone || "-"}
                            </div>
                            <div className="text-slate-500 text-[10px]">
                              {res.model || "-"}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-slate-500">
                                ID: {res.deviceID}
                              </span>
                              <span className="text-[9px] text-slate-500">
                                ACC: {res.accountID}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {res.status === "pending" && (
                              <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />
                            )}
                            {res.status === "loading" && (
                              <Loader2
                                className="animate-spin text-[#E85D2F] mx-auto"
                                size={15}
                              />
                            )}
                            {res.status === "success" && (
                              <CheckCircle2
                                className="text-emerald-500 mx-auto"
                                size={16}
                              />
                            )}
                            {res.status === "error" && (
                              <div className="group relative inline-block">
                                <XCircle
                                  className="text-red-500 mx-auto cursor-help"
                                  size={16}
                                />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-red-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                  {res.message}
                                </div>
                              </div>
                            )}
                          </td>
                          {!isProcessing && (
                            <td className="px-3 py-2">
                              <button
                                onClick={() => removeDevice(idx)}
                                className="text-slate-600 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-[#E85D2F]/5 border border-[#E85D2F]/10 rounded-lg p-2.5 mt-3 flex items-start gap-2.5">
          <ShieldCheck className="text-[#E85D2F] shrink-0" size={16} />
          <div>
            <p className="text-[#E85D2F] text-xs font-bold">
              Resumen de Atributos
            </p>
            <p className="text-slate-400 text-[10px]">
              El sistema enviará `category: "car"` y `groupId: 0` por defecto.
              Soporta archivos **.csv**, **.xlsx** y **.xls**. Asegúrate de que
              los encabezados coincidan con los nombres esperados.
            </p>
          </div>
        </div>
        </>
        )}

        {activeTab === "unidades" && (
          <div className="flex flex-col gap-4 h-full">
            {!isLoggedIn ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center bg-[#1C1F26] border border-white/5 rounded-xl">
                <LogIn className="text-slate-600" size={22} />
                <p className="text-slate-400 text-sm font-medium">
                  Inicia sesión en la pestaña "Registrar" para ver las
                  unidades
                </p>
              </div>
            ) : (
              <div className="bg-[#1C1F26] border border-white/5 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col">
                <div className="p-3 border-b border-white/5 flex items-center justify-between gap-3 bg-white/2 flex-wrap">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 whitespace-nowrap">
                    <TableIcon className="text-slate-400" size={15} />
                    Unidades del servidor
                    <span className="text-slate-500 font-normal text-xs">
                      ({filteredDevices.length})
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-72">
                      <ImputBuscar
                        placeholder="Buscar por AccountID, DeviceID, IMEI, teléfono o modelo"
                        value={busquedaUnidad}
                        onChange={(e) => setBusquedaUnidad(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={fetchDevices}
                      disabled={isLoadingDevices}
                      title="Recargar"
                      className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      <RefreshCw
                        size={14}
                        className={isLoadingDevices ? "animate-spin" : ""}
                      />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#1C1F26]">
                      <tr className="bg-[#0A0C0F]/50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                        <th className="px-3 py-2">AccountID</th>
                        <th className="px-3 py-2">DeviceID</th>
                        <th className="px-3 py-2">IMEI</th>
                        <th className="px-3 py-2">Teléfono</th>
                        <th className="px-3 py-2">Modelo</th>
                        <th className="px-3 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {isLoadingDevices ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-12 text-center text-slate-500 text-xs"
                          >
                            <Loader2
                              className="animate-spin inline-block mr-2"
                              size={14}
                            />
                            Cargando unidades...
                          </td>
                        </tr>
                      ) : filteredDevices.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-12 text-center text-slate-600 italic text-xs"
                          >
                            {devices.length === 0
                              ? "No hay unidades registradas en este servidor."
                              : "No se encontraron unidades con ese criterio."}
                          </td>
                        </tr>
                      ) : (
                        filteredDevices.map((d) => (
                          <tr
                            key={d.id}
                            className="hover:bg-white/2 transition-colors"
                          >
                            <td className="px-3 py-2 text-white text-xs font-medium">
                              {d.attributes?.accountID || "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-300 text-[11px]">
                              {d.attributes?.deviceID || "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">
                              {d.uniqueId}
                            </td>
                            <td className="px-3 py-2 text-slate-300 text-[11px]">
                              {d.phone || "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-300 text-[11px]">
                              {d.model || "-"}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => abrirEditarDevice(d)}
                                  title="Editar"
                                  className="text-slate-600 hover:text-[#E85D2F] transition-colors"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => abrirEliminarDevice(d)}
                                  title="Eliminar"
                                  className="text-slate-600 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------- MODAL ELIMINAR UNIDAD ---------- */}
      <ModalEliminar
        open={openEliminarModal}
        title="Eliminar unidad"
        onClose={() => setOpenEliminarModal(false)}
        tamaño="w-full max-w-sm"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: "#ADB5BD", margin: 0 }}>
            ¿Seguro que deseas eliminar la unidad{" "}
            <strong style={{ color: "#F4F5F7" }}>
              {deviceAEliminar?.name}
            </strong>{" "}
            (IMEI: {deviceAEliminar?.uniqueId})? Esta acción no se puede
            deshacer.
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <ButtonBase
              variant="secondary"
              onClick={() => setOpenEliminarModal(false)}
            >
              Cancelar
            </ButtonBase>
            <ButtonBase
              variant="danger"
              disabled={isDeletingDevice}
              onClick={eliminarDevice}
            >
              {isDeletingDevice ? "Eliminando..." : "Eliminar"}
            </ButtonBase>
          </div>
        </div>
      </ModalEliminar>

      {/* ---------- MODAL EDITAR UNIDAD ---------- */}
      <ModalBase
        open={openEditarModal}
        title={`Editar unidad${deviceAEditar ? ` · ${deviceAEditar.name}` : ""}`}
        onClose={() => setOpenEditarModal(false)}
        tamaño="w-full max-w-lg"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="grid grid-cols-2 gap-3">
            <InputBase1
              label="AccountID"
              value={editForm.accountID}
              onChange={(e) =>
                setEditForm({ ...editForm, accountID: e.target.value })
              }
            />
            <InputBase1
              label="DeviceID"
              value={editForm.deviceID}
              onChange={(e) =>
                setEditForm({ ...editForm, deviceID: e.target.value })
              }
            />
          </div>

          <InputBase1
            label="IMEI (Unique ID)"
            value={editForm.uniqueId}
            required
            onChange={(e) =>
              setEditForm({ ...editForm, uniqueId: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <InputBase1
              label="Teléfono"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#8A9099",
                }}
              >
                Modelo
              </label>
              <select
                value={editForm.model}
                onChange={(e) =>
                  setEditForm({ ...editForm, model: e.target.value })
                }
                className="bg-[#0A0C0F] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-[#E85D2F]"
              >
                <option value="" className="bg-[#0A0C0F] text-slate-500">
                  Seleccionar modelo
                </option>
                <option value="teltonika" className="bg-[#0A0C0F]">
                  teltonika
                </option>
                <option value="gt06" className="bg-[#0A0C0F]">
                  gt06
                </option>
                <option value="gps103" className="bg-[#0A0C0F]">
                  gps103
                </option>
                {editForm.model &&
                  !["teltonika", "gt06", "gps103"].includes(
                    editForm.model,
                  ) && (
                    <option value={editForm.model} className="bg-[#0A0C0F]">
                      {editForm.model}
                    </option>
                  )}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            <ButtonBase
              variant="secondary"
              onClick={() => setOpenEditarModal(false)}
            >
              Cancelar
            </ButtonBase>
            <ButtonBase
              variant="primary"
              disabled={isSavingDevice}
              onClick={guardarEdicionDevice}
            >
              {isSavingDevice ? "Guardando..." : "Guardar cambios"}
            </ButtonBase>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
