'use client';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useState, Suspense, useEffect } from 'react';
import { PasswordLoginForm } from '@/components/organisms/PasswordLoginForm';
import { ResponseUserDto } from '@/services/User/types';

function LoginContent() {
  const { signInWithGoogle, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'google' | 'password'>('google');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // signInWithGoogle solo abre el popup; el cookie 'session' y el state
  // se setean async en onAuthStateChanged. Empujar antes mete race con el
  // middleware.
  useEffect(() => {
    if (pendingRedirect && isAuthenticated) {
      router.replace(callbackUrl);
    }
  }, [pendingRedirect, isAuthenticated, callbackUrl, router]);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signInWithGoogle();
      setPendingRedirect(true);
    } catch (error) {
      setError((error as Error).message || 'Error al iniciar sesión');
      setIsLoading(false);
    }
  };

  const handlePasswordLoginSuccess = (_token: string, _user: ResponseUserDto) => {
    setPendingRedirect(true);
  };

  const handlePasswordLoginError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleAuthMethodChange = (method: 'google' | 'password') => {
    if (method !== authMethod) {
      setAuthMethod(method);
      setError(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-timia-black relative overflow-hidden">
      {/* Decorative Glow Effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-timia-accent/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-timia-blue/8 rounded-full blur-[120px]" />
      
      <div className="max-w-md w-full space-y-8 p-8 glass-strong rounded-2xl shadow-dark-lg animate-slide-up relative z-10">
        <div className="text-center">
          <img
            src="/logo_timia_white.svg"
            alt="TIMIA"
            width={140}
            height={28}
            className="mx-auto mb-6 opacity-90"
          />
          <h2 className="text-2xl font-bold text-white tracking-tight">PLATAFORMA DE INGESTAS</h2>
          <p className="mt-2 text-gray-400 text-sm">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Auth Method Toggle */}
          <div className="flex rounded-xl p-1 bg-white/5 border border-white/10" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'google'}
              onClick={() => handleAuthMethodChange('google')}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-smooth disabled:cursor-not-allowed ${
                authMethod === 'google'
                  ? 'bg-timia-accent text-white shadow-glow-accent'
                  : 'text-gray-400 hover:text-white disabled:hover:text-gray-400'
              }`}
            >
              Google
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'password'}
              onClick={() => handleAuthMethodChange('password')}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-smooth disabled:cursor-not-allowed ${
                authMethod === 'password'
                  ? 'bg-timia-accent text-white shadow-glow-accent'
                  : 'text-gray-400 hover:text-white disabled:hover:text-gray-400'
              }`}
            >
              Email/Contraseña
            </button>
          </div>

          {/* Google Authentication */}
          {authMethod === 'google' && (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/10 rounded-xl text-sm font-medium text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-timia-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-timia-accent"></div>
                ) : (
                  <Image
                    src="/google-icon.svg"
                    alt="Google"
                    width={20}
                    height={20}
                  />
                )}
                Continuar con Google
              </button>
            </div>
          )}

          {/* Password Authentication */}
          {authMethod === 'password' && (
            <PasswordLoginForm
              onSuccess={handlePasswordLoginSuccess}
              onError={handlePasswordLoginError}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-timia-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-timia-accent"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}