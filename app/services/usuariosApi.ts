import { Role } from "@/app/constants/roles";

type UsuariosApi = {
  list: string;
  insert: string;
  update: string;
  delete: (id: string) => string;
};

const API_MAP: Record<Role, UsuariosApi> = {
  Servidor_125: {
    list: "https://do.velsat.pe:2083/api/Admin/Usuarios",
    insert: "https://do.velsat.pe:2083/api/Admin/InsertUsuario",
    update: "https://do.velsat.pe:2083/api/Admin/UpdateUser",
    delete: (id) =>
      `https://do.velsat.pe:2083/api/Admin/DeleteUsuario/${id}`,
  },

  Servidor_107: {
    list: "https://sub.velsat.pe:2096/api/Admin/Usuarios",
    insert: "https://sub.velsat.pe:2096/api/Admin/InsertUsuario",
    update: "https://sub.velsat.pe:2096/api/Admin/UpdateUser",
    delete: (id) =>
      `https://sub.velsat.pe:2096/api/Admin/DeleteUsuario/${id}`,
  },

  Servidor_133: {
    list: "https://villa.velsat.pe:8443/api/Admin/Usuarios",
    insert: "https://villa.velsat.pe:8443/api/Admin/InsertUsuario",
    update: "https://villa.velsat.pe:8443/api/Admin/UpdateUser",
    delete: (id) =>
      `https://villa.velsat.pe:8443/api/Admin/DeleteUsuario/${id}`,
  },
};

export function getUsuariosApi(role: Role): UsuariosApi {
  return API_MAP[role];
}
