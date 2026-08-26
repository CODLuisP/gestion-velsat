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
  actor?: string;
};

export default function UsuariosClient({ role, actor }: Props) {
  const [busqueda, setBusqueda] = useState("");
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

  const columns = [
    { key: "accountID", label: "ACCOUNT ID" },
    {
      key: "password",
      label: "PASSWORD",
      render: (row: Usuario) => <PasswordCell password={row.password} />,
    },
    { key: "description", label: "NOMBRE" },
    { key: "ruc", label: "DNI/RUC" },
    { key: "contactEmail", label: "CORREO" },
    { key: "contactPhone", label: "TELÉFONO" },
    {
      key: "creationTime",
      label: "FEC CREACIÓN",
      render: (row: Usuario) => <UnixNormal creationTime={row.creationTime} />,
    },
    {
      key: "isActive",
      label: "ACTIVO",
      render: (row: Usuario) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
   
            ...(row.isActive
              ? {
                  color: "#2ECC71",
                }
              : {
                  color: "#E85D2F",
                }),
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: row.isActive ? "#2ECC71" : "#E85D2F",
              flexShrink: 0,
            }}
          />
          {row.isActive ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "acciones",
      label: "ACCIONES",
      render: (row: Usuario) => (
        <div style={{ display: "flex", gap: 6 }}>
          {/* Editar */}
          <button
            onClick={() => abrirEditar(row)}
            style={{
              padding: "6px 8px",
              borderRadius: 7,
              border: "1px solid rgba(232,93,47,0.2)",
              background: "rgba(232,93,47,0.06)",
              color: "#E85D2F",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e =>
              ((e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.15)")
            }
            onMouseLeave={e =>
              ((e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.06)")
            }
          >
            <Pencil size={14} />
          </button>

          {/* Eliminar */}
          <button
            disabled={!row.isActive}
            onClick={() => abrirEliminar(row)}
            style={{
              padding: "6px 8px",
              borderRadius: 7,
              border: row.isActive
                ? "1px solid rgba(232,93,47,0.3)"
                : "1px solid rgba(255,255,255,0.06)",
              background: row.isActive
                ? "rgba(232,93,47,0.08)"
                : "rgba(255,255,255,0.03)",
              color: row.isActive ? "#E85D2F" : "#5F5E5A",
              cursor: row.isActive ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => {
              if (row.isActive)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(232,93,47,0.18)";
            }}
            onMouseLeave={e => {
              if (row.isActive)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(232,93,47,0.08)";
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
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
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#F4F5F7",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Gestión de{" "}
              <span style={{ color: "#E85D2F" }}>Usuarios</span>
            </h1>
            <p style={{ fontSize: 12, color: "#8A9099", margin: "4px 0 0" }}>
              Administra los usuarios del sistema
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              background: "#1C1F26",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 12,
              color: "#ADB5BD",
            }}
          >
            <Server size={13} style={{ color: "#E85D2F" }} />
            <span>
              Conectado a{" "}
              <strong style={{ color: "#E85D2F" }}>
                {role === "Servidor_125_2" ? "Urbano_125" : role}
              </strong>
            </span>
          </div>
        </section>

        {/* ---------- TABLA ---------- */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <TablaBase
            leftActions={
              <div style={{ width: 384 }}>
                <ImputBuscar
                  placeholder="Buscar por AccountID, Nombre, RUC o Correo"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            }
            rightActions={
              <ButtonBase onClick={abrirAgregar}>Agregar Nuevo +</ButtonBase>
            }
            columns={columns}
            data={usuariosOrdenados}
            loading={isLoading}
          />
        </div>
      </div>

      {/* ---------- MODAL AGREGAR / EDITAR ---------- */}
      <ModalBase
        open={openModal}
        title={modo === "editar" ? "Editar Usuario" : "Agregar Usuario"}
        onClose={cerrarModal}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase1
            label="Servidor"
            value={role}
            displayValue={role === "Servidor_125_2" ? "Urbano_125" : role}
            desabilitar
          />

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

          <div className="col-span-2">
            <InputBase1
              label={modo === "editar" ? "MOTIVO DEL CAMBIO" : "MOTIVO DEL ALTA"}
              placeholder="Explica por qué se realiza esta acción (mín. 6 caracteres)"
              required
              submitAttempt={submitAttempt}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            {submitAttempt && motivo.trim().length > 0 && !motivoValido(motivo) && (
              <span style={{ fontSize: 11, color: "#E85D2F" }}>
                El motivo debe tener al menos 6 caracteres
              </span>
            )}
          </div>

          <div className="col-span-2 flex justify-between gap-4 mt-4">
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
              variant="personalizado"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar"}
            </ButtonBase>
          </div>
        </div>
      </ModalBase>

      {/* ---------- MODAL ELIMINAR ---------- */}
      <ModalEliminar
        open={openEliminarModal}
        title="Eliminar"
        onClose={() => setOpenEliminarModal(false)}
        tamaño="w-full max-w-sm"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 16,
            minHeight: 160,
          }}
        >
          {/* Ícono advertencia */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(232,93,47,0.1)",
              border: "1px solid rgba(232,93,47,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={20} style={{ color: "#E85D2F" }} />
          </div>

          <p style={{ fontSize: 14, color: "#ADB5BD", margin: 0 }}>
            ¿Está seguro de eliminar el usuario
            <br />
            <strong style={{ color: "#F4F5F7" }}>
              {usuarioAEliminar?.description}
            </strong>
            ?
          </p>

          <div style={{ width: "100%", textAlign: "left" }}>
            <InputBase1
              label="MOTIVO DE LA ELIMINACIÓN"
              placeholder="Explica por qué se elimina (mín. 6 caracteres)"
              required
              submitAttempt={submitAttemptEliminar}
              value={motivoEliminar}
              onChange={(e) => setMotivoEliminar(e.target.value)}
            />
            {submitAttemptEliminar && motivoEliminar.trim().length > 0 && !motivoValido(motivoEliminar) && (
              <span style={{ fontSize: 11, color: "#E85D2F" }}>
                El motivo debe tener al menos 6 caracteres
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
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
    </>
  );
}