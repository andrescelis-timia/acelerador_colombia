'use client';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useState, Suspense } from 'react';
import { PasswordLoginForm } from '@/components/organisms/PasswordLoginForm';
import { ResponseUserDto } from '@/services/User/types';

function LoginContent() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'google' | 'password'>('google');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signInWithGoogle();
      router.push(callbackUrl);
    } catch (error) {
      setError((error as Error).message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLoginSuccess = (token: string, user: ResponseUserDto) => {
    console.log('Password login successful:', { token, user });
    // The AuthContext should already be updated by the PasswordLoginForm
    router.push(callbackUrl);
  };

  const handlePasswordLoginError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const toggleAuthMethod = () => {
    setAuthMethod(authMethod === 'google' ? 'password' : 'google');
    setError(null);
    setIsLoading(false);
  };

  const handleAuthMethodChange = (method: 'google' | 'password') => {
    if (method !== authMethod) {
      setAuthMethod(method);
      setError(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#0A3977]">PLATAFORMA DE INGESTAS</h2>
          <p className="mt-2 text-gray-600">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Auth Method Toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'google'}
              onClick={() => handleAuthMethodChange('google')}
              disabled={isLoading}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 disabled:cursor-not-allowed ${
                authMethod === 'google'
                  ? 'bg-white text-[#0A3977] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 disabled:hover:text-gray-500'
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
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 disabled:cursor-not-allowed ${
                authMethod === 'password'
                  ? 'bg-white text-[#0A3977] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 disabled:hover:text-gray-500'
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
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3977] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0A3977]"></div>
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

        {/* Switch Auth Method Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={toggleAuthMethod}
            className="text-sm text-[#0A3977] hover:text-[#082f5f] font-medium transition-colors duration-200"
          >
            {authMethod === 'google' 
              ? '¿Prefieres usar email y contraseña?' 
              : '¿Prefieres continuar con Google?'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A3977]"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 