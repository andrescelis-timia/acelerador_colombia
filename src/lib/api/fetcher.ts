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
      const error = await response.text();
      const customError = new Error(error) as Error & { status: number };
      customError.status = response.status;
      throw customError;
    }

    return response.json();
  };
};

export const useFetcher = () => {
  const { user, country } = useAuth();
  return createFetcher(user?.email, country);
}; 