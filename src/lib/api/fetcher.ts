import { useAuth } from '../context/AuthContext';

interface FetcherOptions extends RequestInit {
  params?: Record<string, string>;
}

export const createFetcher = (user: string | null | undefined, country: string) => {
  return async (url: string, options: FetcherOptions = {}) => {
    if (!user) throw new Error('Usuario no autenticado');

    const headers = {
      ...options.headers,
      'X-User': user,
      'X-Country': country,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'Error desconocido';
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.message || JSON.stringify(errorJson);
      } catch {
        errorMessage = await response.text();
      }
      const customError = new Error(errorMessage) as Error & { status: number };
      customError.status = response.status;
      throw customError;
    }

    if (options.method === 'DELETE' || response.headers.get('content-length') === '0') {
      return undefined;
    }

    return response.json();
  };
};

export const useFetcher = () => {
  const { user, country } = useAuth();
  return createFetcher(user?.email, country);
}; 