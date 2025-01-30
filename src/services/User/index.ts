import { ResponseUserDto } from './types';
import { API_CONFIG } from '@/lib/api/config';

async function getUserByEmail(email: string): Promise<ResponseUserDto | null> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/users/${email}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Error al obtener usuario: ${response.status} - ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw new Error('Error al obtener usuario: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  getUserByEmail
}; 