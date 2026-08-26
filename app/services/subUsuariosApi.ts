import { Role } from "@/app/constants/roles";

type SubUsuariosApi = {
  list: string;
  insert: (actor?: string, motivo?: string) => string;
  update: (actor?: string, motivo?: string) => string;
  delete: (id: string, actor?: string, motivo?: string) => string;
};

const API_MAP: Record<Role, SubUsuariosApi> = {
  Servidor_125: {
    list: "https://do.velsat.pe:2083/api/Admin/SubUsuarios",
    insert: (actor, motivo) =>
      `https://do.velsat.pe:2083/api/Admin/InsertDeviceUser?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    update: (actor, motivo) =>
      `https://do.velsat.pe:2083/api/Admin/UpdateDeviceUser?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    delete: (id, actor, motivo) =>
      `https://do.velsat.pe:2083/api/Admin/DeleteDeviceUser/${id}?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
  },

  Servidor_107: {
    list: "https://sub.velsat.pe:2096/api/Admin/SubUsuarios",
    insert: (actor, motivo) =>
      `https://sub.velsat.pe:2096/api/Admin/InsertDeviceUser?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    update: (actor, motivo) =>
      `https://sub.velsat.pe:2096/api/Admin/UpdateDeviceUser?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    delete: (id, actor, motivo) =>
      `https://sub.velsat.pe:2096/api/Admin/DeleteDeviceUser/${id}?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
  },

  Servidor_125_2: {
    list: "https://villa.velsat.pe:8443/api/Admin/SubUsuarios",
    insert: (actor, motivo) =>
      `https://villa.velsat.pe:8443/api/Admin/InsertDeviceUser?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    update: (actor, motivo) =>
      `https://villa.velsat.pe:8443/api/Admin/UpdateDeviceUser?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    delete: (id, actor, motivo) =>
      `https://villa.velsat.pe:8443/api/Admin/DeleteDeviceUser/${id}?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
  },
};

export function getSubUsuariosApi(role: Role): SubUsuariosApi {
  return API_MAP[role];
}
