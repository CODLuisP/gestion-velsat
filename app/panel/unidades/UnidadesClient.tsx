"use client";
import useSWR, { mutate } from "swr";
import { useState, useMemo } from "react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import TablaBase from "@/app/components/tablas/TablaBase";
import ModalBase from "@/app/components/modal/ModalBase";
import { Pencil, Server, Trash2 } from "lucide-react";
import axios from "axios";
import InputBase1 from "@/app/components/ui/InputBase1";
import ModalEliminar from "@/app/components/modal/ModalEliminar";
import toast from "react-hot-toast";
import { Vehiculo } from "@/app/interfaces/vehiculo.interface";
import { Role } from "@/app/constants/roles";
import { getUnidadesApi } from "@/app/services/unidadesApi";
import ImputBuscar from "@/app/components/ui/ImputBuscar";

type Props = {
  role: Role;
  actor?: string;
};

export default function UnidadesClient({ role, actor }: Props) {
  const [busqueda, setBusqueda] = useState("");
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

  const vehiculosFiltrados = useMemo(() => {
    if (!busqueda) return vehiculos;
    return vehiculos.filter((u) =>
      [u.deviceID, u.accountID, u.equipmentType, u.uniqueID]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [busqueda, vehiculos]);

  const vehiculosOrdenados = useMemo(() => {
    return [...vehiculosFiltrados].sort((a, b) => {
      const aActivo = a.isActive === "1" || a.habilitada === "1";
      const bActivo = b.isActive === "1" || b.habilitada === "1";
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

  const guardarVehiculo = async (vehiculo: Vehiculo) => {
    setLoading(true);
    const payload = {
      deviceID: vehiculo.deviceID,
      accountID: vehiculo.accountID,
      equipmentType: vehiculo.equipmentType,
      uniqueID: vehiculo.uniqueID,
      deviceCode: vehiculo.deviceCode,
      simPhoneNumber: vehiculo.simPhoneNumber,
      imeiNumber: vehiculo.imeiNumber,
    };
    try {
      if (modo === "editar" && seleccionado) {
        await axios.put(api.update(vehiculoOriginal?.deviceID, vehiculoOriginal?.accountID, actor, motivo), payload);
        toast.success("Vehículo actualizado correctamente");
      } else {
        await axios.post(api.insert(actor, motivo), payload);
        toast.success("Vehículo guardado correctamente");
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

  const isActivo = (row: Vehiculo) => row.isActive === "1" || row.habilitada === "1";

  const columns = [
    { key: "accountID", label: "ACCOUNT" },
    { key: "deviceID", label: "PLACA" },
    { key: "equipmentType", label: "TIPO EQUIPO" },
    { key: "uniqueID", label: "UNIQUE ID" },
    { key: "deviceCode", label: "DEVICE CODE" },
    { key: "simPhoneNumber", label: "NÚMERO CHIP" },
    { key: "imeiNumber", label: "IMEI" },
    {
      key: "isActive",
      label: "ACTIVO",
      render: (row: Vehiculo) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: isActivo(row) ? "#2ECC71" : "#E85D2F",
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isActivo(row) ? "#2ECC71" : "#E85D2F",
              flexShrink: 0,
            }}
          />
          {isActivo(row) ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "acciones",
      label: "ACCIONES",
      render: (row: Vehiculo) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => abrirEditar(row)}
            style={{
              padding: "6px 8px", borderRadius: 7,
              border: "1px solid rgba(232,93,47,0.2)",
              background: "rgba(232,93,47,0.06)",
              color: "#E85D2F", cursor: "pointer",
              display: "flex", alignItems: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.15)")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.06)")}
          >
            <Pencil size={14} />
          </button>

          <button
            disabled={!isActivo(row)}
            onClick={() => abrirEliminar(row)}
            style={{
              padding: "6px 8px", borderRadius: 7,
              border: isActivo(row) ? "1px solid rgba(232,93,47,0.3)" : "1px solid rgba(255,255,255,0.06)",
              background: isActivo(row) ? "rgba(232,93,47,0.08)" : "rgba(255,255,255,0.03)",
              color: isActivo(row) ? "#E85D2F" : "#5F5E5A",
              cursor: isActivo(row) ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (isActivo(row)) (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.18)"; }}
            onMouseLeave={e => { if (isActivo(row)) (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,47,0.08)"; }}
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
          display: "flex", flexDirection: "column",
          height: "100%", minHeight: 0,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* ---------- HEADER ---------- */}
        <section
          style={{
            marginBottom: 20, paddingBottom: 16,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F4F5F7", margin: 0, lineHeight: 1.2 }}>
              Gestión de <span style={{ color: "#E85D2F" }}>Unidades</span>
            </h1>
            <p style={{ fontSize: 12, color: "#8A9099", margin: "4px 0 0" }}>
              Administra las unidades del sistema
            </p>
          </div>

          <div
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8,
              background: "#1C1F26", border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 12, color: "#ADB5BD",
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
                  placeholder="Buscar por Account, Placa, Tipo Equipo o UniqueID"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            }
            rightActions={
              <ButtonBase onClick={abrirAgregar}>Agregar Nuevo +</ButtonBase>
            }
            columns={columns}
            data={vehiculosOrdenados}
            loading={isLoading}
          />
        </div>
      </div>

      {/* ---------- MODAL AGREGAR / EDITAR ---------- */}
      <ModalBase
        open={openModal}
        title={modo === "editar" ? "Editar Unidad" : "Agregar Nueva Unidad"}
        onClose={cerrarModal}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase1 label="Servidor" value={role} displayValue={role === "Servidor_125_2" ? "Urbano_125" : role} desabilitar />

          <InputBase1 label="PLACA" placeholder="Placa" type="text" required submitAttempt={submitAttempt}
            defaultValue={seleccionado?.deviceID || ""}
            onChange={(e) => setSeleccionado((prev) => prev ? { ...prev, deviceID: e.target.value } : ({ deviceID: e.target.value } as Vehiculo))}
          />
          <InputBase1 label="ACCOUNT" placeholder="AccountID" type="text" required submitAttempt={submitAttempt}
            defaultValue={seleccionado?.accountID || ""}
            onChange={(e) => setSeleccionado((prev) => prev ? { ...prev, accountID: e.target.value } : ({ accountID: e.target.value } as Vehiculo))}
          />
          <InputBase1 label="TIPO EQUIPO" placeholder="equipmentType" type="text" required submitAttempt={submitAttempt}
            defaultValue={seleccionado?.equipmentType || ""}
            onChange={(e) => setSeleccionado((prev) => prev ? { ...prev, equipmentType: e.target.value } : ({ equipmentType: e.target.value } as Vehiculo))}
          />
          <InputBase1 label="UNIQUE ID" placeholder="uniqueID" type="text" required submitAttempt={submitAttempt}
            value={seleccionado?.uniqueID || ""}
            onChange={(e) => {
              const value = e.target.value;
              setSeleccionado((prev) => ({ ...(prev ?? {} as Vehiculo), uniqueID: value, imeiNumber: value }));
            }}
          />
          <InputBase1 label="DEVICE CODE" placeholder="deviceCode" type="text" required submitAttempt={submitAttempt}
            defaultValue={seleccionado?.deviceCode || ""}
            onChange={(e) => setSeleccionado((prev) => prev ? { ...prev, deviceCode: e.target.value } : ({ deviceCode: e.target.value } as Vehiculo))}
          />
          <InputBase1 label="NÚMERO CHIP" placeholder="simPhoneNumber" type="text" required submitAttempt={submitAttempt}
            defaultValue={seleccionado?.simPhoneNumber || ""}
            onChange={(e) => setSeleccionado((prev) => prev ? { ...prev, simPhoneNumber: e.target.value } : ({ simPhoneNumber: e.target.value } as Vehiculo))}
          />
          <InputBase1 label="IMEI" placeholder="imeiNumber" type="text" value={seleccionado?.imeiNumber || ""} desabilitar />

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
                  !seleccionado?.deviceID || !seleccionado?.accountID ||
                  !seleccionado?.equipmentType || !seleccionado?.uniqueID ||
                  !seleccionado?.deviceCode || !seleccionado?.simPhoneNumber ||
                  !seleccionado?.imeiNumber ||
                  !motivoValido(motivo)
                ) return;
                guardarVehiculo(seleccionado);
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
        onClose={() => setOpenEliminarModal(false)}
        tamaño="w-full max-w-sm"
      >
        <div
          style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textAlign: "center", gap: 16, minHeight: 160,
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
            ¿Está seguro de eliminar la unidad
            <br />
            <strong style={{ color: "#F4F5F7" }}>{vehiculoAEliminar?.deviceID}</strong>?
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
            <ButtonBase variant="danger" disabled={loading} onClick={eliminarVehiculo}>
              {loading ? "Eliminando..." : "Eliminar"}
            </ButtonBase>
          </div>
        </div>
      </ModalEliminar>
    </>
  );
}