import { ResponseUserDto } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getUserByEmail(email: string): Promise<ResponseUserDto | null> {
  try {
    const response = await fetch(`${API_URL}/users/${email}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
}

export {
  getUserByEmail
}; 