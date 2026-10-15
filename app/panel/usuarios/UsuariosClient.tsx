"use client";

import useSWR, { mutate } from "swr";
import { useState, useMemo } from "react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import TablaBase, { Column } from "@/app/components/tablas/TablaBase";
import ModalBase from "@/app/components/modal/ModalBase";
import { Pencil, Trash2, Download, Plus, Search, Copy } from "lucide-react";
import axios from "axios";
import { Usuario } from "@/app/interfaces/usuario.interface";
import PasswordCell from "@/app/components/password/PasswordCell";
import InputBase1 from "@/app/components/ui/InputBase1";
import ModalEliminar from "@/app/components/modal/ModalEliminar";
import toast from "react-hot-toast";
import { getUsuariosApi } from "@/app/services/usuariosApi";
import { Role } from "@/app/constants/roles";
import PanelHeader from "@/app/components/nav/PanelHeader";
import * as XLSX from "xlsx";

type Props = {
  role: Role;
  actor?: string;
};

const AVATAR_PALETTES = [
  { bg: "#311E3B", text: "#D8B4FE" }, // purple
  { bg: "#382916", text: "#FCD34D" }, // amber
  { bg: "#361D1D", text: "#FCA5A5" }, // red/rose
  { bg: "#182E2B", text: "#6EE7B7" }, // teal
  { bg: "#1E293B", text: "#93C5FD" }, // blue
  { bg: "#362316", text: "#FDBA74" }, // orange
  { bg: "#2E1F38", text: "#F472B6" }, // pink
];

