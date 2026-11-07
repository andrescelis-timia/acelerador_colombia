/**
 * Sesion unica por usuario: cada login abre una sesion nueva en el backend y
 * deja sin efecto la anterior (gana el ultimo). El AuthContext comprueba la
 * suya cada minuto y al volver a la pestana; si ya no es la vigente, cierra.
 *
 * El identificador va en localStorage: las pestanas del mismo navegador
 * comparten sesion.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const STORAGE_KEY = 'auth_session_id';

export const CHECK_INTERVAL_MS = 60 * 1000;

export type SessionStatus = 'valid' | 'replaced' | 'missing' | 'unknown';

export const storeSessionId = (sessionId: string | null | undefined) => {
  if (sessionId) localStorage.setItem(STORAGE_KEY, sessionId);
};

export const clearSessionId = () => localStorage.removeItem(STORAGE_KEY);

const headers = (email: string, country: string): Record<string, string> => {
  const h: Record<string, string> = { 'X-User': email, 'X-Country': country || 'CO' };
  const sessionId = localStorage.getItem(STORAGE_KEY);
  if (sessionId) h['X-Session'] = sessionId;
  return h;
};

/** Login con Google: el de contrasena ya devuelve la sesion en la respuesta. */
export const startSession = async (email: string, country: string, idToken: string): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/session/start`, {
    method: 'POST',
    headers: { ...headers(email, country), Authorization: `Bearer ${idToken}` },
  });
  if (response.ok) {
    const data = await response.json();
    storeSessionId(data.session_id);
  }
};

/**
 * 'missing': sesion de antes de este cambio (sin identificador), hay que entrar
 * de nuevo. 'unknown': no se pudo comprobar (red, backend caido); no se echa a
 * nadie por eso.
 */
export const checkSession = async (email: string, country: string): Promise<SessionStatus> => {
  if (!localStorage.getItem(STORAGE_KEY)) return 'missing';
  try {
    const response = await fetch(`${API_URL}/auth/session/check`, {
      headers: headers(email, country),
      cache: 'no-store',
    });
    if (!response.ok) return 'unknown';
    const data = await response.json();
    return data.valid ? 'valid' : 'replaced';
  } catch {
    return 'unknown';
  }
};

/** Logout: el backend solo la cierra si sigue siendo la vigente. */
export const endSession = async (email: string, country: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/auth/session/end`, {
      method: 'POST',
      headers: headers(email, country),
    });
  } catch {
    // El logout local sigue aunque el backend no responda.
  }
};
