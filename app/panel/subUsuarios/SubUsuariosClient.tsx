"use client";
import useSWR, { mutate } from "swr";
import { useState, useMemo, useEffect } from "react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import TablaBase from "@/app/components/tablas/TablaBase";
import ModalBase from "@/app/components/modal/ModalBase";
import { Pencil, Server, Trash2 } from "lucide-react";
import axios from "axios";
import { SubUsuario } from "@/app/interfaces/usuario.interface";
import InputBase1 from "@/app/components/ui/InputBase1";
import ModalEliminar from "@/app/components/modal/ModalEliminar";
import toast from "react-hot-toast";
import { Role } from "@/app/constants/roles";
import { getSubUsuariosApi } from "@/app/services/subUsuariosApi";
import ImputBuscar from "@/app/components/ui/ImputBuscar";

type Props = {
  role: Role;
};

export default function SubUsuariosClient({role}: Props) {
  const [busqueda, setBusqueda] = useState("");

  // Modal agregar/editar
  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"editar" | "agregar">("agregar");
  const [seleccionado, setSeleccionado] = useState<SubUsuario | null>(null);

  // Modal eliminar
  const [openEliminarModal, setOpenEliminarModal] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<SubUsuario | null>(null);
  
  //validar al dar en guardar
  const [submitAttempt, setSubmitAttempt] = useState(false);

  // 🔹 Traer usuarios por servidor de la API
    const api = getSubUsuariosApi(role);

  // 🔹 Traer usuarios
const fetchSubUsuarios = async () => {
  const res = await axios.get<SubUsuario[]>(api.list);
  return res.data;
};

const {data: usuarios = [], isLoading, error} = useSWR(
  role ? ["subusuarios", role] : null,
  fetchSubUsuarios,
  {
    revalidateOnFocus: true,
    keepPreviousData: true,
  }
);

  // Filtrado de búsqueda
  const usuariosFiltrados = useMemo(() => {
    if (!busqueda) return usuarios;
    return usuarios.filter((u) =>
      [u.userId, u.deviceName, u.deviceID]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [busqueda, usuarios]);

  const usuariosOrdenados = useMemo(() => {
    return [...usuariosFiltrados].sort((a, b) => b.id - a.id);
  }, [usuariosFiltrados]);

  // Modal abrir editar
  const abrirEditar = (usuario: SubUsuario) => {
    setSubmitAttempt(false);
    setSeleccionado(usuario);
    setModo("editar");
    setOpenModal(true);
  };

  // Modal abrir agregar
  const abrirAgregar = () => {
    setSubmitAttempt(false);
    setSeleccionado(null);
    setModo("agregar");
    setOpenModal(true);
  };

  // Modal abrir eliminar
  const abrirEliminar = (usuario: SubUsuario) => {
    setUsuarioAEliminar(usuario);
    setOpenEliminarModal(true);
  };

  const cerrarModal = () => {
  setOpenModal(false);
  setSubmitAttempt(false);
};

  // Guardar usuario
  const guardarUsuario = async (usuario: SubUsuario) => {
    const payloadG = {
      userId: usuario.userId,
      deviceName: usuario.deviceName,
      deviceID: usuario.deviceID,
    };
    const payloadU = {
      id: usuario.id,
      userId: usuario.userId,
      devicename: usuario.deviceName,
      deviceID: usuario.deviceID,
    };
    try {
      if (modo === "editar" && seleccionado) {
        await axios.put(api.update, payloadU);
        toast.success("Usuario actulizado correctamente");
      } else if (modo === "agregar") {
        await axios.post(api.insert, payloadG);
        toast.success("Usuario guardado correctamente");
      }
      setOpenModal(false);
      setSeleccionado(null);
      mutate(["subusuarios", role]);
      mutate(["dashboard", role]);

    } catch (error) {
      // console.error("Error al guardar usuario:", error);
      toast.error("No es posible guardad cambios");
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async () => {
    if (!usuarioAEliminar) return;

    try {
      await axios.delete(api.delete((usuarioAEliminar.id).toString()), {
        data: { id: usuarioAEliminar.id }
      });
      toast.success("Usuario eliminado");
      setOpenEliminarModal(false);
      setUsuarioAEliminar(null);
      mutate(["subusuarios", role]);
      mutate(["dashboard", role]);

    } catch (error) {
      //console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar usuario");
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "deviceName", label: "ACCOUNT" },
    { key: "deviceID", label: "DIVICE ID" },
    { key: "userId", label: "NOMBRE" },
    { key: "status", label: "Activo", render: (row: SubUsuario) => (
      <span className={`inline-block w-3 h-3 rounded-full ${row.status === "1" ? "bg-green-500" : "bg-red-500"}`} />
    )},
    {
      key: "acciones",
      label: "ACCIONES",
      render: (row: SubUsuario) => (
        <div className="flex gap-2">
          <button
            className="p-2 rounded hover:bg-blue-100 text-blue-600"
            onClick={() => abrirEditar(row)}
          >
            <Pencil size={16} />
          </button>
          <button
            disabled={row.status === "1" ? false : true}
            onClick={() => abrirEliminar(row)}
            className="
              p-2 rounded text-red-600
              hover:bg-red-100
              disabled:opacity-40
              disabled:text-gray-400
              disabled:hover:bg-transparent
              disabled:cursor-not-allowed
            "
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">

        <section className="mb-4 text-sky-950">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                Gestión de SubUsuarios
                </h1>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Server size={14} className="text-emerald-600" />
                  <span className="font-medium">
                    Conectado a
                    <span className="ml-1 font-semibold text-slate-800">
                      {role}
                    </span>
                  </span>
                </div>
            </div>

            <p className="mt-2 text-sm font-semibold text-center text-sky-700">
                
            </p>
        </section>
        <div className="flex-1 min-h-0 overflow-hidden">
          <TablaBase
            leftActions={
              <div className="w-96">
                <ImputBuscar
                  placeholder="Buscar por Account, DeviceID o Nombre"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            }
            rightActions={
              <ButtonBase onClick={abrirAgregar}>
                Agregar Nuevo +
              </ButtonBase>
            }
            columns={columns}
            data={usuariosOrdenados}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Modal Agregar/Editar */}
      <ModalBase
        open={openModal}
        title={modo === "editar" ? "Editar Sub Usuario" : "Agregar Sub Usuario"}
        onClose={cerrarModal}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase1 label="Servidor" value={role} desabilitar />
            <InputBase1
              label="NOMBRE"
              placeholder="User id"
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
              label="ACCOUNT"
              placeholder="DeviceName"
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
              type="text"
              label="DEVICE ID"
              placeholder="DeviceId"
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

          {/* Botones */}
          <div className="col-span-2 flex justify-between gap-4 mt-4">
            <ButtonBase
              type="button"
              variant="secondary"
              onClick={() => setOpenModal(false)}
            >
              Cancelar
            </ButtonBase>

            <ButtonBase
              type="button"
              variant="personalizado"
              onClick={() => {
                setSubmitAttempt(true);

                if (
                  !seleccionado?.userId ||
                  !seleccionado?.deviceName ||
                  !seleccionado?.deviceID
                ) {
                  return;
                }

                guardarUsuario(seleccionado);
              }}
            >
              Guardar
            </ButtonBase>

          </div>
        </div>
      </ModalBase>

      {/* Modal Confirmación Eliminación */}
      <ModalEliminar
        open={openEliminarModal}
        title="Eliminar"
        onClose={cerrarModal}
        tamaño="w-full max-w-sm"
      >
        <div className="flex flex-col items-center justify-center text-center gap-4 min-h-40">
          <p className="text-shadow-md">
            ¿Está seguro de eliminar el usuario{" "}
            <br />
            <strong>{usuarioAEliminar?.id}</strong>?
          </p>

          <div className="flex gap-2">
            <ButtonBase
              variant="secondary"
              onClick={() => setOpenEliminarModal(false)}
            >
              Cancelar
            </ButtonBase>

            <ButtonBase
              onClick={eliminarUsuario}
              variant="danger"
            >
              Eliminar
            </ButtonBase>
          </div>
        </div>

      </ModalEliminar>
    </>
  );
}
