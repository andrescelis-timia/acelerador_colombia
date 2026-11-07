import { ResponseUserDto } from './types';
import { API_CONFIG } from '@/lib/api/config';

/** Se llama tras el login con Google, antes de tener sesion: va con su token. */
async function getUserByEmail(email: string, idToken: string): Promise<ResponseUserDto[]> {
  try {
    const url = `${API_CONFIG.BASE_URL}/users/${email}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // Devolver array vacío en lugar de null
      }
      throw new Error(`Error al obtener usuario: ${response.status} - ${response.statusText}`);
    }
    
    const userData = await response.json();
    
    // Asegurarse de que siempre devolvemos un array
    if (Array.isArray(userData)) {
      return userData;
    } else {
      // Si la API devuelve un solo objeto, lo convertimos en array
      return [userData];
    }
  } catch (error) {
    console.error('Error completo al obtener usuario:', error);
    
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return []; // Devolver array vacío en lugar de null
    }
    throw new Error('Error al obtener usuario: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  getUserByEmail
}; 