"use client";

import useSWR, { mutate } from "swr";
import { useState, useMemo } from "react";
import TablaBase, { Column } from "@/app/components/tablas/TablaBase";
import { RefreshCw, Download, Search } from "lucide-react";
import axios from "axios";
import { VehiculoConDescon } from "@/app/interfaces/vehiculo.interface";
import { Role } from "@/app/constants/roles";
import { getUnidadesConexApi } from "@/app/services/unidadesConexApi";
import UnixNormal from "@/app/components/fecha/UnixNormal";
import ColumnFilterHeader from "@/app/components/tablas/ColumnFilterHeader";
import PanelHeader from "@/app/components/nav/PanelHeader";
import * as XLSX from "xlsx";

type Props = {
  role: Role;
};

export default function UnidadesConexClient({ role }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroPlaca, setFiltroPlaca] = useState<Set<string> | null>(null);
  const [filtroUsuario, setFiltroUsuario] = useState<Set<string> | null>(null);
  const [filtroModelo, setFiltroModelo] = useState<Set<string> | null>(null);

  const api = getUnidadesConexApi(role);

  const fetchUnidades = async () => {
    const res = await axios.get<VehiculoConDescon[]>(api.listUnidadesConex);
    return res.data;
  };

  const { data: vehiculosConex = [], isLoading } = useSWR(
    role ? ["unidadesConex", role] : null,
    fetchUnidades,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const gpsModelMap: Record<string, string> = {
    gt06n: "GT",
    gps103a: "TK",
    gps103b: "TK",
  };

  const getModeloLabel = (row: VehiculoConDescon) => {
    const model = row.deviceCode?.toLowerCase();
    return gpsModelMap[model] ?? row.deviceCode ?? "-";
  };

  const opcionesPlaca = useMemo(
    () => Array.from(new Set(vehiculosConex.map((u) => u.deviceID).filter(Boolean))).sort(),
    [vehiculosConex]
  );
  const opcionesUsuario = useMemo(
    () => Array.from(new Set(vehiculosConex.map((u) => u.accountID).filter(Boolean))).sort(),
    [vehiculosConex]
  );
  const opcionesModelo = useMemo(
    () => Array.from(new Set(vehiculosConex.map((u) => getModeloLabel(u)).filter(Boolean))).sort(),
    [vehiculosConex]
  );

  const vehiculosFiltrados = useMemo(() => {
    return vehiculosConex.filter((u) => {
      if (filtroPlaca && !filtroPlaca.has(u.deviceID)) return false;
      if (filtroUsuario && !filtroUsuario.has(u.accountID)) return false;
      if (filtroModelo && !filtroModelo.has(getModeloLabel(u))) return false;

      if (!busqueda) return true;
      const texto = [
        u.deviceID,
        u.accountID,
        getModeloLabel(u),
        u.imeiNumber,
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(busqueda.toLowerCase());
    });
  }, [busqueda, filtroPlaca, filtroUsuario, filtroModelo, vehiculosConex]);

  const exportarExcel = () => {
    if (vehiculosFiltrados.length === 0) {
      return;
    }
    const dataToExport = vehiculosFiltrados.map((u, i) => ({
      "N°": i + 1,
      Placa: u.deviceID || "",
      Usuario: u.accountID || "",
      Velocidad: Number(u.lastValidSpeed || 0).toFixed(0),
      "Modelo GPS": getModeloLabel(u),
      IMEI: u.imeiNumber || "",
      Latitud: Number(u.lastValidLatitude || 0).toFixed(5),
      Longitud: Number(u.lastValidLongitude || 0).toFixed(5),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Conexion_Desconexion");
    XLSX.writeFile(workbook, `Conexion_Desconexion_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns: Column<VehiculoConDescon>[] = [
    {
      key: "deviceID",
      width: "12%",
      label: (
        <ColumnFilterHeader
          label="PLACA"
          options={opcionesPlaca}
          selected={filtroPlaca}
          onChange={setFiltroPlaca}
        />
      ),
      render: (row) => (
        <span className="font-mono text-[13px] text-[#ECECEE] font-semibold">
          {row.deviceID}
        </span>
      ),
    },
    {
      key: "accountID",
      width: "14%",
      label: (
        <ColumnFilterHeader
          label="USUARIO"
          options={opcionesUsuario}
          selected={filtroUsuario}
          onChange={setFiltroUsuario}
        />
      ),
      render: (row) => (
        <span className="font-mono text-[13px] text-[#CFCFD3]">
          {row.accountID}
        </span>
      ),
    },
    {
      key: "lastValidSpeed",
      label: "VELOCIDAD",
      width: "9%",
      render: (row) => (
        <span className="font-mono text-[12.5px] text-[#9B9CA1]">
          {Number(row.lastValidSpeed || 0).toFixed(0)} km/h
        </span>
      ),
    },
    {
      key: "lastGPSTimestamp",
      label: "ÚLT. HORA GPS",
      width: "16%",
      render: (row) => (
        <UnixNormal creationTime={row.lastGPSTimestamp} show="both" />
      ),
    },
    {
      key: "deviceTIme",
      label: "ÚLT. HORA CELULAR",
      width: "16%",
      render: (row) =>
        row.deviceTIme ? (
          <UnixNormal creationTime={row.deviceTIme} show="both" />
        ) : (
          <span className="text-[#76777C] font-mono">—</span>
        ),
    },
    {
      key: "tiempoDesconex",
      label: "T. DESCONEX.",
      width: "13%",
      render: (row) => (
        <UnixNormal creationTime={row.lastGPSTimestamp} diffWithStatus />
      ),
    },
    {
      key: "deviceCode",
      width: "11%",
      label: (
        <ColumnFilterHeader
          label="MODELO"
          options={opcionesModelo}
          selected={filtroModelo}
          onChange={setFiltroModelo}
        />
      ),
      render: (row) => (
        <span className="font-mono text-[12px] text-[#9B9CA1]">
          {getModeloLabel(row)}
        </span>
      ),
    },
    {
      key: "imeiNumber",
      label: "IMEI",
      width: "14%",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#9B9CA1]">
          {row.imeiNumber || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#121214]">
      {/* ---------- HEADER (68px) ---------- */}
      <PanelHeader
        title={
          <span>
            Unidades <span className="text-[#F05A28]">Conexión / Desconexión</span>
          </span>
        }
        subtitle={`${vehiculosConex.length} unidades monitoreadas`}
        role={role}
      />

      {/* ---------- TABLA ---------- */}
      <div className="flex-1 min-h-0 p-6 overflow-hidden">
        <TablaBase
          leftActions={
            <div className="relative w-[380px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777C] pointer-events-none"
              />
              <input
                type="search"
                placeholder="Buscar por Placa, Usuario, Modelo o IMEI"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full h-[36px] pl-9 pr-3.5 bg-[#121214] border border-[#2D2E32] rounded-[8px] text-[13px] text-[#ECECEE] placeholder-[#76777C] outline-none transition-colors focus:border-[#F05A28]"
              />
            </div>
          }
          rightActions={
            <>
              <button
                type="button"
                onClick={exportarExcel}
                className="h-[36px] px-3.5 rounded-[8px] bg-[#161719] border border-[#26272B] text-[#ECECEE] hover:bg-[#212226] hover:border-[#2D2E32] transition-colors text-[13px] font-medium flex items-center gap-2 cursor-pointer"
              >
                <Download size={15} />
                <span>Exportar</span>
              </button>

              <button
                type="button"
                onClick={() => mutate(["unidadesConex", role], undefined, { revalidate: true })}
                disabled={isLoading}
                className="h-[36px] px-4 rounded-[8px] bg-[#F05A28] hover:bg-[#FF6A35] text-white font-semibold text-[13px] flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-none"
              >
                <RefreshCw
                  size={14}
                  className={isLoading ? "animate-spin" : ""}
                />
                <span>{isLoading ? "Actualizando..." : "Actualizar"}</span>
              </button>
            </>
          }
          columns={columns}
          data={vehiculosFiltrados}
          loading={isLoading}
        />
      </div>
    </div>
  );
}