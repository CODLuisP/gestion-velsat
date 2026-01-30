"use client";

import useSWR, { mutate } from "swr";
import { useState, useMemo } from "react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import TablaBase from "@/app/components/tablas/TablaBase";
import ModalBase from "@/app/components/modal/ModalBase";
import { Pencil, Server, Trash2 } from "lucide-react";
import axios from "axios";
import { Usuario } from "@/app/interfaces/usuario.interface";
import PasswordCell from "@/app/components/password/PasswordCell";
import UnixNormal from "@/app/components/fecha/UnixNormal";
import InputBase1 from "@/app/components/ui/InputBase1";
import ModalEliminar from "@/app/components/modal/ModalEliminar";
import toast from "react-hot-toast";
import { getUsuariosApi } from "@/app/services/usuariosApi";
import { Role } from "@/app/constants/roles";
import ImputBuscar from "@/app/components/ui/ImputBuscar";

type Props = {
  role: Role;
};
export default function UsuariosClient({ role }: Props) {
  const [busqueda, setBusqueda] = useState("");

  // Modal agregar/editar
  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"editar" | "agregar">("agregar");
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);

  // Modal eliminar
  const [openEliminarModal, setOpenEliminarModal] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);

  //validar al dar en guardar
  const [submitAttempt, setSubmitAttempt] = useState(false);

    const api = getUsuariosApi(role);

  // 🔹 Traer usuarios
  const fetchUsuarios = async () => {
    const res = await axios.get<Usuario[]>(api.list);
  return res.data;
  };

  const { data: usuarios = [], isLoading } = useSWR(
  role ? ["usuarios", role] : null,
  fetchUsuarios,
  {
    revalidateOnFocus: false,
    keepPreviousData: true,
  }
);

  // Filtrado
  const usuariosFiltrados = useMemo(() => {
    if (!busqueda) return usuarios;
    return usuarios.filter((u) =>
      [u.description, u.ruc, u.accountID, u.contactEmail]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [busqueda, usuarios]);

const usuariosOrdenados = useMemo(() => {
  return [...usuariosFiltrados].sort((a, b) => {
    // Primero por activos
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1; // Activo primero
    }
    // Luego por fecha descendente
    return b.creationTime - a.creationTime;
  });
}, [usuariosFiltrados]);


  // Abrir editar
  const abrirEditar = (usuario: Usuario) => {
    setSeleccionado(usuario);
    setModo("editar");
    setOpenModal(true);
    setSubmitAttempt(false);
  };

  // Abrir agregar
  const abrirAgregar = () => {
    setSeleccionado(null);
    setModo("agregar");
    setOpenModal(true);
    setSubmitAttempt(false);
  };

  // Abrir eliminar
  const abrirEliminar = (usuario: Usuario) => {
    setUsuarioAEliminar(usuario);
    setOpenEliminarModal(true);
  };

  const cerrarModal = () => {
    setOpenModal(false);
    setSubmitAttempt(false);
  };
  const guardarUsuario = async (usuario: Usuario) => {
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
        await axios.put(
        api.update, payload );
        toast.success("Usuario actualizado correctamente");
      } else {
        await axios.post(
        api.insert, payload );
        toast.success("Usuario guardado correctamente");
      }
      setOpenModal(false);
      setSeleccionado(null);
      mutate(["usuarios", role]);
    } catch (error) {
      toast.error("No es posible guardar los cambios");
    }
  };
  const eliminarUsuario = async () => {
    if (!usuarioAEliminar) return;

    try {
      await axios.delete(
        api.delete(usuarioAEliminar.accountID),
        { data: { accountID: usuarioAEliminar.accountID } }
      );

      toast.success("Usuario eliminado");
      setOpenEliminarModal(false);
      setUsuarioAEliminar(null);
      mutate(["usuarios", role]);
    } catch (error) {
      toast.error("Error al eliminar usuario");
    }
  };

  const columns = [
    { key: "accountID", label: "ACCOUNT ID" },
    {
      key: "password",
      label: "PASSWORD",
      render: (row: Usuario) => <PasswordCell password={row.password} />,
    },
    { key: "description", label: "NOMBRE / RASON SOCIAL" },
    { key: "ruc", label: "DNI/RUC" },
    { key: "contactEmail", label: "CORREO" },
    { key: "contactPhone", label: "TELÉFONO" },
    {
      key: "creationTime",
      label: "FECHA CREACIÓN",
      render: (row: Usuario) => (
        <UnixNormal creationTime={row.creationTime} />
      ),
    },
    {
      key: "isActive",
      label: "ACTIVO",
      render: (row: Usuario) => (
        <span
          className={`inline-block w-3 h-3 rounded-full ${
            row.isActive ? "bg-green-500" : "bg-red-500"
          }`}
        />
      ),
    },
    {
      key: "acciones",
      label: "ACCIONES",
      render: (row: Usuario) =>
          <div className="flex gap-2">
            <button
              className="p-2 rounded hover:bg-blue-100 text-blue-600"
              onClick={() => abrirEditar(row)}
            >
              <Pencil size={16} />
            </button>
            <button
              disabled={!row.isActive}
              onClick={() => abrirEliminar(row)}
              className="
                p-2 rounded text-red-600
                hover:bg-red-100
                disabled:text-gray-500
                disabled:hover:bg-transparent
                disabled:cursor-not-allowed
              "
            >
              <Trash2 size={16} />
            </button>
          </div>
    },
  ];

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">

        <section className="mb-4 text-sky-950">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                Gestión de usuarios
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
                  placeholder="Buscar por AccountID, Nombre, RUC o Correo"
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
      <ModalBase
        open={openModal}
        title={modo === "editar" ? "Editar Usuario" : "Agregar Usuario"}
        onClose={cerrarModal}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase1 label="Servidor" value={role} desabilitar />

          <InputBase1
            label="NOMBRE / RAZÓN SOCIAL"
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
            placeholder="DNI / RUC"
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
            label="ACCOUNT ID"
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
            label="PASSWORD"
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
            label="CORREO"
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
            label="TELÉFONO"
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

          <div className="col-span-2 flex justify-between gap-4 mt-4">
            <ButtonBase
              variant="secondary"
              onClick={() => setOpenModal(false)}
            >
              Cancelar
            </ButtonBase>

            <ButtonBase
              onClick={() =>{
                setSubmitAttempt(true);

                if (
                  !seleccionado?.description ||
                  !seleccionado?.ruc ||
                  !seleccionado?.accountID ||
                  !seleccionado?.password ||
                  !seleccionado?.contactEmail ||
                  !seleccionado?.contactPhone 
                ) {
                  return;
                }
                guardarUsuario(seleccionado)
              }
            }
              variant="personalizado"
            >
              Guardar
            </ButtonBase>
          </div>
        </div>
      </ModalBase>

      {/* Modal Eliminar */}
      <ModalEliminar
        open={openEliminarModal}
        title="Eliminar"
        onClose={() => setOpenEliminarModal(false)}
        tamaño="w-full max-w-sm"
      >
        <div className="flex flex-col items-center justify-center text-center gap-4 min-h-40">
          <p>
            ¿Está seguro de eliminar el usuario
            <br />
            <strong>{usuarioAEliminar?.description}</strong>?
          </p>

          <div className="flex gap-2">
            <ButtonBase
              variant="secondary"
              onClick={() => setOpenEliminarModal(false)}
            >
              Cancelar
            </ButtonBase>

            <ButtonBase variant="danger" onClick={eliminarUsuario}>
              Eliminar
            </ButtonBase>
          </div>
        </div>
      </ModalEliminar>
    </>
  );
}
 