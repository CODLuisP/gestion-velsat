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
             <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm font-medium">
          {validationError}
        </div>
      )}

      {/* Error de autenticación */}
      {error && (
   <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Usuario */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 ml-1">
          Usuario
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="usuario"
            autoComplete="username"
            disabled={loading}
            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Contraseña */}
      <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
          <label className="text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <a
            href="#"
            className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
          >
            ¿Olvidaste la clave?
          </a>
        </div>

     <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          </div>

          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
            className="block w-full pl-11 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
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
          className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <label
          htmlFor="remember"
          className="text-sm text-gray-600 cursor-pointer hover:text-gray-700"
        >
          Mantener sesión iniciada
        </label>
      </div>

      {/* Botón */}
<button
  type="submit"
  disabled={loading}
  className="relative w-full py-3.5 px-6 bg-linear-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
>
  {/* Efecto de brillo animado */}
  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
  
  {/* Efecto de resplandor sutil */}
  <div className="absolute inset-0 bg-linear-to-t from-orange-700/0 via-orange-600/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
  
  {/* Contenido del botón */}
  <span className="relative z-10 flex items-center gap-2">
    {loading ? (
      <>
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Verificando...</span>
      </>
    ) : (
      <>
        <span>Acceder al Sistema</span>
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
      </>
    )}
  </span>
</button>

      {/* Mensaje institucional */}
<div className="mt-6 p-4 rounded-xl border border-blue-200 bg-blue-50 text-center">
        <div className="flex justify-center mb-2">
          <ShieldCheck className="h-5 w-5 text-orange-500" />
        </div>
        <p className="text-xs text-gray-700 font-medium">
          Uso exclusivo para personal autorizado.
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Sistema de Gestión de Recursos Empresariales – Velsat
        </p>
      </div>
    </form>
  );
};
