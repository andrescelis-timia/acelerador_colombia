// Normaliza la URL base para evitar problemas con slashes
const normalizeUrl = (url: string): string => {
  return url.replace(/\/+$/, '');
};

export const API_CONFIG = {
  BASE_URL: normalizeUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1')
} as const; 