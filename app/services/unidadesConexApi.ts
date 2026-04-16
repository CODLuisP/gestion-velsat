import { Role } from "@/app/constants/roles";

type UnidadesConexApi = {
  listUnidadesConex: string;
};

const API_MAP: Record<Role, UnidadesConexApi> = {
  Servidor_125: {
    listUnidadesConex: "https://do.velsat.pe:2083/api/Admin/GetDevicesConex",

  },

  Servidor_107: {
    listUnidadesConex: "https://sub.velsat.pe:2096/api/Admin/GetDevicesConex",
  },

  Servidor_125_2: {
    listUnidadesConex: "https://villa.velsat.pe:8443/api/Admin/GetDevicesConex",

  },
};

export function getUnidadesConexApi(role: Role): UnidadesConexApi {
  return API_MAP[role];
}
