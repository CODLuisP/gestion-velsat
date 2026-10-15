import { Role } from "@/app/constants/roles";

type TracklogApi = {
  auditoria: (accountID: string, deviceID: string) => string;
  consultar: (accountID: string, deviceID: string) => string;
  getUnidadesTracklog: () => string;
};

// Tracklog solo corre en el servidor 107: el resto de servidores no tiene
// este endpoint desplegado.
const BASE_MAP: Partial<Record<Role, string>> = {
  Servidor_107: "https://sub.velsat.pe:2096",
};

export function getTracklogApi(role: Role): TracklogApi {
  const base = BASE_MAP[role];
  const getAuditUrl = (accountID: string, deviceID: string) =>
    `${base}/api/Admin/GetAuditoriaTracklog?accountID=${encodeURIComponent(accountID)}&deviceID=${encodeURIComponent(deviceID)}`;
  return {
    auditoria: getAuditUrl,
    consultar: getAuditUrl,
    getUnidadesTracklog: () =>
      `${base}/api/Admin/GetUnidadesTracklog`,
  };
}
