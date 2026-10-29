"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus, Search, Globe, Smartphone, Copy, Check, ChevronDown } from "lucide-react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import InputBase1 from "@/app/components/ui/InputBase1";
import TablaBase, { Column } from "@/app/components/tablas/TablaBase";
import ModalBase from "@/app/components/modal/ModalBase";
import ModalEliminar from "@/app/components/modal/ModalEliminar";
import PanelHeader from "@/app/components/nav/PanelHeader";
import { Role } from "@/app/constants/roles";
import { redirUsuariosApi, RedirCanal } from "@/app/services/redirUsuariosApi";

type Props = {
  actor?: string;
  role: Role;
};

type Redir = {
  id: number;
  loginusu: string;
  servidor: string;
  tipo?: string;
};

type Form = { id?: number; loginusu: string; servidor: string; tipo: string };

const motivoValido = (m: string) => m.trim().length >= 6;

type Ejemplo = { label: string; servidor: string; tipo?: string; loginusu: string };

const EJEMPLOS_WEB: Ejemplo[] = [
  { label: "Usuario/Subusuario DO", servidor: "https://do.velsat.pe:2083", tipo: "n", loginusu: "movilbus" },
  { label: "Usuario/Subusuario SR", servidor: "https://sub.velsat.pe:2096", tipo: "n", loginusu: "sedapal" },
];

const EJEMPLOS_URBANO: Ejemplo[] = [
  { label: "Usuario/Subusuario", servidor: "https://villa.velsat.pe:8443", loginusu: "etudv22" },
];

const EJEMPLOS_MOBILE: Ejemplo[] = [
  { label: "Usuario/Subusuario DO", servidor: "https://velsat.pe:2087", tipo: "n", loginusu: "movilbus" },
  { label: "Usuario/Subusuario SR", servidor: "https://sub.velsat.pe:2087", tipo: "n", loginusu: "sedapal" },
  { label: "Usuario/Subusuario Urbano", servidor: "https://velsat.pe:2083", tipo: "n", loginusu: "transporvilla" },
  { label: "Conductor", servidor: "https://do.velsat.pe:2053", tipo: "c", loginusu: "EPINTADO" },
  { label: "Pasajero", servidor: "https://do.velsat.pe:2053", tipo: "p", loginusu: "TA77810729" },
  { label: "Conductor Turismo", servidor: "https://do.velsat.pe:2053", tipo: "t", loginusu: "10131232" },
];

function CopyCell({ valor, badge = false }: { valor: string; badge?: boolean }) {
  const [ok, setOk] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setOk(true);
      setTimeout(() => setOk(false), 1200);
    } catch {
      toast.error("No se pudo copiar");
    }
  };
  return (
    <button
      type="button"
      onClick={copiar}
      title="Copiar"
      className={`group inline-flex items-center gap-2 h-[26px] px-2 -ml-2 rounded-[6px] font-mono text-[12.5px] cursor-pointer transition-colors hover:bg-[#212226] ${
        badge ? "text-[#F05A28] font-bold" : "text-[#CFCFD3]"
      }`}
    >
      <span>{valor}</span>
      {ok ? (
        <Check size={12} className="text-[#4ADE80]" />
      ) : (
        <Copy size={12} className="text-[#4A4B50] group-hover:text-[#F05A28] transition-colors" />
      )}
    </button>
  );
}

