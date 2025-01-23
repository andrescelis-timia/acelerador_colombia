'use client';
import { useAuth } from '@/lib/context/AuthContext';
import Image from 'next/image';
import { useState } from 'react';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (error) {
      setError((error as Error).message || 'Error al iniciar sesión');
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

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3977]"
        >
          <Image
            src="/google-icon.svg"
            alt="Google"
            width={20}
            height={20}
          />
          Continuar con Google
        </button>
      </div>
    </div>
  );
} 