function getAvatarStyle(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getInitials(name: string) {
  if (!name) return "US";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getTipoCliente(name: string, ruc: string) {
  const upper = (name || "").toUpperCase();
  const cleanRuc = (ruc || "").trim();
  if (
    cleanRuc.startsWith("20") ||
    upper.includes("E.I.R.L") ||
    upper.includes("EIRL") ||
    upper.includes("S.A.C") ||
    upper.includes("SAC") ||
    upper.includes("S.R.L") ||
    upper.includes("SRL") ||
    upper.includes("S.A") ||
    upper.includes("EMPRESA") ||
    upper.includes("SERVICENTRO") ||
    upper.includes("TRANSPORTES")
  ) {
    return "Empresa";
  }
  return "Persona natural";
}

function formatUnixDate(unix: number) {
  if (!unix) return "—";
  const date = new Date(Number(unix) * 1000);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function UsuariosClient({ role, actor }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("todos");
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"editar" | "agregar">("agregar");
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);

  const [openEliminarModal, setOpenEliminarModal] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);

  const [submitAttempt, setSubmitAttempt] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [motivoEliminar, setMotivoEliminar] = useState("");
  const [submitAttemptEliminar, setSubmitAttemptEliminar] = useState(false);
  const motivoValido = (m: string) => m.trim().length >= 6;

  const api = getUsuariosApi(role);

  const fetchUsuarios = async () => {
    const res = await axios.get<Usuario[]>(api.list);
    return res.data;
  };

  const { data: usuarios = [], isLoading } = useSWR(
    role ? ["usuarios", role] : null,
    fetchUsuarios,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  // Totales
  const totalUsuarios = usuarios.length;
  const totalActivos = useMemo(() => usuarios.filter((u) => u.isActive).length, [usuarios]);
  const totalInactivos = totalUsuarios - totalActivos;

  // Filtrado
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroEstado === "activos" && !u.isActive) return false;
      if (filtroEstado === "inactivos" && u.isActive) return false;

      if (!busqueda) return true;
      const text = [u.description, u.ruc, u.accountID, u.contactEmail, u.contactPhone]
        .join(" ")
        .toLowerCase();
      return text.includes(busqueda.toLowerCase());
    });
  }, [busqueda, filtroEstado, usuarios]);

  // Ordenamiento: Activos primero, luego por creación descendente
  const usuariosOrdenados = useMemo(() => {
    return [...usuariosFiltrados].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.creationTime - a.creationTime;
    });
  }, [usuariosFiltrados]);

  const abrirEditar = (usuario: Usuario) => {
    setSeleccionado(usuario);
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

  const abrirEliminar = (usuario: Usuario) => {
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
      Cliente: u.description || "",
      Tipo: getTipoCliente(u.description, u.ruc),
      "Account ID": u.accountID || "",
      Password: u.password || "",
      "DNI / RUC": u.ruc || "",
      Correo: u.contactEmail || "",
      Teléfono: u.contactPhone || "",
      "Fecha Creación": formatUnixDate(u.creationTime),
      Estado: u.isActive ? "ACTIVO" : "INACTIVO",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
    XLSX.writeFile(workbook, `Usuarios_Velsat_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Archivo Excel exportado con éxito");
  };

  const guardarUsuario = async (usuario: Usuario) => {
    setLoading(true);
    const payload = {
      accountID: usuario.accountID,
      password: usuario.password,
      contactPhone: usuario.contactPhone,
      contactEmail: usuario.contactEmail,
      description: usuario.description,
      ruc: usuario.ruc,
    };
    try {
      if (modo === "editar" && seleccionado) {
        await axios.put(api.update(actor, motivo), payload);
        toast.success("Usuario actualizado correctamente");
      } else {
        await axios.post(api.insert(actor, motivo), payload);
        toast.success("Usuario guardado correctamente");
      }
      setOpenModal(false);
      setSeleccionado(null);
      setMotivo("");
      mutate(["usuarios", role]);
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
      await axios.delete(api.delete(usuarioAEliminar.accountID, actor, motivoEliminar), {
        data: { accountID: usuarioAEliminar.accountID },
      });
      toast.success("Usuario eliminado");
      setOpenEliminarModal(false);
      setUsuarioAEliminar(null);
      setMotivoEliminar("");
      mutate(["usuarios", role]);
    } catch {
      toast.error("Error al eliminar usuario");
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Usuario>[] = [
    {
      key: "description",
      label: "CLIENTE",
      width: "28%",
      render: (row: Usuario) => {
        const initials = getInitials(row.description);
        const palette = getAvatarStyle(row.description || "");
        const tipo = getTipoCliente(row.description, row.ruc);

        return (
          <div className="flex items-center gap-3 min-w-0">
            <div
              style={{ backgroundColor: palette.bg, color: palette.text }}
              className="w-[32px] h-[32px] rounded-[7px] flex items-center justify-center font-bold text-[11px] flex-shrink-0"
            >
              {initials}
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden select-text">
              <span className="text-[13.5px] font-semibold text-[#ECECEE] truncate leading-tight select-text cursor-text">
                {row.description || "—"}
              </span>
              <span className="text-[11.5px] text-[#76777C] truncate mt-0.5 leading-none select-text">
                {tipo}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "accountID",
      label: "CUENTA",
      width: "16%",
      render: (row: Usuario) => (
        <div className="flex flex-col overflow-hidden select-text">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[13px] text-[#ECECEE] font-medium truncate select-text cursor-text" title={row.accountID}>
              {row.accountID}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(row.accountID);
                toast.success("Usuario copiado");
              }}
              className="p-0.5 rounded text-[#76777C] hover:text-[#ECECEE] transition-colors cursor-pointer flex-shrink-0"
              title="Copiar usuario"
            >
              <Copy size={11} />
            </button>
          </div>
          <div className="mt-0.5">
            <PasswordCell password={row.password} />
          </div>
        </div>
      ),
    },
    {
      key: "ruc",
      label: "DNI / RUC",
      width: "13%",
      render: (row: Usuario) => (
        <span className="font-mono text-[13px] text-[#CFCFD3] select-text cursor-text">
          {row.ruc || "—"}
        </span>
      ),
    },
    {
      key: "contactEmail",
      label: "CONTACTO",
      width: "21%",
      render: (row: Usuario) => (
        <div className="flex flex-col overflow-hidden leading-snug select-text">
          <span className="text-[13px] text-[#CFCFD3] truncate select-text cursor-text" title={row.contactEmail}>
            {row.contactEmail || "—"}
          </span>
          {row.contactPhone && (
            <span className="font-mono text-[11.5px] text-[#9B9CA1] truncate mt-0.5 select-text cursor-text">
              {row.contactPhone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "creationTime",
      label: "CREADO",
      width: "10%",
      render: (row: Usuario) => (
        <span className="font-mono text-[12px] text-[#9B9CA1]">
          {formatUnixDate(row.creationTime)}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "ESTADO",
      width: "10%",
      render: (row: Usuario) => (
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase ${
            row.isActive ? "text-[#4ADE80]" : "text-[#A6A7AB]"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              row.isActive ? "bg-[#4ADE80]" : "bg-[#A6A7AB]"
            }`}
          />
          {row.isActive ? "ACTIVO" : "INACTIVO"}
        </span>
      ),
    },
    {
      key: "acciones",
      label: "ACCIONES",
      width: "88px",
      render: (row: Usuario) => (
        <div className="flex items-center gap-1.5">
          {/* Editar */}
          <button
            onClick={() => abrirEditar(row)}
            title="Editar usuario"
            className="w-[32px] h-[32px] rounded-[7px] bg-[#1A1210] border border-[#5A2A18] text-[#F05A28] hover:border-[#F05A28] hover:bg-[#251814] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Pencil size={14} />
          </button>

          {/* Eliminar */}
          <button
            disabled={!row.isActive}
            onClick={() => abrirEliminar(row)}
            title={row.isActive ? "Eliminar usuario" : "Usuario inactivo"}
            className={`w-[32px] h-[32px] rounded-[7px] bg-[#1A1210] border border-[#5A2A18] text-[#F05A28] flex items-center justify-center transition-colors ${
              row.isActive
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
            Gestión de <span className="text-[#F05A28]">Usuarios</span>
          </span>
        }
        subtitle={`${totalUsuarios} cuentas registradas · ${totalActivos} activas`}
        role={role}
      />

      {/* ---------- CUERPO / TABLA ---------- */}
      <div className="flex-1 min-h-0 p-6 overflow-hidden">
        <TablaBase
          leftActions={
            <div className="flex items-center gap-3 flex-wrap flex-1">
              {/* Buscador */}
              <div className="relative w-[340px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777C] pointer-events-none"
                />
                <input
                  type="search"
                  placeholder="Buscar por cuenta, nombre, RUC o correo"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full h-[36px] pl-9 pr-3.5 bg-[#121214] border border-[#2D2E32] rounded-[8px] text-[13px] text-[#ECECEE] placeholder-[#76777C] outline-none transition-colors focus:border-[#F05A28]"
                />
              </div>

              {/* Filtro Todos / Activos / Inactivos */}
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
                  <span className="font-mono text-[11px] text-[#9B9CA1]">{totalUsuarios}</span>
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
              {/* Botón Exportar */}
              <button
                type="button"
                onClick={exportarExcel}
                className="h-[36px] px-3.5 rounded-[8px] bg-[#161719] border border-[#26272B] text-[#ECECEE] hover:bg-[#212226] hover:border-[#2D2E32] transition-colors text-[13px] font-medium flex items-center gap-2 cursor-pointer"
              >
                <Download size={15} />
                <span>Exportar</span>
              </button>

              {/* Botón Nuevo Usuario */}
              <button
                type="button"
                onClick={abrirAgregar}
                className="h-[36px] px-4 rounded-[8px] bg-[#F05A28] hover:bg-[#FF6A35] text-white font-semibold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-none"
              >
                <Plus size={16} />
                <span>Nuevo usuario</span>
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
        title={modo === "editar" ? "Editar Usuario" : "Agregar Nuevo Usuario"}
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
            label="Nombre / Razón Social"
            placeholder="Nombre / Razón Social"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.description || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, description: e.target.value }
                  : ({ description: e.target.value } as Usuario)
              )
            }
          />

          <InputBase1
            label="DNI / RUC"
            placeholder="DNI o RUC"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.ruc || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, ruc: e.target.value }
                  : ({ ruc: e.target.value } as Usuario)
              )
            }
          />

          <InputBase1
            label="Account ID"
            desabilitar={modo === "editar"}
            placeholder="accountID"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.accountID || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, accountID: e.target.value }
                  : ({ accountID: e.target.value } as Usuario)
              )
            }
          />

          <InputBase1
            label="Password"
            type="password"
            placeholder="******"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.password || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, password: e.target.value }
                  : ({ password: e.target.value } as Usuario)
              )
            }
          />

          <InputBase1
            label="Correo"
            placeholder="ejemplo@gmail.com"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.contactEmail || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, contactEmail: e.target.value }
                  : ({ contactEmail: e.target.value } as Usuario)
              )
            }
          />

          <InputBase1
            label="Teléfono"
            placeholder="987654321"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.contactPhone || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev
                  ? { ...prev, contactPhone: e.target.value }
                  : ({ contactPhone: e.target.value } as Usuario)
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
                  !seleccionado?.description ||
                  !seleccionado?.ruc ||
                  !seleccionado?.accountID ||
                  !seleccionado?.password ||
                  !seleccionado?.contactEmail ||
                  !seleccionado?.contactPhone ||
                  !motivoValido(motivo)
                ) {
                  return;
                }
                guardarUsuario(seleccionado);
              }}
              variant="primary"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar usuario"}
            </ButtonBase>
          </div>
        </div>
      </ModalBase>

      {/* ---------- MODAL ELIMINAR ---------- */}
      <ModalEliminar
        open={openEliminarModal}
        title="Eliminar Usuario"
        onClose={() => setOpenEliminarModal(false)}
        tamaño="w-full max-w-sm"
      >
        <div className="flex flex-col items-center justify-center text-center gap-4 py-2">
          {/* Ícono advertencia */}
          <div className="w-12 h-12 rounded-full bg-[#1A1210] border border-[#5A2A18] flex items-center justify-center">
            <Trash2 size={20} className="text-[#F05A28]" />
          </div>

          <p className="text-[13.5px] text-[#CFCFD3] m-0">
            ¿Está seguro de eliminar el usuario?
            <br />
            <strong className="text-[#ECECEE] text-base block mt-1">
              {usuarioAEliminar?.description}
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