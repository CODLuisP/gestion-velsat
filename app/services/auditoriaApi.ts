import { Role } from "@/app/constants/roles";

type AuditoriaApi = {
  list: (limit?: number, modulo?: string, usuario?: string) => string;
};

const BASE_MAP: Record<Role, string> = {
  Servidor_125:   "https://do.velsat.pe:2083",
  Servidor_107:   "https://sub.velsat.pe:2096",
  Servidor_125_2: "https://villa.velsat.pe:8443",
};

export function getAuditoriaApi(role: Role): AuditoriaApi {
  const base = BASE_MAP[role];
  return {
    list: (limit = 200, modulo, usuario) => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      if (modulo) params.set("modulo", modulo);
      if (usuario) params.set("usuario", usuario);
      return `${base}/api/Admin/GetAuditoriaGeneral?${params.toString()}`;
    },
  };
}
