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
    <main className="relative min-h-screen flex flex-col lg:flex-row items-stretch text-slate-200 overflow-hidden">
      <BackgroundEffects />

      {/* Left Section: Form */}
      <section className="w-full lg:w-[45%] xl:w-[40%] p-8 md:p-12 lg:p-16 flex flex-col justify-between relative z-10 bg-slate-950/50 backdrop-blur-sm lg:backdrop-blur-none lg:bg-transparent">
        <header className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
              Gestión <span className="text-emerald-400">Velsat</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Gestión de recursos empresariales
            </p>
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Panel de Control</h2>
            <p className="text-slate-400">
              Bienvenido de nuevo. Por favor, ingresa tus credenciales para acceder al sistema de monitoreo.
            </p>
          </div>

          <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />

          <footer className="mt-8 pt-8 border-t border-slate-800/50 flex flex-col gap-4">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
                <span>Conexión Encriptada SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500/70" />
                <span>Localización en Tiempo Real</span>
              </div>
            </div>
          </footer>
        </div>

        <div className="mt-12 text-sm text-slate-500 flex justify-between items-center w-full max-w-md mx-auto">
          <span>&copy; {new Date().getFullYear()} Gestión Velsat</span>
          <div className="flex gap-4 text-right">
            <span>v1.0.0</span>
            <span>Producción</span>
          </div>
        </div>
      </section>

      {/* Right Section: Illustration */}
      <section className="hidden lg:flex w-full lg:w-[55%] xl:w-[60%] items-center justify-center relative p-12 overflow-hidden">
        {/* Decorative Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#0466c8 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        {/* Glowing Orbs */}
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[200px]"></div>

        <div className="relative z-10 w-full max-w-2xl transform transition-transform duration-700 ease-out">
          <Illustration />

          <div className="mt-12 glass-panel p-6 rounded-xl text-center max-w-md mx-auto">
            <div className="flex justify-center mb-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>

            <p className="text-sm font-semibold text-emerald-400">
              Uso exclusivo para personal autorizado
            </p>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Este sistema forma parte de la plataforma interna de
              <span className="text-white font-medium"> Gestión de Recursos Empresariales</span> de
              Velsat.
            </p>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-emerald-500/80">
              <Lock className="w-3.5 h-3.5" />
              <span>Acceso restringido · Uso corporativo</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}