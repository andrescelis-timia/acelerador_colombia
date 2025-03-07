import { ResponseUserDto } from './types';
import { API_CONFIG } from '@/lib/api/config';

async function getUserByEmail(email: string): Promise<ResponseUserDto[]> {
  try {
    console.log('Obteniendo usuario por email:', email);
    console.log('URL de la API:', API_CONFIG.BASE_URL);
    
    const url = `${API_CONFIG.BASE_URL}/users/${email}`;
    console.log('URL completa:', url);
    
    const response = await fetch(url);
    console.log('Respuesta de la API:', response.status, response.statusText);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Usuario no encontrado (404)');
        return []; // Devolver array vacío en lugar de null
      }
      throw new Error(`Error al obtener usuario: ${response.status} - ${response.statusText}`);
    }
    
    const userData = await response.json();
    console.log('Datos del usuario obtenidos:', userData);
    
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