"use client";

import useSWR, { mutate } from "swr";
import { useState, useMemo } from "react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import TablaBase, { Column } from "@/app/components/tablas/TablaBase";
import ModalBase from "@/app/components/modal/ModalBase";
import { Pencil, Trash2, Download, Plus, Search } from "lucide-react";
import axios from "axios";
import InputBase1 from "@/app/components/ui/InputBase1";
import ModalEliminar from "@/app/components/modal/ModalEliminar";
import toast from "react-hot-toast";
import { Vehiculo } from "@/app/interfaces/vehiculo.interface";
import { Role } from "@/app/constants/roles";
import { getUnidadesApi } from "@/app/services/unidadesApi";
import PanelHeader from "@/app/components/nav/PanelHeader";
import * as XLSX from "xlsx";

type Props = {
  role: Role;
  actor?: string;
};

export default function UnidadesClient({ role, actor }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("todos");
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"editar" | "agregar">("agregar");
  const [seleccionado, setSeleccionado] = useState<Vehiculo | null>(null);

  const [openEliminarModal, setOpenEliminarModal] = useState(false);
  const [vehiculoAEliminar, setVehiculoAEliminar] = useState<Vehiculo | null>(null);
  const [vehiculoOriginal, setVehiculoOriginal] = useState<Vehiculo | null>(null);
  const [submitAttempt, setSubmitAttempt] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [motivoEliminar, setMotivoEliminar] = useState("");
  const [submitAttemptEliminar, setSubmitAttemptEliminar] = useState(false);
  const motivoValido = (m: string) => m.trim().length >= 6;

  const api = getUnidadesApi(role);

  const fetchUnidades = async () => {
    const res = await axios.get<Vehiculo[]>(api.list);
    return res.data;
  };

  const { data: vehiculos = [], isLoading } = useSWR(
    role ? ["unidades", role] : null,
    fetchUnidades,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const isActivo = (row: Vehiculo) => row.isActive === "1" || row.habilitada === "1";

  const total = vehiculos.length;
  const totalActivos = useMemo(() => vehiculos.filter(isActivo).length, [vehiculos]);
  const totalInactivos = total - totalActivos;

  const vehiculosFiltrados = useMemo(() => {
    return vehiculos.filter((u) => {
      const activo = isActivo(u);
      if (filtroEstado === "activos" && !activo) return false;
      if (filtroEstado === "inactivos" && activo) return false;

      if (!busqueda) return true;
      return [u.deviceID, u.accountID, u.equipmentType, u.uniqueID, u.simPhoneNumber, u.imeiNumber]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase());
    });
  }, [busqueda, filtroEstado, vehiculos]);

  const vehiculosOrdenados = useMemo(() => {
    return [...vehiculosFiltrados].sort((a, b) => {
      const aActivo = isActivo(a);
      const bActivo = isActivo(b);
      if (aActivo !== bActivo) return aActivo ? -1 : 1;
      return a.deviceID.localeCompare(b.deviceID, undefined, { numeric: true });
    });
  }, [vehiculosFiltrados]);

  const abrirEditar = (vehiculo: Vehiculo) => {
    setSeleccionado(vehiculo);
    setVehiculoOriginal({ ...vehiculo });
    setModo("editar");
    setOpenModal(true);
    setSubmitAttempt(false);
    setMotivo("");
  };

  const abrirAgregar = () => {
    setSeleccionado(null);
    setModo("agregar");
    setOpenModal(true);
    setSubmitAttempt(false);
    setMotivo("");
  };

  const abrirEliminar = (vehiculo: Vehiculo) => {
    setVehiculoAEliminar(vehiculo);
    setOpenEliminarModal(true);
    setMotivoEliminar("");
    setSubmitAttemptEliminar(false);
  };

  const cerrarModal = () => {
    setOpenModal(false);
    setSubmitAttempt(false);
  };

  const exportarExcel = () => {
    if (vehiculosOrdenados.length === 0) {
      toast.error("No hay registros para exportar");
      return;
    }
    const dataToExport = vehiculosOrdenados.map((v, i) => ({
      "N°": i + 1,
      Cuenta: v.accountID || "",
      Placa: v.deviceID || "",
      "Tipo de Equipo": v.equipmentType || "",
      "Unique ID": v.uniqueID || "",
      "Device Code": v.deviceCode || "",
      "Número Chip": v.simPhoneNumber || "",
      IMEI: v.imeiNumber || "",
      Estado: isActivo(v) ? "ACTIVO" : "INACTIVO",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Unidades");
    XLSX.writeFile(workbook, `Unidades_Velsat_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Archivo Excel exportado con éxito");
  };

  const guardarVehiculo = async (vehiculo: Vehiculo) => {
    setLoading(true);
    const payload = {
      accountID: vehiculo.accountID,
      deviceID: vehiculo.deviceID,
      uniqueID: vehiculo.uniqueID,
      simPhoneNumber: vehiculo.simPhoneNumber,
      imeiNumber: vehiculo.imeiNumber,
      equipmentType: vehiculo.equipmentType,
      deviceCode: vehiculo.deviceCode,
      ...(modo === "editar" && vehiculoOriginal?.deviceID !== vehiculo.deviceID
        ? { oldDeviceID: vehiculoOriginal?.deviceID }
        : {}),
      // La cuenta ahora también se puede cambiar: hay que decirle al API cuál era
      ...(modo === "editar" && vehiculoOriginal?.accountID !== vehiculo.accountID
        ? { oldAccountID: vehiculoOriginal?.accountID }
        : {}),
    };

    try {
      if (modo === "editar") {
        await axios.put(
          api.update(vehiculoOriginal?.deviceID, vehiculoOriginal?.accountID, actor, motivo),
          payload
        );
        toast.success("Unidad actualizada correctamente");
      } else {
        await axios.post(api.insert(actor, motivo), payload);
        toast.success("Unidad agregada correctamente");
      }
      setOpenModal(false);
      setSeleccionado(null);
      setMotivo("");
      mutate(["unidades", role]);
    } catch {
      toast.error("No es posible guardar cambios");
    } finally {
      setLoading(false);
    }
  };

  const eliminarVehiculo = async () => {
    if (!vehiculoAEliminar) return;
    setSubmitAttemptEliminar(true);
    if (!motivoValido(motivoEliminar)) return;
    setLoading(true);
    try {
      await axios.delete(api.delete(vehiculoAEliminar.deviceID, vehiculoAEliminar.accountID, actor, motivoEliminar));
      toast.success("Vehículo eliminado");
      setOpenEliminarModal(false);
      setVehiculoAEliminar(null);
      setMotivoEliminar("");
      mutate(["unidades", role]);
    } catch {
      toast.error("Error al eliminar vehículo");
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Vehiculo>[] = [
    {
      key: "accountID",
      label: "ACCOUNT",
      width: "15%",
      render: (row) => (
        <span className="font-mono text-[13px] text-[#ECECEE] font-medium">
          {row.accountID}
        </span>
      ),
    },
    {
      key: "deviceID",
      label: "PLACA",
      width: "15%",
      render: (row) => (
        <span className="font-mono text-[13.5px] text-[#ECECEE] font-semibold tracking-wide">
          {row.deviceID}
        </span>
      ),
    },
    {
      key: "equipmentType",
      label: "TIPO EQUIPO",
      width: "16%",
      render: (row) => (
        <span className="text-[13px] text-[#CFCFD3]">
          {row.equipmentType || "—"}
        </span>
      ),
    },
    {
      key: "uniqueID",
      label: "UNIQUE ID",
      width: "15%",
      render: (row) => (
        <span className="font-mono text-[12.5px] text-[#9B9CA1]">
          {row.uniqueID || "—"}
        </span>
      ),
    },
    {
      key: "deviceCode",
      label: "DEVICE CODE",
      width: "13%",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#9B9CA1]">
          {row.deviceCode || "—"}
        </span>
      ),
    },
    {
      key: "simPhoneNumber",
      label: "NÚMERO CHIP",
      width: "14%",
      render: (row) => (
        <span className="font-mono text-[12.5px] text-[#CFCFD3]">
          {row.simPhoneNumber || "—"}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "ESTADO",
      width: "11%",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase ${
            isActivo(row) ? "text-[#4ADE80]" : "text-[#A6A7AB]"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isActivo(row) ? "bg-[#4ADE80]" : "bg-[#A6A7AB]"
            }`}
          />
          {isActivo(row) ? "ACTIVO" : "INACTIVO"}
        </span>
      ),
    },
    {
      key: "acciones",
      label: "ACCIONES",
      width: "88px",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => abrirEditar(row)}
            title="Editar unidad"
            className="w-[32px] h-[32px] rounded-[7px] bg-[#1A1210] border border-[#5A2A18] text-[#F05A28] hover:border-[#F05A28] hover:bg-[#251814] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Pencil size={14} />
          </button>

          <button
            disabled={!isActivo(row)}
            onClick={() => abrirEliminar(row)}
            title={isActivo(row) ? "Eliminar unidad" : "Unidad inactiva"}
            className={`w-[32px] h-[32px] rounded-[7px] bg-[#1A1210] border border-[#5A2A18] text-[#F05A28] flex items-center justify-center transition-colors ${
              isActivo(row)
                ? "hover:border-[#F05A28] hover:bg-[#251814] cursor-pointer"
                : "opacity-30 cursor-not-allowed pointer-events-none"
            }`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#121214]">
      {/* ---------- HEADER (68px) ---------- */}
      <PanelHeader
        title={
          <span>
            Gestión de <span className="text-[#F05A28]">Unidades</span>
          </span>
        }
        subtitle={`${total} vehículos registrados · ${totalActivos} activos`}
        role={role}
      />

      {/* ---------- TABLA ---------- */}
      <div className="flex-1 min-h-0 p-6 overflow-hidden">
        <TablaBase
          leftActions={
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <div className="relative w-[340px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777C] pointer-events-none"
                />
                <input
                  type="search"
                  placeholder="Buscar por Account, Placa, Tipo Equipo o UniqueID"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full h-[36px] pl-9 pr-3.5 bg-[#121214] border border-[#2D2E32] rounded-[8px] text-[13px] text-[#ECECEE] placeholder-[#76777C] outline-none transition-colors focus:border-[#F05A28]"
                />
              </div>

              <div className="inline-flex items-center p-1 bg-[#121214] border border-[#26272B] rounded-[8px] gap-1">
                <button
                  type="button"
                  onClick={() => setFiltroEstado("todos")}
                  className={`px-3 py-1 text-xs rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                    filtroEstado === "todos"
                      ? "bg-[#212226] text-[#ECECEE] font-medium"
                      : "text-[#76777C] hover:text-[#ECECEE]"
                  }`}
                >
                  <span>Todos</span>
                  <span className="font-mono text-[11px] text-[#9B9CA1]">{total}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroEstado("activos")}
                  className={`px-3 py-1 text-xs rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                    filtroEstado === "activos"
                      ? "bg-[#212226] text-[#ECECEE] font-medium"
                      : "text-[#76777C] hover:text-[#ECECEE]"
                  }`}
                >
                  <span>Activos</span>
                  <span className="font-mono text-[11px] text-[#9B9CA1]">{totalActivos}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroEstado("inactivos")}
                  className={`px-3 py-1 text-xs rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                    filtroEstado === "inactivos"
                      ? "bg-[#212226] text-[#ECECEE] font-medium"
                      : "text-[#76777C] hover:text-[#ECECEE]"
                  }`}
                >
                  <span>Inactivos</span>
                  <span className="font-mono text-[11px] text-[#9B9CA1]">{totalInactivos}</span>
                </button>
              </div>
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
                onClick={abrirAgregar}
                className="h-[36px] px-4 rounded-[8px] bg-[#F05A28] hover:bg-[#FF6A35] text-white font-semibold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-none"
              >
                <Plus size={16} />
                <span>Nueva unidad</span>
              </button>
            </>
          }
          columns={columns}
          data={vehiculosOrdenados}
          loading={isLoading}
        />
      </div>

      {/* ---------- MODAL AGREGAR / EDITAR ---------- */}
      <ModalBase
        open={openModal}
        title={modo === "editar" ? "Editar Unidad" : "Agregar Nueva Unidad"}
        onClose={cerrarModal}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase1
            label="Servidor"
            value={role}
            displayValue={role === "Servidor_125_2" ? "Urbano 125" : (role ? role.replace("_", " ") : "Servidor 107")}
            desabilitar
          />

          <InputBase1
            label="Account"
            placeholder="Account ID"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.accountID || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, accountID: e.target.value }
                  : ({ accountID: e.target.value } as Vehiculo)
              )
            }
          />

          <InputBase1
            label="Placa (Device ID)"
            placeholder="Ej: ABC-123"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.deviceID || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, deviceID: e.target.value }
                  : ({ deviceID: e.target.value } as Vehiculo)
              )
            }
          />

          <InputBase1
            label="Unique ID (IMEI)"
            placeholder="Unique ID"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.uniqueID || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, uniqueID: e.target.value }
                  : ({ uniqueID: e.target.value } as Vehiculo)
              )
            }
          />

          <InputBase1
            label="Tipo Equipo"
            placeholder="Ej: Camioneta, Moto, etc."
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.equipmentType || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, equipmentType: e.target.value }
                  : ({ equipmentType: e.target.value } as Vehiculo)
              )
            }
          />

          <InputBase1
            label="Device Code"
            placeholder="Ej: gt06n, gps103a"
            defaultValue={seleccionado?.deviceCode || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, deviceCode: e.target.value }
                  : ({ deviceCode: e.target.value } as Vehiculo)
              )
            }
          />

          <InputBase1
            label="Número Chip"
            placeholder="987654321"
            defaultValue={seleccionado?.simPhoneNumber || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, simPhoneNumber: e.target.value }
                  : ({ simPhoneNumber: e.target.value } as Vehiculo)
              )
            }
          />

          <InputBase1
            label="IMEI Number"
            placeholder="IMEI de 15 dígitos"
            defaultValue={seleccionado?.imeiNumber || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, imeiNumber: e.target.value }
                  : ({ imeiNumber: e.target.value } as Vehiculo)
              )
            }
          />

          <div className="col-span-2">
            <InputBase1
              label={modo === "editar" ? "Motivo del cambio" : "Motivo del alta"}
              placeholder="Explica por qué se realiza esta acción (mín. 6 caracteres)"
              required
              submitAttempt={submitAttempt}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            {submitAttempt && motivo.trim().length > 0 && !motivoValido(motivo) && (
              <span className="text-[11px] text-[#F05A28] mt-1 block">
                El motivo debe tener al menos 6 caracteres
              </span>
            )}
          </div>

          <div className="col-span-2 flex justify-between gap-4 mt-4 pt-3 border-t border-[#26272B]">
            <ButtonBase variant="secondary" onClick={() => setOpenModal(false)}>
              Cancelar
            </ButtonBase>

            <ButtonBase
              onClick={() => {
                setSubmitAttempt(true);
                if (
                  !seleccionado?.accountID ||
                  !seleccionado?.deviceID ||
                  !seleccionado?.uniqueID ||
                  !seleccionado?.equipmentType ||
                  !motivoValido(motivo)
                ) {
                  return;
                }
                guardarVehiculo(seleccionado);
              }}
              variant="primary"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar unidad"}
            </ButtonBase>
          </div>
        </div>
      </ModalBase>

      {/* ---------- MODAL ELIMINAR ---------- */}
      <ModalEliminar
        open={openEliminarModal}
        title="Eliminar Unidad"
        onClose={() => setOpenEliminarModal(false)}
        tamaño="w-full max-w-sm"
      >
        <div className="flex flex-col items-center justify-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-[#1A1210] border border-[#5A2A18] flex items-center justify-center">
            <Trash2 size={20} className="text-[#F05A28]" />
          </div>

          <p className="text-[13.5px] text-[#CFCFD3] m-0">
            ¿Está seguro de eliminar la unidad con placa?
            <br />
            <strong className="text-[#ECECEE] text-base font-mono block mt-1">
              {vehiculoAEliminar?.deviceID}
            </strong>
          </p>

          <div className="w-full text-left">
            <InputBase1
              label="Motivo de la eliminación"
              placeholder="Explica por qué se elimina (mín. 6 caracteres)"
              required
              submitAttempt={submitAttemptEliminar}
              value={motivoEliminar}
              onChange={(e) => setMotivoEliminar(e.target.value)}
            />
            {submitAttemptEliminar && motivoEliminar.trim().length > 0 && !motivoValido(motivoEliminar) && (
              <span className="text-[11px] text-[#F05A28] mt-1 block">
                El motivo debe tener al menos 6 caracteres
              </span>
            )}
          </div>

          <div className="flex gap-3 w-full justify-end mt-2">
            <ButtonBase
              variant="secondary"
              onClick={() => setOpenEliminarModal(false)}
            >
              Cancelar
            </ButtonBase>

            <ButtonBase
              variant="danger"
              disabled={loading}
              onClick={eliminarVehiculo}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </ButtonBase>
          </div>
        </div>
      </ModalEliminar>
    </div>
  );
}