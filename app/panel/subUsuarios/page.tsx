import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión Velsat | Sub Usuarios',
};
import { cookies } from "next/headers";
import { Role } from "@/app/constants/roles";
import SubUsuariosClient from "./SubUsuariosClient";

export default async function SubUsuariosPage() {
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
    case "Servidor_133":
      role = "Servidor_133";
      break;
    default:
      role = "Servidor_125"; // fallback seguro
  }

  return <SubUsuariosClient role={role} />;
}
