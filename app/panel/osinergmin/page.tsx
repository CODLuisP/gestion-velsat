import type { Metadata } from 'next';
import { cookies } from "next/headers";
import { Role } from "@/app/constants/roles";
import OsinergminClient from "./OsinergminClient";

export const metadata: Metadata = {
  title: 'Gestión Velsat | Osinergmin',
};

export default async function OsinergminPage() {
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get("role")?.value;

  let role: Role;

  switch (roleCookie) {
    case "Servidor_125":
      role = "Servidor_125";
      break;
    case "Servidor_107":
      role = "Servidor_107";
      break;
    case "Servidor_125_2":
      role = "Servidor_125_2";
      break;
    default:
      role = "Servidor_125";
  }

  return <OsinergminClient role={role} />;
}
