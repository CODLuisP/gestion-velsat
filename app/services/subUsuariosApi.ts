import { Role } from "@/app/constants/roles";

type SubUsuariosApi = {
  list: string;
  insert: string;
  update: string;
  delete: (id: string) => string;
};

const API_MAP: Record<Role, SubUsuariosApi> = {
  Servidor_125: {
    list: "https://do.velsat.pe:2083/api/Admin/SubUsuarios",
    insert: "https://do.velsat.pe:2083/api/Admin/InsertDeviceUser",
    update: "https://do.velsat.pe:2083/api/Admin/UpdateDeviceUser",
    delete: (id) =>
      `https://do.velsat.pe:2083/api/Admin/DeleteDeviceUser/${id}`,
  },

  Servidor_107: {
    list: "https://sub.velsat.pe:2096/api/Admin/SubUsuarios",
    insert: "https://sub.velsat.pe:2096/api/Admin/InsertDeviceUser",
    update: "https://sub.velsat.pe:2096/api/Admin/UpdateDeviceUser",
    delete: (id) =>
      `https://sub.velsat.pe:2096/api/Admin/DeleteDeviceUser/${id}`,
  },

  Servidor_125_2: {
    list: "https://villa.velsat.pe:8443/api/Admin/SubUsuarios",
    insert: "https://villa.velsat.pe:8443/api/Admin/InsertDeviceUser",
    update: "https://villa.velsat.pe:8443/api/Admin/UpdateDeviceUser",
    delete: (id) =>
      `https://villa.velsat.pe:8443/api/Admin/DeleteDeviceUser/${id}`,
  },
};

export function getSubUsuariosApi(role: Role): SubUsuariosApi {
  return API_MAP[role];
}
