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
};

export default function UnidadesClient({role}: Props) {
  const [busqueda, setBusqueda] = useState("");

  // Modal agregar/editar
  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"editar" | "agregar">("agregar");
  const [seleccionado, setSeleccionado] = useState<Vehiculo | null>(null);

  // Modal eliminar
  const [openEliminarModal, setOpenEliminarModal] = useState(false);
  const [vehiculoAEliminar, setVehiculoAEliminar] = useState<Vehiculo | null>(null);

  //Guardar datos vehiculo antes de editar
  const [vehiculoOriginal, setVehiculoOriginal] = useState<Vehiculo | null>(null);

    //validar al dar en guardar
  const [submitAttempt, setSubmitAttempt] = useState(false);

  // 🔹 Traer usuarios por servidor de la API
  const api = getUnidadesApi(role);

  // 🔹 Traer vehiculos
  const fetchUnidades = async () => {
    const res = await axios.get<Vehiculo[]>(api.list);
  return res.data;
  };

  const { data: vehiculos = [], isLoading } = useSWR(
  role ? ["unidades", role] : null,
  fetchUnidades,
  {
    revalidateOnFocus: false,
    keepPreviousData: true,
  }
);

  // Filtrado de búsqueda
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
      // Determinar si están activos
      const aActivo = a.isActive === "1" || a.habilitada === "1";
      const bActivo = b.isActive === "1" || b.habilitada === "1";

      // Primero por activo
      if (aActivo !== bActivo) {
        return aActivo ? -1 : 1; // Activos primero
      }

      // Luego por deviceID de forma numérica
      return a.deviceID.localeCompare(b.deviceID, undefined, { numeric: true });
    });
  }, [vehiculosFiltrados]);

  // Modal abrir editar
  const abrirEditar = (vehiculo: Vehiculo) => {
    setSeleccionado(vehiculo);
    setVehiculoOriginal({ ...vehiculo });
    setModo("editar");
    setOpenModal(true);
    setSubmitAttempt(false);
  };

  // Modal abrir agregar
  const abrirAgregar = () => {
    setSeleccionado(null);
    setModo("agregar");
    setOpenModal(true);
    setSubmitAttempt(false);
  };

  // Modal abrir eliminar
  const abrirEliminar = (vehiculo: Vehiculo) => {
    setVehiculoAEliminar(vehiculo);
    setOpenEliminarModal(true);
  };

  const cerrarModal = () => {
    setOpenModal(false);
    setSubmitAttempt(false);
  };

  // Guardar usuario
  const guardarVehiculo = async (vehiculo: Vehiculo) => {
    const payloadG = {
        deviceID: vehiculo.deviceID,
        accountID: vehiculo.accountID,
        equipmentType: vehiculo.equipmentType,
        uniqueID: vehiculo.uniqueID,
        deviceCode: vehiculo.deviceCode,
        simPhoneNumber: vehiculo.simPhoneNumber,
        imeiNumber: vehiculo.imeiNumber,
    };

    const payloadU = {
      deviceID: vehiculo.deviceID,
      accountID: vehiculo.accountID,
      equipmentType: vehiculo.equipmentType,
      uniqueID: vehiculo.uniqueID,
      deviceCode: vehiculo.deviceCode,
      simPhoneNumber: vehiculo.simPhoneNumber,
      imeiNumber: vehiculo.imeiNumber,
    };
    console.log("vehiculo post: ", payloadU)
    try {
      if (modo === "editar" && seleccionado) {
        await axios.put(api.update(vehiculoOriginal?.deviceID,vehiculoOriginal?.accountID), payloadU);
        toast.success("Vehiculo actulizado correctamente");
      } else if (modo === "agregar") {
        await axios.post(api.insert, payloadG);
        toast.success("Vehiculo guardado correctamente");
      }
      setOpenModal(false);
      setSeleccionado(null);
      mutate(["unidades", role]);

    } catch (error) {
      // console.error("Error al guardar usuario:", error);
      toast.error("No es posible guardad cambios");
    }
  };

  // Eliminar usuario
  const eliminarVehiculo = async () => {
    if (!vehiculoAEliminar) return;

    try {
      await axios.delete(`https:/api/Admin/DeleteDeviceUser/${vehiculoAEliminar.deviceID}`, {
        data: { id: vehiculoAEliminar.deviceID }
      });
      toast.success("Usuario eliminado");
      setOpenEliminarModal(false);
      setVehiculoAEliminar(null);
      mutate(["unidades", role]);

    } catch (error) {
      //console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar Vehiculo");
    }
  };

  const columns = [
    { key: "accountID", label: "ACCOUNT" },
    { key: "deviceID", label: "PLACA" },
    { key: "equipmentType", label: "TIPO EQUIPO" },
    { key: "uniqueID", label: "UNIQUE ID" },
    { key: "deviceCode", label: "DEVICE CODE" },
    { key: "simPhoneNumber", label: "NÚMERO CHIP" },
    { key: "imeiNumber", label: "IMEI" },
    { key: "isActive", label: "ACTIVO", render: (row: Vehiculo) => (
      <span className={`inline-block w-3 h-3 rounded-full ${row.isActive === "1" || row.habilitada === "1" ? "bg-green-500" : "bg-red-500"}`} />
    )},
    {
      key: "acciones",
      label: "ACCIONES",
      render: (row: Vehiculo) => (
        <div className="flex gap-2">
          <button
            className="p-2 rounded hover:bg-blue-100 text-blue-600"
            onClick={() => abrirEditar(row)}
          >
            <Pencil size={16} />
          </button>
          <button
            disabled={row.isActive ==="1" || row.habilitada === "1" ? false : true}
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
      {/* Header con selección de servidor */}
      <div className="flex h-full min-h-0 flex-col">

        <section className="mb-4 text-sky-950">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    Gestión de Unidades
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

        {/* Tabla */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TablaBase
            leftActions={
              <div className="w-96">
                <ImputBuscar
                  placeholder="Buscar por Account, Placa, Tipo Equipo o UniqueID"
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
            data={vehiculosOrdenados}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Modal Agregar/Editar */}
      <ModalBase
        open={openModal}
        title={modo === "editar" ? "Editar Unidad" : "Agregar Nueva Unidad"}
        onClose={cerrarModal}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputBase1 label="Servidor" value={role} desabilitar />

          <InputBase1
            label="PLACA"
            placeholder="Placa"
            type="text"
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
            label="ACCOUNT"
            placeholder="AccountID"
            type="text"
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
            label="TIPO EQUIPO"
            placeholder="equipmentType"
            type="text"
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
            label="UNIQUE ID"
            placeholder="uniqueID"
            type="text"
            required
            submitAttempt={submitAttempt}
            value={seleccionado?.uniqueID || ""}
            onChange={(e) => {
              const value = e.target.value;

              setSeleccionado((prev) => ({
                ...(prev ?? {} as Vehiculo),
                uniqueID: value,
                imeiNumber: value, // 👈 copia directa
              }));
            }}
          />
          <InputBase1
            label="DEVICE CODE"
            placeholder="deviceCode"
            type="text"
            required
            submitAttempt={submitAttempt}
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
            label="NÚMERO CHIP"
            placeholder="simPhoneNumber"
            type="text"
            required
            submitAttempt={submitAttempt}
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
            label="IMEI"
            placeholder="imeiNumber"
            type="text"
            value={seleccionado?.imeiNumber || ""}
            desabilitar
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
              onClick={() => {
                setSubmitAttempt(true);

                if (
                  !seleccionado?.deviceID ||
                  !seleccionado?.accountID ||
                  !seleccionado?.equipmentType ||
                  !seleccionado?.uniqueID ||
                  !seleccionado?.deviceCode ||
                  !seleccionado?.simPhoneNumber ||
                  !seleccionado?.imeiNumber 
                ) {
                  return;
                }
              
                guardarVehiculo(seleccionado)
                }
              }
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
            <strong>{vehiculoAEliminar?.deviceID}</strong>?
          </p>

          <div className="flex gap-2">
            <ButtonBase
              variant="secondary"
              onClick={() => setOpenEliminarModal(false)}
            >
              Cancelar
            </ButtonBase>

            <ButtonBase
              onClick={eliminarVehiculo}
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
