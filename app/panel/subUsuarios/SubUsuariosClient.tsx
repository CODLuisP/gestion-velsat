"use client";

import useSWR, { mutate } from "swr";
import { useState, useMemo } from "react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import TablaBase, { Column } from "@/app/components/tablas/TablaBase";
import ModalBase from "@/app/components/modal/ModalBase";
import { Pencil, Trash2, Download, Plus, Search } from "lucide-react";
import axios from "axios";
import { SubUsuario } from "@/app/interfaces/usuario.interface";
import InputBase1 from "@/app/components/ui/InputBase1";
import ModalEliminar from "@/app/components/modal/ModalEliminar";
import toast from "react-hot-toast";
import { Role } from "@/app/constants/roles";
import { getSubUsuariosApi } from "@/app/services/subUsuariosApi";
import PanelHeader from "@/app/components/nav/PanelHeader";
import * as XLSX from "xlsx";

type Props = {
  role: Role;
  actor?: string;
};

export default function SubUsuariosClient({ role, actor }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("todos");
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"editar" | "agregar">("agregar");
  const [seleccionado, setSeleccionado] = useState<SubUsuario | null>(null);

  const [openEliminarModal, setOpenEliminarModal] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<SubUsuario | null>(null);

  const [submitAttempt, setSubmitAttempt] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [motivoEliminar, setMotivoEliminar] = useState("");
  const [submitAttemptEliminar, setSubmitAttemptEliminar] = useState(false);
  const motivoValido = (m: string) => m.trim().length >= 6;

  const api = getSubUsuariosApi(role);

  const fetchSubUsuarios = async () => {
    const res = await axios.get<SubUsuario[]>(api.list);
    return res.data;
  };

  const { data: usuarios = [], isLoading } = useSWR(
    role ? ["subusuarios", role] : null,
    fetchSubUsuarios,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const total = usuarios.length;
  const totalActivos = useMemo(() => usuarios.filter((u) => u.status === "1").length, [usuarios]);
  const totalInactivos = total - totalActivos;

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const isActivo = u.status === "1";
      if (filtroEstado === "activos" && !isActivo) return false;
      if (filtroEstado === "inactivos" && isActivo) return false;

      if (!busqueda) return true;
      return [u.userId, u.deviceName, u.deviceID]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase());
    });
  }, [busqueda, filtroEstado, usuarios]);

  const usuariosOrdenados = useMemo(() => {
    return [...usuariosFiltrados].sort((a, b) => {
      if (a.status !== b.status) return a.status === "1" ? -1 : 1;
      return b.id - a.id;
    });
  }, [usuariosFiltrados]);

  const abrirEditar = (usuario: SubUsuario) => {
    setSubmitAttempt(false);
    setSeleccionado(usuario);
    setModo("editar");
    setOpenModal(true);
    setMotivo("");
  };

  const abrirAgregar = () => {
    setSubmitAttempt(false);
    setSeleccionado(null);
    setModo("agregar");
    setOpenModal(true);
    setMotivo("");
  };

  const abrirEliminar = (usuario: SubUsuario) => {
    setUsuarioAEliminar(usuario);
    setOpenEliminarModal(true);
    setMotivoEliminar("");
    setSubmitAttemptEliminar(false);
  };

  const cerrarModal = () => {
    setOpenModal(false);
    setSubmitAttempt(false);
  };

  const exportarExcel = () => {
    if (usuariosOrdenados.length === 0) {
      toast.error("No hay registros para exportar");
      return;
    }
    const dataToExport = usuariosOrdenados.map((u, i) => ({
      "N°": i + 1,
      "User ID": u.userId || "",
      "Device Name": u.deviceName || "",
      "Device ID": u.deviceID || "",
      Estado: u.status === "1" ? "ACTIVO" : "INACTIVO",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SubUsuarios");
    XLSX.writeFile(workbook, `SubUsuarios_Velsat_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Archivo Excel exportado con éxito");
  };

  const guardarUsuario = async (usuario: SubUsuario) => {
    setLoading(true);
    const payloadG = { userId: usuario.userId, deviceName: usuario.deviceName, deviceID: usuario.deviceID };
    const payloadU = { id: usuario.id, userId: usuario.userId, devicename: usuario.deviceName, deviceID: usuario.deviceID };

    try {
      if (modo === "editar" && seleccionado) {
        await axios.put(api.update(actor, motivo), payloadU);
        toast.success("Sub usuario actualizado correctamente");
      } else {
        await axios.post(api.insert(actor, motivo), payloadG);
        toast.success("Sub usuario guardado correctamente");
      }
      setOpenModal(false);
      setSeleccionado(null);
      setMotivo("");
      mutate(["subusuarios", role]);
    } catch {
      toast.error("No es posible guardar los cambios");
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async () => {
    if (!usuarioAEliminar) return;
    setSubmitAttemptEliminar(true);
    if (!motivoValido(motivoEliminar)) return;
    setLoading(true);
    try {
      await axios.delete(api.delete(usuarioAEliminar.id.toString(), actor, motivoEliminar), {
        data: { id: usuarioAEliminar.id },
      });
      toast.success("Sub usuario eliminado");
      setOpenEliminarModal(false);
      setUsuarioAEliminar(null);
      setMotivoEliminar("");
      mutate(["subusuarios", role]);
    } catch {
      toast.error("Error al eliminar sub usuario");
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<SubUsuario>[] = [
    {
      key: "userId",
      label: "USER ID",
      width: "25%",
      render: (row) => (
        <span className="font-mono text-[13px] text-[#ECECEE] font-medium">
          {row.userId}
        </span>
      ),
    },
    {
      key: "deviceName",
      label: "DEVICE NAME",
      width: "30%",
      render: (row) => (
        <span className="text-[13.5px] text-[#CFCFD3] font-medium">
          {row.deviceName}
        </span>
      ),
    },
    {
      key: "deviceID",
      label: "DEVICE ID",
      width: "25%",
      render: (row) => (
        <span className="font-mono text-[13px] text-[#9B9CA1]">
          {row.deviceID}
        </span>
      ),
    },
    {
      key: "status",
      label: "ESTADO",
      width: "12%",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase ${
            row.status === "1" ? "text-[#4ADE80]" : "text-[#A6A7AB]"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              row.status === "1" ? "bg-[#4ADE80]" : "bg-[#A6A7AB]"
            }`}
          />
          {row.status === "1" ? "ACTIVO" : "INACTIVO"}
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
            title="Editar sub usuario"
            className="w-[32px] h-[32px] rounded-[7px] bg-[#1A1210] border border-[#5A2A18] text-[#F05A28] hover:border-[#F05A28] hover:bg-[#251814] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Pencil size={14} />
          </button>

          <button
            disabled={row.status !== "1"}
            onClick={() => abrirEliminar(row)}
            title={row.status === "1" ? "Eliminar sub usuario" : "Inactivo"}
            className={`w-[32px] h-[32px] rounded-[7px] bg-[#1A1210] border border-[#5A2A18] text-[#F05A28] flex items-center justify-center transition-colors ${
              row.status === "1"
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
            Gestión de <span className="text-[#F05A28]">Sub Usuarios</span>
          </span>
        }
        subtitle={`${total} sub usuarios registrados · ${totalActivos} activos`}
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
                  placeholder="Buscar por User ID, Device Name o Device ID"
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
                <span>Nuevo sub usuario</span>
              </button>
            </>
          }
          columns={columns}
          data={usuariosOrdenados}
          loading={isLoading}
        />
      </div>

      {/* ---------- MODAL AGREGAR / EDITAR ---------- */}
      <ModalBase
        open={openModal}
        title={modo === "editar" ? "Editar Sub Usuario" : "Agregar Nuevo Sub Usuario"}
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
            label="User ID"
            desabilitar={modo === "editar"}
            placeholder="User ID"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.userId || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, userId: e.target.value }
                  : ({ userId: e.target.value } as SubUsuario)
              )
            }
          />

          <InputBase1
            label="Device Name"
            placeholder="Device Name"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.deviceName || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, deviceName: e.target.value }
                  : ({ deviceName: e.target.value } as SubUsuario)
              )
            }
          />

          <InputBase1
            label="Device ID"
            placeholder="Device ID"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.deviceID || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, deviceID: e.target.value }
                  : ({ deviceID: e.target.value } as SubUsuario)
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
                  !seleccionado?.userId ||
                  !seleccionado?.deviceName ||
                  !seleccionado?.deviceID ||
                  !motivoValido(motivo)
                ) {
                  return;
                }
                guardarUsuario(seleccionado);
              }}
              variant="primary"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar sub usuario"}
            </ButtonBase>
          </div>
        </div>
      </ModalBase>

      {/* ---------- MODAL ELIMINAR ---------- */}
      <ModalEliminar
        open={openEliminarModal}
        title="Eliminar Sub Usuario"
        onClose={() => setOpenEliminarModal(false)}
        tamaño="w-full max-w-sm"
      >
        <div className="flex flex-col items-center justify-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-[#1A1210] border border-[#5A2A18] flex items-center justify-center">
            <Trash2 size={20} className="text-[#F05A28]" />
          </div>

          <p className="text-[13.5px] text-[#CFCFD3] m-0">
            ¿Está seguro de eliminar el sub usuario?
            <br />
            <strong className="text-[#ECECEE] text-base block mt-1">
              {usuarioAEliminar?.deviceName}
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
              onClick={eliminarUsuario}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </ButtonBase>
          </div>
        </div>
      </ModalEliminar>
    </div>
  );
}