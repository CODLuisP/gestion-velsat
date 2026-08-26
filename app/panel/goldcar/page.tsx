import type { Metadata } from 'next';
import { cookies } from "next/headers";
import { Role } from "@/app/constants/roles";
import GoldcarClient from "./GoldcarClient";

export const metadata: Metadata = {
  title: 'Gestión Velsat | Goldcar',
};

export default async function GoldcarPage() {
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
      role = "Servidor_125";
  }

  return <GoldcarClient role={role} actor={actor} />;
}
