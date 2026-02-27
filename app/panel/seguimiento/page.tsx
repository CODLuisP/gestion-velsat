import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Role } from "@/app/constants/roles";
import SeguimientoClient from "./SeguimientoClient";

export const metadata: Metadata = {
  title: "Gestión Velsat | Seguimiento",
};

export default async function SeguimientoPage() {
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get("role")?.value;

  let role: Role;

  switch (roleCookie) {
    case "Servidor_125":
    case "Servidor_107":
    case "Servidor_133":
      role = roleCookie;
      break;
    default:
      role = "Servidor_125";
  }

  return <SeguimientoClient role={role} />;
}



