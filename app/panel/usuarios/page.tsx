import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión Velsat | Usuarios',
};
import { cookies } from "next/headers";
import UsuariosClient from "./UsuariosClient";
import { Role } from "@/app/constants/roles";

export default async function UsuariosPage() {
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get("role")?.value;
  const actor = cookieStore.get("usuario")?.value;

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
      role = "Servidor_125"; // fallback seguro
  }

  return <UsuariosClient role={role} actor={actor} />;
}
