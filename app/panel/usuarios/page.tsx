"use client";

import { useState, useMemo } from "react";
import InputBase from "@/app/components/ui/InputBase";
import ButtonBase from "@/app/components/ui/ButtonBase";
import TablaBase from "@/app/components/tablas/TablaBase";
import ModalBase from "@/app/components/modal/ModalBase";
import { Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import { Usuario } from "@/app/interfaces/usuario.interface";
import PasswordCell from "@/app/components/password/PasswordCell";

export default function UsuariosPage() {
  const servidores = ["125", "107", "133"];
  const [servidorActivo, setServidorActivo] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"editar" | "agregar">("agregar");
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);

  // 🔹 Traer usuarios por servidor de la API
  const fetchUsuarios = async (srv: string) => {
    setServidorActivo(srv);
    try {
      const res = await axios.get<Usuario[]>(`https://do.velsat.pe:2083/api/Admin/Usuarios`);
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
      [u.description, u.ruc, u.accountID, u.contactEmail]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [busqueda, usuarios]);

  // Modal abrir editar
  const abrirEditar = (usuario: Usuario) => {
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

  // Guardar usuario
  const guardarUsuario = (usuario: Usuario) => {
    if (!usuario.description || !servidorActivo) return;

    if (modo === "editar" && seleccionado) {
      setUsuarios((prev) => prev.map((u) => (u.accountID === seleccionado.accountID ? usuario : u)));
    } else if (modo === "agregar") {
      const nuevo: Usuario = { ...usuario, creationTime: new Date() }; // id temporal
      setUsuarios((prev) => [...prev, nuevo]);
    }

    setOpenModal(false);
  };

  const columns = [
    { key: "description", label: "NOMBRE" },
    { key: "ruc", label: "DNI/RUC" },
    { key: "accountID", label: "ACCOUNT ID" },
      { key: "password", label: "Password", render: (row: Usuario) => <PasswordCell password={row.password} /> },
    { key: "contactEmail", label: "CORREO" },
    { key: "contactPhone", label: "TELEFONO" },
    { key: "creationTime", label: "FECHA CREACION" },
    { key: "isActive", label: "Activo", render: (row: Usuario) => (
      <span className={`inline-block w-3 h-3 rounded-full ${row.isActive ? "bg-green-500" : "bg-red-500"}`} />
    )},
    {
      key: "acciones",
      label: "ACCIONES",
      render: (row: Usuario) => (
        <div className="flex gap-2">
          <button
            className="p-2 rounded hover:bg-blue-100 text-blue-600"
            onClick={() => abrirEditar(row)}
          >
            <Pencil size={16} />
          </button>
          <button
            className="p-2 rounded hover:bg-red-100 text-red-600"
            onClick={() => alert("Eliminar luego")}
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
      <section className="mb-8 text-black">
        <h1 className="text-3xl font-bold mb-2">Gestión de usuarios</h1>

        <div className="mt-4 flex items-center gap-4">
          <span className="font-semibold">Seleccione un servidor:</span>

          {servidores.map((srv) => (
            <ButtonBase
              key={srv}
              variant={servidorActivo === srv ? "primary" : "secondary"}
              onClick={() => fetchUsuarios(srv)}
            >
              Servidor {srv}
            </ButtonBase>
          ))}
        </div>
      </section>

      {/* Tabla */}
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
        rightActions={<ButtonBase onClick={abrirAgregar}>Agregar Nuevo +</ButtonBase>}
        columns={columns}
        data={servidorActivo ? usuariosFiltrados : []}
        mensajeDefaul="Seleccione un servidor para ver los usuarios"
      />

      {/* Modal */}
      <ModalBase
        open={openModal}
        title={modo === "editar" ? "Editar usuario" : "Agregar usuario"}
        onClose={() => setOpenModal(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Servidor */}
          {modo === "agregar" ? (
            <div className="col-span-2">
              <label className="block mb-1 font-semibold">Servidor</label>
              <select
                value={servidorActivo || ""}
                onChange={(e) => setServidorActivo(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccione un servidor</option>
                {servidores.map((srv) => (
                  <option key={srv} value={srv}>
                    Servidor {srv}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <InputBase
              label="Servidor"
              placeholder="Servidor"
              value={servidorActivo || ""}
              
              
            />
          )}

          {/* Campos */}
          <InputBase
            label="Nombre"
            placeholder="Nombre"
            defaultValue={seleccionado?.description || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev ? { ...prev, nombre: e.target.value } : { description: e.target.value } as Usuario
              )
            }
          />
          <InputBase
            label="Documento"
            placeholder="DNI / RUC"
            defaultValue={seleccionado?.ruc || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev ? { ...prev, documento: e.target.value } : { ruc: e.target.value } as Usuario
              )
            }
          />
          <InputBase
            label="Account ID"
            placeholder="Account ID"
            defaultValue={seleccionado?.accountID || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev ? { ...prev, accountId: e.target.value } : { accountID: e.target.value } as Usuario
              )
            }
          />
          <InputBase
            label="Password"
            placeholder="Password"
            defaultValue={seleccionado?.password || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev ? { ...prev, password: e.target.value } : { password: e.target.value } as Usuario
              )
            }
          />
          <InputBase
            label="Correo"
            placeholder="Correo"
            defaultValue={seleccionado?.contactEmail || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev ? { ...prev, correo: e.target.value } : { contactEmail: e.target.value } as Usuario
              )
            }
          />
          <InputBase
            label="Teléfono"
            placeholder="Teléfono"
            defaultValue={seleccionado?.contactPhone || ""}
            onChange={(e) =>
              setSeleccionado((prev) =>
                prev ? { ...prev, telefono: e.target.value } : { contactPhone: e.target.value } as Usuario
              )
            }
          />
          <InputBase
            label="Fecha Creación"
            placeholder="YYYY-MM-DD"
            
          />

          {/* Botón guardar */}
          <div className="col-span-2">
            <ButtonBase
              type="button"
              
            >
              Guardar
            </ButtonBase>
          </div>
        </div>
      </ModalBase>
    </>
  );
}
