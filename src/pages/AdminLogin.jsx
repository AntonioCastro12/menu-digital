import React, { useState } from 'react';
import { login } from '../services/adminService';
import { ShieldCheck, Eye, EyeOff, Lock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onBackToMenu }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password.trim()) {
      setErrorMsg('Por favor ingresa tu contraseña o PIN');
      return;
    }

    setIsLoading(true);

    try {
      await login(password);
      onLoginSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al menú público</span>
        </button>

        {/* Card */}
        <div className="bg-stone-800/90 border border-stone-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-600/20 text-orange-500 border border-orange-500/30 flex items-center justify-center mb-3 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-white">Panel de Administración</h1>
            <p className="text-xs text-stone-400 mt-1">
              Ingresa la contraseña o PIN maestro para gestionar platillos, precios y categorías
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Contraseña o PIN de acceso
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu clave secreta"
                  className="w-full pl-10 pr-10 py-3 bg-stone-900/90 border border-stone-700 rounded-xl text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-orange-600 hover:bg-orange-500 active:scale-[0.98] transition shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <span>Ingresar al panel</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-700/60 text-center">
            <p className="text-[11px] text-stone-500">
              Protegido mediante token HMAC SHA-256 y persistencia en Netlify Blobs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
