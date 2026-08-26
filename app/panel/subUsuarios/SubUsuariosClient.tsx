"use client";
import useSWR, { mutate } from "swr";
import { useState, useMemo } from "react";
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
  actor?: string;
};

export default function SubUsuariosClient({ role, actor }: Props) {
  const [busqueda, setBusqueda] = useState("");
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

  const guardarUsuario = async (usuario: SubUsuario) => {
    setLoading(true);
    const payloadG = { userId: usuario.userId, deviceName: usuario.deviceName, deviceID: usuario.deviceID };
    const payloadU = { id: usuario.id, userId: usuario.userId, devicename: usuario.deviceName, deviceID: usuario.deviceID };
    try {
      if (modo === "editar" && seleccionado) {
        await axios.put(api.update(actor, motivo), payloadU);
        toast.success("Usuario actualizado correctamente");
      } else {
        await axios.post(api.insert(actor, motivo), payloadG);
        toast.success("Usuario guardado correctamente");
      }
      setOpenModal(false);
      setSeleccionado(null);
      setMotivo("");
      mutate(["subusuarios", role]);
    } catch {
      toast.error("No es posible guardar cambios");
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
      await axios.delete(api.delete((usuarioAEliminar.id).toString(), actor, motivoEliminar), {
        data: { id: usuarioAEliminar.id },
      });
      toast.success("Usuario eliminado");
      setOpenEliminarModal(false);
      setUsuarioAEliminar(null);
      setMotivoEliminar("");
      mutate(["subusuarios", role]);
    } catch {
      toast.error("Error al eliminar usuario");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "userId", label: "USER ID" },
    { key: "deviceName", label: "DEVICE NAME" },
    { key: "deviceID", label: "DEVICE ID" },
    {
      key: "status",
      label: "ACTIVO",
      render: (row: SubUsuario) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: row.status === "1" ? "#2ECC71" : "#E85D2F",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: row.status === "1" ? "#2ECC71" : "#E85D2F",
              flexShrink: 0,
            }}
          />
          {row.status === "1" ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "acciones",
      label: "ACCIONES",
      render: (row: SubUsuario) => (
        <div style={{ display: "flex", gap: 6 }}>
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
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.15)")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.06)")}
          >
            <Pencil size={14} />
          </button>

          <button
            disabled={row.status !== "1"}
            onClick={() => abrirEliminar(row)}
            style={{
              padding: "6px 8px",
              borderRadius: 7,
              border: row.status === "1" ? "1px solid rgba(232,93,47,0.3)" : "1px solid rgba(255,255,255,0.06)",
              background: row.status === "1" ? "rgba(232,93,47,0.08)" : "rgba(255,255,255,0.03)",
              color: row.status === "1" ? "#E85D2F" : "#5F5E5A",
              cursor: row.status === "1" ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (row.status === "1") (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.18)"; }}
            onMouseLeave={e => { if (row.status === "1") (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.08)"; }}
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
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F4F5F7", margin: 0, lineHeight: 1.2 }}>
              Gestión de <span style={{ color: "#E85D2F" }}>Sub Usuarios</span>
            </h1>
            <p style={{ fontSize: 12, color: "#8A9099", margin: "4px 0 0" }}>
              Administra los sub usuarios del sistema
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
                  placeholder="Buscar por UserId, DeviceName o DeviceId"
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
        title={modo === "editar" ? "Editar Sub Usuario" : "Agregar Sub Usuario"}
        onClose={cerrarModal}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase1 label="Servidor" value={role} displayValue={role === "Servidor_125_2" ? "Urbano_125" : role} desabilitar />

          <InputBase1
            label="USER ID"
            placeholder="User id"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.userId || ""}
            onChange={(e) => setSeleccionado((prev) => prev ? { ...prev, userId: e.target.value } : ({ userId: e.target.value } as SubUsuario))}
          />

          <InputBase1
            label="DEVICE NAME"
            placeholder="DeviceName"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.deviceName || ""}
            onChange={(e) => setSeleccionado((prev) => prev ? { ...prev, deviceName: e.target.value } : ({ deviceName: e.target.value } as SubUsuario))}
          />

          <InputBase1
            label="DEVICE ID"
            placeholder="DeviceId"
            required
            submitAttempt={submitAttempt}
            defaultValue={seleccionado?.deviceID || ""}
            onChange={(e) => setSeleccionado((prev) => prev ? { ...prev, deviceID: e.target.value } : ({ deviceID: e.target.value } as SubUsuario))}
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
            <ButtonBase variant="secondary" onClick={() => setOpenModal(false)}>Cancelar</ButtonBase>
            <ButtonBase
              variant="personalizado"
              disabled={loading}
              onClick={() => {
                setSubmitAttempt(true);
                if (
                  !seleccionado?.userId || !seleccionado?.deviceName || !seleccionado?.deviceID ||
                  !motivoValido(motivo)
                ) return;
                guardarUsuario(seleccionado);
              }}
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
        onClose={cerrarModal}
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
          <div
            style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(232,93,47,0.1)",
              border: "1px solid rgba(232,93,47,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Trash2 size={20} style={{ color: "#E85D2F" }} />
          </div>

          <p style={{ fontSize: 14, color: "#ADB5BD", margin: 0 }}>
            ¿Está seguro de eliminar el sub usuario
            <br />
            <strong style={{ color: "#F4F5F7" }}>{usuarioAEliminar?.id}</strong>?
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
            <ButtonBase variant="secondary" onClick={() => setOpenEliminarModal(false)}>Cancelar</ButtonBase>
            <ButtonBase variant="danger" disabled={loading} onClick={eliminarUsuario}>
              {loading ? "Eliminando..." : "Eliminar"}
            </ButtonBase>
          </div>
        </div>
      </ModalEliminar>
    </>
  );
}