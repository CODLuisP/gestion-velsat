import { Role } from "@/app/constants/roles";

// Módulo exclusivo de admin: solo Servidor_125 y Urbano 125 (Servidor_125_2).
const BASES: Partial<Record<Role, string>> = {
  Servidor_125: "https://do.velsat.pe:2083/api/Admin/Redir",
  Servidor_125_2: "https://villa.velsat.pe:8443/api/Admin/Redir",
};

export type RedirCanal = "web" | "mobile";

const q = (v?: string) => encodeURIComponent(v ?? "");

export const redirUsuariosApi = {
  list: (role: Role, canal: RedirCanal, loginusu: string) =>
    `${BASES[role]}/${canal}?loginusu=${q(loginusu)}`,
  insert: (role: Role, canal: RedirCanal, actor?: string, motivo?: string) =>
    `${BASES[role]}/${canal}?actor=${q(actor)}&motivo=${q(motivo)}`,
  update: (role: Role, canal: RedirCanal, actor?: string, motivo?: string) =>
    `${BASES[role]}/${canal}?actor=${q(actor)}&motivo=${q(motivo)}`,
  delete: (role: Role, canal: RedirCanal, id: number, loginusu?: string, actor?: string, motivo?: string) =>
    `${BASES[role]}/${canal}/${id}?loginusu=${q(loginusu)}&actor=${q(actor)}&motivo=${q(motivo)}`,
};
