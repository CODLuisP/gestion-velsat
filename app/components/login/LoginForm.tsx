import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  loading: boolean;
  error: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading,
  error
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!username || !password) {
      setValidationError('Ingrese su usuario y contraseña.');
      return;
    }

    onSubmit(username, password);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">

      {/* Error de validación */}
      {validationError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {validationError}
        </div>
      )}

      {/* Error de autenticación */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Usuario */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300 ml-1">
          Usuario
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="usuario"
            autoComplete="username"
            disabled={loading}
            className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Contraseña */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center ml-1">
          <label className="text-sm font-medium text-slate-300">
            Contraseña
          </label>
          <a
            href="#"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            ¿Olvidaste la clave?
          </a>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          </div>

          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
            className="block w-full pl-11 pr-12 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Recordar sesión */}
      <div className="flex items-center space-x-3">
        <input
          id="remember"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 cursor-pointer"
        />
        <label
          htmlFor="remember"
          className="text-sm text-slate-400 cursor-pointer hover:text-slate-300"
        >
          Mantener sesión iniciada
        </label>
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={loading}
        className="relative w-full py-3.5 px-6
          bg-linear-to-r from-emerald-600 to-emerald-500
          hover:from-emerald-500 hover:to-emerald-400
          text-white font-semibold rounded-xl
          shadow-lg shadow-emerald-900/20
          flex items-center justify-center gap-2
          active:scale-[0.98]
          transition-all disabled:opacity-70 disabled:cursor-not-allowed
          group overflow-hidden"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Verificando...</span>
          </>
        ) : (
          <>
            <span>Acceder al Sistema</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
      </button>

      {/* Mensaje institucional */}
      <div className="mt-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
        <div className="flex justify-center mb-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </div>
        <p className="text-xs text-slate-300">
          Uso exclusivo para personal autorizado.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Sistema de Gestión de Recursos Empresariales – Velsat
        </p>
      </div>
    </form>
  );
};
