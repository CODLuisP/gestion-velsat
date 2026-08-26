import { Role } from "@/app/constants/roles";

type UnidadesApi = {
  list: string;
  insert: (actor?: string, motivo?: string) => string;
  update: (DeviceID?: string, AccountID?: string, actor?: string, motivo?: string) => string;
  delete: (DeviceID?: string, AccountID?: string, actor?: string, motivo?: string) => string;
};

const API_MAP: Record<Role, UnidadesApi> = {
  Servidor_125: {
    list: "https://do.velsat.pe:2083/api/Admin/GetDevices",
    insert: (actor, motivo) => `https://do.velsat.pe:2083/api/Admin/InsertDevice?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    update: (DeviceID, AccountID, actor, motivo) => `https://do.velsat.pe:2083/api/Admin/UpdateDevice?oldDeviceID=${DeviceID}&oldAccountID=${AccountID}&actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    delete: (DeviceID, AccountID, actor, motivo) => `https://do.velsat.pe:2083/api/Admin/DeleteDevice/${DeviceID}/${AccountID}?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
  },

  Servidor_107: {
    list: "https://sub.velsat.pe:2096/api/Admin/GetDevices",
    insert: (actor, motivo) => `https://sub.velsat.pe:2096/api/Admin/InsertDevice?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    update: (DeviceID, AccountID, actor, motivo) => `https://sub.velsat.pe:2096/api/Admin/UpdateDevice?oldDeviceID=${DeviceID}&oldAccountID=${AccountID}&actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    delete: (DeviceID, AccountID, actor, motivo) =>
      `https://sub.velsat.pe:2096/api/Admin/DeleteDevice/${DeviceID}/${AccountID}?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
  },

  Servidor_125_2: {
    list: "https://villa.velsat.pe:8443/api/Admin/GetDevices",
    insert: (actor, motivo) => `https://villa.velsat.pe:8443/api/Admin/InsertDevice?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    update: (DeviceID, AccountID, actor, motivo) => `https://villa.velsat.pe:8443/api/Admin/UpdateDevice?oldDeviceID=${DeviceID}&oldAccountID=${AccountID}&actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
    delete: (DeviceID, AccountID, actor, motivo) =>
      `https://villa.velsat.pe:8443/api/Admin/DeleteDevice/${DeviceID}/${AccountID}?actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
  },
};

export function getUnidadesApi(role: Role): UnidadesApi {
  return API_MAP[role];
}

//cambios luis
