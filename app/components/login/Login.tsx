"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackgroundEffects } from "./BackgroundEffects";
import { Activity, MapPin, ShieldCheck, Lock } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { Illustration } from "./Illustration";

export default function LoginPage() {
  // 🔐 credenciales simuladas
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "125";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSubmit = async (usuario: string, password: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });

      if (!res.ok) throw new Error("Credenciales incorrectas");

      toast.success("¡Ingreso Autorizado!");
      router.push("/panel/dashboard");
    } catch (err) {
      setError("Usuario o contraseña incorrectos");
      setLoading(false);
    }
  };
  return (
    <main className="relative min-h-screen flex flex-col lg:flex-row items-stretch overflow-hidden">
      {/* Left Section: Form - Fondo Blanco */}
      <section className="w-full lg:w-[45%] xl:w-[40%] p-8 md:p-12 lg:p-16 flex flex-col justify-between relative z-10 bg-white">
        <header className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-900 leading-none">
              Gestión <span className="text-orange-500">Velsat</span>
            </h1>
            <p className="text-[11px]   text-blue-600 font-semibold">
              Gestión de recursos empresariales
            </p>
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Panel de Control</h2>
            <p className="text-gray-600 text-[12px]">
              Bienvenido de nuevo. Por favor, ingresa tus credenciales para acceder al sistema de monitoreo.
            </p>
          </div>

          <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />

          <footer className="mt-8 pt-8 border-t border-gray-200 flex flex-col gap-4">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                <span>Conexión Encriptada SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Localización en Tiempo Real</span>
              </div>
            </div>
          </footer>
        </div>

        <div className="mt-12 text-sm text-gray-500 flex justify-between items-center w-full max-w-md mx-auto">
          <span>&copy; {new Date().getFullYear()} Gestión Velsat</span>
          <div className="flex gap-4 text-right">
            <span>v1.0.0</span>
            <span>Producción</span>
          </div>
        </div>
      </section>

      {/* Right Section: Illustration - Gradiente Azul */}
      <section className="hidden lg:flex w-full lg:w-[55%] xl:w-[60%] items-center justify-center relative p-12 overflow-hidden bg-linear-to-br from-blue-900 via-blue-800 to-blue-950">
        {/* Decorative Grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#3b82f6 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        {/* Glowing Orbs */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-[200px]"></div>
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[200px]"></div>

        <div className="relative z-10 w-full max-w-2xl transform transition-transform duration-700 ease-out">
          <Illustration />
          <div className="mt-8 backdrop-blur-md bg-linear-to-br from-white/10 to-white/5 p-5 rounded-xl text-center max-w-md mx-auto border border-white/30 shadow-2xl relative overflow-hidden">
            {/* Efecto de brillo decorativo */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-orange-400 to-transparent opacity-50"></div>
            
            {/* Círculo decorativo de fondo */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-linear-to-br from-orange-500/20 to-orange-600/20 rounded-lg border border-orange-400/30">
                  <ShieldCheck className="h-5 w-5 text-orange-400" />
                </div>
              </div>

              <p className="text-sm font-bold text-orange-400 mb-2">
                Uso exclusivo para personal autorizado
              </p>

              <p className="text-xs text-white/80 leading-relaxed">
                Este sistema forma parte de la plataforma interna de
                <span className="text-white font-semibold"> Gestión de Recursos Empresariales</span> de Velsat.
              </p>

              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-orange-400/80 font-semibold">
                  <span>Acceso Corporativo Seguro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}