function Ejemplos({ items }: { items: Ejemplo[] }) {
  const [abierto, setAbierto] = useState(false);
  const conTipo = items.some((e) => e.tipo);
  const cols = conTipo
    ? "grid grid-cols-[190px_minmax(0,1.4fr)_70px_minmax(0,1fr)] items-center gap-x-4"
    : "grid grid-cols-[190px_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-x-4";
  return (
    <div className="rounded-[8px] border border-[#26272B] bg-[#18191C]">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-4 h-[38px] cursor-pointer text-left"
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9B9CA1]">
          Ejemplos <span className="text-[#76777C] normal-case font-medium tracking-normal">· clic en un valor para copiarlo</span>
        </span>
        <ChevronDown
          size={15}
          className={`text-[#76777C] transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div className="px-4 pb-3 border-t border-[#26272B]">
          <div className={`${cols} h-[30px] text-[10px] font-bold uppercase tracking-wider text-[#76777C]`}>
            <span>Cuenta</span>
            <span>Servidor</span>
            {conTipo && <span>Tipo</span>}
            <span>Loginusu</span>
          </div>
          {items.map((e) => (
            <div key={e.label + e.servidor} className={`${cols} h-[32px] border-t border-[#212226]`}>
              <span className="text-[12.5px] text-[#9B9CA1] truncate">{e.label}</span>
              <CopyCell valor={e.servidor} />
              {conTipo && <CopyCell valor={e.tipo ?? ""} badge />}
              <CopyCell valor={e.loginusu} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RedirUsuariosClient({ actor, role }: Props) {
  const urbano = role === "Servidor_125_2";
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#121214]">
      <PanelHeader
        title={
          <span>
            Redir. <span className="text-[#F05A28]">Usuarios</span>
          </span>
        }
        subtitle={urbano ? "Servidor asignado a cada usuario (web)" : "Servidor asignado a cada usuario, para web y mobile"}
        role={role}
      />

      <div className="flex-1 min-h-0 p-6 overflow-y-auto flex flex-col gap-6">
        <RedirSection
          canal="web"
          titulo="Web"
          tabla="serverprueba"
          icono={<Globe size={16} />}
          ejemplos={urbano ? EJEMPLOS_URBANO : EJEMPLOS_WEB}
          conTipo={!urbano}
          role={role}
          actor={actor}
        />
        {!urbano && (
          <RedirSection
            canal="mobile"
            titulo="Mobile"
            tabla="servermobile"
            icono={<Smartphone size={16} />}
            ejemplos={EJEMPLOS_MOBILE}
            conTipo
            role={role}
            actor={actor}
          />
        )}
      </div>
    </div>
  );
}

function RedirSection({
  canal,
  titulo,
  tabla,
  icono,
  ejemplos,
  conTipo,
  role,
  actor,
}: {
  canal: RedirCanal;
  titulo: string;
  tabla: string;
  icono: React.ReactNode;
  ejemplos: Ejemplo[];
  conTipo: boolean;
  role: Role;
  actor?: string;
}) {
  const [login, setLogin] = useState("");
  // Usuario cuya búsqueda se muestra; null = aún no se ha buscado
  const [buscado, setBuscado] = useState<string | null>(null);
  const [registros, setRegistros] = useState<Redir[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<Form>({ loginusu: "", servidor: "", tipo: "" });
  const [motivo, setMotivo] = useState("");
  const [submitAttempt, setSubmitAttempt] = useState(false);

  const [aEliminar, setAEliminar] = useState<Redir | null>(null);
  const [motivoEliminar, setMotivoEliminar] = useState("");
  const [submitAttemptEliminar, setSubmitAttemptEliminar] = useState(false);

  const editando = form.id !== undefined;

  const buscar = async (usuario = login) => {
    const u = usuario.trim();
    if (!u) {
      toast.error("Ingrese un usuario (loginusu)");
      return;
    }
    setCargando(true);
    try {
      const res = await axios.get<Redir[]>(redirUsuariosApi.list(role, canal, u));
      setRegistros(res.data);
      setBuscado(u);
    } catch {
      toast.error("No se pudo consultar el usuario");
    } finally {
      setCargando(false);
    }
  };

  const abrirAgregar = () => {
    setForm({ loginusu: buscado ?? login.trim(), servidor: "", tipo: "" });
    setMotivo("");
    setSubmitAttempt(false);
    setOpenForm(true);
  };

  const abrirEditar = (r: Redir) => {
    setForm({ id: r.id, loginusu: r.loginusu, servidor: r.servidor, tipo: r.tipo ?? "" });
    setMotivo("");
    setSubmitAttempt(false);
    setOpenForm(true);
  };

  const guardar = async () => {
    setSubmitAttempt(true);
    if (!form.loginusu.trim() || !form.servidor.trim() || (conTipo && form.tipo.trim().length !== 1) || !motivoValido(motivo)) {
      return;
    }
    setGuardando(true);
    const payload = {
      id: form.id ?? 0,
      loginusu: form.loginusu.trim(),
      servidor: form.servidor.trim(),
      ...(conTipo ? { tipo: form.tipo.trim() } : {}),
    };
    try {
      if (editando) {
        await axios.put(redirUsuariosApi.update(role, canal, actor, motivo), payload);
        toast.success("Registro actualizado");
      } else {
        await axios.post(redirUsuariosApi.insert(role, canal, actor, motivo), payload);
        toast.success("Registro creado");
      }
      setOpenForm(false);
      setLogin(payload.loginusu);
      await buscar(payload.loginusu);
    } catch {
      toast.error("No es posible guardar los cambios");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    setSubmitAttemptEliminar(true);
    if (!motivoValido(motivoEliminar)) return;
    setGuardando(true);
    try {
      await axios.delete(
        redirUsuariosApi.delete(role, canal, aEliminar.id, aEliminar.loginusu, actor, motivoEliminar)
      );
      toast.success("Registro eliminado");
      setAEliminar(null);
      if (buscado) await buscar(buscado);
    } catch {
      toast.error("Error al eliminar el registro");
    } finally {
      setGuardando(false);
    }
  };

  const columns: Column<Redir>[] = [
    {
      key: "loginusu",
      label: "LOGINUSU",
      width: "25%",
      render: (row) => <span className="font-mono text-[13px] text-[#ECECEE] font-medium">{row.loginusu}</span>,
    },
    {
      key: "servidor",
      label: "SERVIDOR",
      width: "45%",
      render: (row) => <span className="font-mono text-[13px] text-[#CFCFD3]">{row.servidor}</span>,
    },
    ...(conTipo
      ? [
          {
            key: "tipo",
            label: "TIPO",
            width: "15%",
            render: (row: Redir) => <span className="font-mono text-[13px] text-[#9B9CA1]">{row.tipo}</span>,
          } as Column<Redir>,
        ]
      : []),
    {
      key: "acciones",
      label: "ACCIONES",
      width: "88px",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => abrirEditar(row)}
            title="Editar registro"
            className="w-[32px] h-[32px] rounded-[7px] bg-[#1A1210] border border-[#5A2A18] text-[#F05A28] hover:border-[#F05A28] hover:bg-[#251814] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => {
              setAEliminar(row);
              setMotivoEliminar("");
              setSubmitAttemptEliminar(false);
            }}
            title="Eliminar registro"
            className="w-[32px] h-[32px] rounded-[7px] bg-[#1A1210] border border-[#5A2A18] text-[#F05A28] hover:border-[#F05A28] hover:bg-[#251814] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const sinResultados = buscado !== null && !cargando && registros.length === 0;

  return (
    <section className="bg-[#161719] border border-[#26272B] rounded-[10px] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[#ECECEE]">
          <span className="text-[#F05A28]">{icono}</span>
          <h2 className="text-[15px] font-bold m-0">{titulo}</h2>
          <span className="font-mono text-[11px] text-[#76777C]">{tabla}</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-[300px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777C] pointer-events-none"
            />
            <input
              type="search"
              placeholder="Usuario (loginusu)"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              className="w-full h-[36px] pl-9 pr-3.5 bg-[#121214] border border-[#2D2E32] rounded-[8px] text-[13px] text-[#ECECEE] placeholder-[#76777C] outline-none transition-colors focus:border-[#F05A28]"
            />
          </div>

          <button
            type="button"
            onClick={() => buscar()}
            disabled={cargando}
            className="h-[36px] px-3.5 rounded-[8px] bg-[#161719] border border-[#26272B] text-[#ECECEE] hover:bg-[#212226] hover:border-[#2D2E32] transition-colors text-[13px] font-medium cursor-pointer"
          >
            {cargando ? "Buscando..." : "Buscar"}
          </button>

          <button
            type="button"
            onClick={abrirAgregar}
            className="h-[36px] px-4 rounded-[8px] bg-[#F05A28] hover:bg-[#FF6A35] text-white font-semibold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus size={16} />
            <span>Nuevo registro</span>
          </button>
        </div>
      </div>

      <Ejemplos items={ejemplos} />

      {buscado === null ? (
        <p className="text-[13px] text-[#76777C] m-0 py-6 text-center">
          Ingrese un usuario para ver sus registros.
        </p>
      ) : sinResultados ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-[13.5px] text-[#CFCFD3] m-0">
            No hay registros para <strong className="text-[#ECECEE]">{buscado}</strong> en {tabla}.
          </p>
          <button
            type="button"
            onClick={abrirAgregar}
            className="h-[36px] px-4 rounded-[8px] bg-[#F05A28] hover:bg-[#FF6A35] text-white font-semibold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus size={16} />
            <span>Agregar registro</span>
          </button>
        </div>
      ) : (
        <div className="max-h-[360px] min-h-[160px] flex flex-col overflow-hidden">
          <TablaBase columns={columns} data={registros} loading={cargando} showIndex={false} />
        </div>
      )}

      {/* ---------- MODAL AGREGAR / EDITAR ---------- */}
      <ModalBase
        open={openForm}
        title={`${editando ? "Editar" : "Agregar"} registro · ${titulo}`}
        onClose={() => setOpenForm(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase1
            label="Loginusu"
            placeholder="Usuario"
            required
            submitAttempt={submitAttempt}
            value={form.loginusu}
            onChange={(e) => setForm((f) => ({ ...f, loginusu: e.target.value }))}
          />

          {conTipo && (
            <InputBase1
              label="Tipo"
              placeholder="1 carácter (ej. p)"
              required
              submitAttempt={submitAttempt}
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value.slice(0, 1) }))}
            />
          )}

          <div className={conTipo ? "col-span-2" : "md:col-span-1"}>
            <InputBase1
              label="Servidor"
              placeholder="https://do.velsat.pe:2053"
              required
              submitAttempt={submitAttempt}
              value={form.servidor}
              onChange={(e) => setForm((f) => ({ ...f, servidor: e.target.value }))}
            />
          </div>

          <div className="col-span-2">
            <InputBase1
              label={editando ? "Motivo del cambio" : "Motivo del alta"}
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
            <ButtonBase variant="secondary" onClick={() => setOpenForm(false)}>
              Cancelar
            </ButtonBase>
            <ButtonBase variant="primary" onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar registro"}
            </ButtonBase>
          </div>
        </div>
      </ModalBase>

      {/* ---------- MODAL ELIMINAR ---------- */}
      <ModalEliminar
        open={aEliminar !== null}
        title="Eliminar registro"
        onClose={() => setAEliminar(null)}
        tamaño="w-full max-w-sm"
      >
        <div className="flex flex-col items-center justify-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-[#1A1210] border border-[#5A2A18] flex items-center justify-center">
            <Trash2 size={20} className="text-[#F05A28]" />
          </div>

          <p className="text-[13.5px] text-[#CFCFD3] m-0">
            Se eliminará el registro de {tabla} definitivamente.
            <br />
            <strong className="text-[#ECECEE] text-base block mt-1">{aEliminar?.loginusu}</strong>
            <span className="font-mono text-[12px] text-[#9B9CA1]">{aEliminar?.servidor}</span>
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
            <ButtonBase variant="secondary" onClick={() => setAEliminar(null)}>
              Cancelar
            </ButtonBase>
            <ButtonBase variant="danger" disabled={guardando} onClick={eliminar}>
              {guardando ? "Eliminando..." : "Eliminar"}
            </ButtonBase>
          </div>
        </div>
      </ModalEliminar>
    </section>
  );
}
