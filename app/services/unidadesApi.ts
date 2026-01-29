import { Role } from "@/app/constants/roles";

type UnidadesApi = {
  list: string;
  insert: string;
  update: (DeviceID?: string, AccountID?: string) => string;
  delete: (id: string) => string;
};

const API_MAP: Record<Role, UnidadesApi> = {
  Servidor_125: {
    list: "https://do.velsat.pe:2083/api/Admin/GetDevices",
    insert: "https://do.velsat.pe:2083/api/Admin/InsertDevice",
    update: (DeviceID, AccountID) => `https://do.velsat.pe:2083/api/Admin/UpdateDevice?oldDeviceID=${DeviceID}&oldAccountID=${AccountID}`,
    delete: (id) => `https:/api/Admin/DeleteUsuario/${id}`,
  },

  Servidor_107: {
    list: "https://sub.velsat.pe:2096/api/Admin/GetDevices",
    insert: "https://sub.velsat.pe:2096/api/Admin/InsertDevice",
    update: (DeviceID, AccountID) => `https://sub.velsat.pe:2096/api/Admin/UpdateDevice?oldDeviceID=${DeviceID}&oldAccountID=${AccountID}`,
    delete: (id) =>
      `https://server125.velsat.pe/api/DeleteUsuario/${id}`,
  },

  Servidor_133: {
    list: "https://villa.velsat.pe:8443/api/Admin/GetDevices",
    insert: "https://villa.velsat.pe:8443/api/Admin/InsertDevice",
    update: (DeviceID, AccountID) => `https://villa.velsat.pe:8443/api/Admin/UpdateDevice?oldDeviceID=${DeviceID}&oldAccountID=${AccountID}`,
    delete: (id) =>
      `https://server126.velsat.pe/api/DeleteUsuario/${id}`,
  },
};

export function getUnidadesApi(role: Role): UnidadesApi {
  return API_MAP[role];
}
