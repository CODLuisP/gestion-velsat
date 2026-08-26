import { Role } from "@/app/constants/roles";

type OsinergminApi = {
  auditoria: (accountID: string, deviceID: string) => string;
  getUnidadesOsinergmin: () => string;
  habilitarOsinergmin: (accountID: string, deviceID: string, valor: "0" | "1", actor?: string, motivo?: string) => string;
};

const BASE_MAP: Record<Role, string> = {
  Servidor_125:   "https://do.velsat.pe:2083",
  Servidor_107:   "https://sub.velsat.pe:2096",
  Servidor_125_2: "https://villa.velsat.pe:8443",
};

export function getOsinergminApi(role: Role): OsinergminApi {
  const base = BASE_MAP[role];
  return {
    auditoria: (accountID, deviceID) =>
      `${base}/api/Admin/GetAuditoriaOsinergmin?accountID=${encodeURIComponent(accountID)}&deviceID=${encodeURIComponent(deviceID)}`,
    getUnidadesOsinergmin: () =>
      `${base}/api/Admin/GetUnidadesOsinergmin`,
    habilitarOsinergmin: (accountID, deviceID, valor, actor, motivo) =>
      `${base}/api/Admin/HabilitarOsinergmin?accountID=${encodeURIComponent(accountID)}&deviceID=${encodeURIComponent(deviceID)}&valor=${encodeURIComponent(valor)}&actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
  };
}
