import { Role } from "@/app/constants/roles";

type SutranApi = {
  auditoria: (accountID: string, deviceID: string) => string;
  getUnidadesSutran: () => string;
  habilitarSutran: (accountID: string, deviceID: string, valor: "0" | "1", actor?: string, motivo?: string) => string;
};

const BASE_MAP: Record<Role, string> = {
  Servidor_125:   "https://do.velsat.pe:2083",
  Servidor_107:   "https://sub.velsat.pe:2096",
  Servidor_125_2: "https://villa.velsat.pe:8443",
};

export function getSutranApi(role: Role): SutranApi {
  const base = BASE_MAP[role];
  return {
    auditoria: (accountID, deviceID) =>
      `${base}/api/Admin/GetAuditoriaSutran?accountID=${encodeURIComponent(accountID)}&deviceID=${encodeURIComponent(deviceID)}`,
    getUnidadesSutran: () =>
      `${base}/api/Admin/GetUnidadesSutran`,
    habilitarSutran: (accountID, deviceID, valor, actor, motivo) =>
      `${base}/api/Admin/HabilitarSutran?accountID=${encodeURIComponent(accountID)}&deviceID=${encodeURIComponent(deviceID)}&valor=${encodeURIComponent(valor)}&actor=${encodeURIComponent(actor ?? "")}&motivo=${encodeURIComponent(motivo ?? "")}`,
  };
}
