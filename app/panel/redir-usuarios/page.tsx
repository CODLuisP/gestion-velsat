import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@/app/constants/roles";
import RedirUsuariosClient from "./RedirUsuariosClient";

export const metadata: Metadata = {
  title: "Gestión Velsat | Redir. Usuarios",
};

export default async function RedirUsuariosPage() {
  const cookieStore = await cookies();
  const actor = cookieStore.get("usuario")?.value;
  const role = cookieStore.get("role")?.value;

  // Solo admin, y solo Servidor_125 o Urbano 125
  if (actor !== "admin" || (role !== "Servidor_125" && role !== "Servidor_125_2")) {
    redirect("/panel/dashboard");
  }

  return <RedirUsuariosClient actor={actor} role={role as Role} />;
}
