import { Role } from "@/app/constants/roles";

type DashBoardApi = {
  listUsuarios: string;
  listSubUsuarios: string;
  listUnidades: string;
};

const API_MAP: Record<Role, DashBoardApi> = {
  Servidor_125: {
    listUsuarios: "https://do.velsat.pe:2083/api/Admin/Usuarios", //isActive bool
    listSubUsuarios: "https://do.velsat.pe:2083/api/Admin/SubUsuarios", //status
    listUnidades: "https://do.velsat.pe:2083/api/Admin/GetDevices", //habilitada

  },

  Servidor_107: {
    listUsuarios: "https://sub.velsat.pe:2096/api/Admin/Usuarios", //isActive bool
    listSubUsuarios: "https://sub.velsat.pe:2096/api/Admin/SubUsuarios", //status
    listUnidades: "https://sub.velsat.pe:2096/api/Admin/GetDevices", //isActive
  },

  Servidor_133: {
    listUsuarios: "https://villa.velsat.pe:8443/api/Admin/Usuarios", //isActive bool
    listSubUsuarios: "https://villa.velsat.pe:8443/api/Admin/SubUsuarios", //status
    listUnidades: "https://villa.velsat.pe:8443/api/Admin/GetDevices", //isActive
  },
};

export function getDashBoardApi(role: Role): DashBoardApi {
  return API_MAP[role];
}
