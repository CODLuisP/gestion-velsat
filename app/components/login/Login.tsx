"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InputBase from "../ui/InputBase";
import ButtonBase from "../ui/ButtonBase";

export default function LoginPage() {
  // 🔐 credenciales simuladas
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "123";

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      if (usuario === ADMIN_USER && password === ADMIN_PASS) {
        // ✅ login correcto → redirigir
        toast.success("¡Ingreso Autorizado!");
        router.push("/panel/dashboard");
      } else {
        // ❌ credenciales incorrectas
        setError("Usuario o contraseña incorrectos");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-80 flex flex-col gap-4"
      >
        <h1 className="text-3xl font-bold text-center">
          Iniciar sesión
        </h1>

        <InputBase
          label="Usuario"
          type="text"
          placeholder="Ingresar usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />

        <InputBase
          label="Contraseña"
          type="password"
          placeholder="Ingresar contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        <ButtonBase type="submit" disabled={loading}>
          {loading ? "Iniciando..." : "Iniciar sesión"}
        </ButtonBase>
      </form>
    </main>
  );
}
