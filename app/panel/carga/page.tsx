import type { Metadata } from "next";
import { cookies } from "next/headers";
import CargaClient from "./CargaClient";

export const metadata: Metadata = {
  title: "Gestión Velsat | Carga de Data",
};

export default async function CargaPage() {
  const cookieStore = await cookies();
  const actor = cookieStore.get("usuario")?.value;

  return <CargaClient actor={actor} />;
}
