import { ResponseUserDto } from './types';
import { API_CONFIG } from '@/lib/api/config';

async function getUserByEmail(email: string): Promise<ResponseUserDto | null> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/users/${email}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    console.error('Error al obtener usuario:', error);
    throw error;
  }
}

export {
  getUserByEmail
}; 