import { Role } from "@/app/constants/roles";

type UnidadesApi = {
  list: string;
  insert: string;
  update: (DeviceID?: string, AccountID?: string) => string;
  delete: (DeviceID?: string, AccountID?: string) => string;
};

const API_MAP: Record<Role, UnidadesApi> = {
  Servidor_125: {
    list: "https://do.velsat.pe:2083/api/Admin/GetDevices",
    insert: "https://do.velsat.pe:2083/api/Admin/InsertDevice",
    update: (DeviceID, AccountID) => `https://do.velsat.pe:2083/api/Admin/UpdateDevice?oldDeviceID=${DeviceID}&oldAccountID=${AccountID}`,
    delete: (DeviceID, AccountID) => `https://do.velsat.pe:2083/api/Admin/DeleteDevice/${DeviceID}/${AccountID}`,
  },

  Servidor_107: {
    list: "https://sub.velsat.pe:2096/api/Admin/GetDevices",
    insert: "https://sub.velsat.pe:2096/api/Admin/InsertDevice",
    update: (DeviceID, AccountID) => `https://sub.velsat.pe:2096/api/Admin/UpdateDevice?oldDeviceID=${DeviceID}&oldAccountID=${AccountID}`,
    delete: (DeviceID, AccountID) =>
      `https://sub.velsat.pe:2096/api/Admin/DeleteDevice/${DeviceID}/${AccountID}`,
  },

  Servidor_125_2: {
    list: "https://villa.velsat.pe:8443/api/Admin/GetDevices",
    insert: "https://villa.velsat.pe:8443/api/Admin/InsertDevice",
    update: (DeviceID, AccountID) => `https://villa.velsat.pe:8443/api/Admin/UpdateDevice?oldDeviceID=${DeviceID}&oldAccountID=${AccountID}`,
    delete: (DeviceID, AccountID) =>
      `https://villa.velsat.pe:8443/api/Admin/DeleteDevice/${DeviceID}/${AccountID}`,
  },
};

export function getUnidadesApi(role: Role): UnidadesApi {
  return API_MAP[role];
}
