"use client";

import useSWR from "swr";
import axios from "axios";
import { Role } from "@/app/constants/roles";
import { getDashBoardApi } from "@/app/services/dashBoardApi";
import { Usuario, SubUsuario } from "@/app/interfaces/usuario.interface";
import { Vehiculo } from "@/app/interfaces/vehiculo.interface";

const fetcher = async (urls: string[]) => {
  const [usuarios, subUsuarios, vehiculos] = await Promise.all(
    urls.map((url) => axios.get(url).then((res) => res.data))
  );

  return { usuarios, subUsuarios, vehiculos };
};

export function useDashboard(role: Role) {
  const api = getDashBoardApi(role);

  const { data, isLoading, error } = useSWR(
    role ? ["dashboard", role] : null,
    () =>
      fetcher([
        api.listUsuarios,
        api.listSubUsuarios,
        api.listUnidades,
      ]),
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000 * 60 * 5, // 5 min cache
      keepPreviousData: true,
    }
  );

  return {
    usuarios: (data?.usuarios ?? []) as Usuario[],
    subUsuarios: (data?.subUsuarios ?? []) as SubUsuario[],
    vehiculos: (data?.vehiculos ?? []) as Vehiculo[],
    isLoading,
    error,
  };
}
