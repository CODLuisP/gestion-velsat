"use client";

import { useState, useMemo } from "react";
import InputBase from "@/app/components/ui/InputBase";
import ButtonBase from "@/app/components/ui/ButtonBase";
import TablaBase from "@/app/components/tablas/TablaBase";
import ModalBase from "@/app/components/modal/ModalBase";
import { Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import { SubUsuario } from "@/app/interfaces/usuario.interface";
import InputBase1 from "@/app/components/ui/InputBase1";
import ModalEliminar from "@/app/components/modal/ModalEliminar";
import toast from "react-hot-toast";

export default function subusuariosPage() {
  const servidores = ["125", "107", "133"];
  const [servidorActivo, setServidorActivo] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<SubUsuario[]>([]);
  const [busqueda, setBusqueda] = useState("");

  // Modal agregar/editar
  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"editar" | "agregar">("agregar");
  const [seleccionado, setSeleccionado] = useState<SubUsuario | null>(null);

  // Modal eliminar
  const [openEliminarModal, setOpenEliminarModal] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<SubUsuario | null>(null);

  // 🔹 Traer usuarios por servidor de la API
  const fetchUsuarios = async (srv: string) => {
    setServidorActivo(srv);
    try {
      const res = await axios.get<SubUsuario[]>(`https://do.velsat.pe:2083/api/Admin/SubUsuarios`);
      setUsuarios(res.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setUsuarios([]);
    }
  };

  // Filtrado de búsqueda
  const usuariosFiltrados = useMemo(() => {
    if (!busqueda) return usuarios;
    return usuarios.filter((u) =>
      [u.userId, u.deviceName]
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
    setSeleccionado(usuario);
    setModo("editar");
    setOpenModal(true);
  };

  // Modal abrir agregar
  const abrirAgregar = () => {
    setSeleccionado(null);
    setModo("agregar");
    setOpenModal(true);
  };

  // Modal abrir eliminar
  const abrirEliminar = (usuario: SubUsuario) => {
    setUsuarioAEliminar(usuario);
    setOpenEliminarModal(true);
  };

  // Guardar usuario
  const guardarUsuario = async (usuario: SubUsuario) => {
    if (!servidorActivo) return;

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
        await axios.put(`https://do.velsat.pe:2083/api/Admin/UpdateDeviceUser`, payloadU);
        toast.success("Usuario actulizado correctamente");
      } else if (modo === "agregar") {
        await axios.post(`https://do.velsat.pe:2083/api/Admin/InsertDeviceUser`, payloadG);
        toast.success("Usuario guardado correctamente");
      }
      setOpenModal(false);
      setSeleccionado(null);
      await fetchUsuarios(servidorActivo);

    } catch (error) {
      // console.error("Error al guardar usuario:", error);
      toast.error("No es posible guardad cambios");
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async () => {
    if (!servidorActivo || !usuarioAEliminar) return;

    try {
      await axios.delete(`https://do.velsat.pe:2083/api/Admin/DeleteDeviceUser/${usuarioAEliminar.id}`, {
        data: { id: usuarioAEliminar.id }
      });
      toast.success("Usuario eliminado");
      setOpenEliminarModal(false);
      setUsuarioAEliminar(null);
      await fetchUsuarios(servidorActivo);

    } catch (error) {
      //console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar usuario");
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "userId", label: "NOMBRE" },
    { key: "deviceName", label: "ACCOUNT" },
    { key: "deviceID", label: "DIVICE ID" },
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
            className="p-2 rounded hover:bg-red-100 text-red-600"
            onClick={() => abrirEliminar(row)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Header con selección de servidor */}
      <div className="flex h-full min-h-0 flex-col">

        <section className="mb-4 text-sky-950">
          <h1 className="text-2xl font-bold">Gestión de Sub Usuarios</h1>

          <div className="mt-2 flex items-center gap-8">
            <span className="font-semibold text-[15px]">
              Seleccione un servidor:
            </span>

            {servidores.map((srv) => (
              <ButtonBase
                key={srv}
                variant={servidorActivo === srv ? "primary" : "personalizado"}
                onClick={() => fetchUsuarios(srv)}
              >
                Servidor {srv}
              </ButtonBase>
            ))}
          </div>
        </section>

        {/* Tabla */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TablaBase
            leftActions={
              <div className="w-80">
                <InputBase
                  placeholder="Buscar"
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
            data={servidorActivo ? usuariosOrdenados : []}
            mensajeDefaul="Seleccione un servidor para ver los usuarios"
          />
        </div>
      </div>

      {/* Modal Agregar/Editar */}
      <ModalBase
        open={openModal}
        title={modo === "editar" ? "Editar usuario" : "Agregar usuario"}
        onClose={() => setOpenModal(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modo === "agregar" ? (
            <div className="col-span-1">
              <label className="block mb-1 text-sm font-semibold text-gray-700">
                SERVIDOR
              </label>
              <select
                value={servidorActivo || ""}
                onChange={(e) => setServidorActivo(e.target.value)}
                className="w-full border-b-2 border-emerald-400 bg-white text-gray-800 px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-400 hover:border-emerald-400"
              >
                <option value="" disabled>Seleccione un servidor</option>
                {servidores.map((srv) => (
                  <option key={srv} value={srv}>
                    Servidor {srv}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <InputBase1
              label="Servidor"
              placeholder="Servidor"
              value={servidorActivo || ""}
              desabilitar={true}
            />
          )}


          <InputBase1
            label="NOMBRE"
            placeholder="User id"
            type="text"
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
            type="text"
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
            label="DEVICE ID"
            placeholder="DeviceId"
            type="text"
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
              onClick={() => seleccionado && guardarUsuario(seleccionado)}
              variant="personalizado"
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
        onClose={() => setOpenEliminarModal(false)}
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
