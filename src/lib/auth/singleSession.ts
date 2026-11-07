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

/** Lo emite cada respuesta 401 de una peticion que llevaba sesion. */
export const SESION_RECHAZADA = 'sesion-rechazada';

// Durante el login con Google la app ya pide datos y aun no hay identificador
// que enviar: esas peticiones esperan a que la sesion quede abierta.
let aperturaEnCurso: Promise<void> = Promise.resolve();

/** Marca el inicio de la apertura; la funcion devuelta marca el final. */
export const empezarAperturaSesion = (): (() => void) => {
  let terminar = () => {};
  aperturaEnCurso = new Promise((resolve) => {
    terminar = resolve;
  });
  return terminar;
};

const urlDe = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.href : input.url;
};

// API_URL puede venir con barra final: se quitan las barras antes de comparar.
const API_BASE = API_URL.replace(/\/+$/, '');
const esDeAuth = (url: string) => url.slice(API_BASE.length).replace(/^\/+/, '').startsWith('auth/');

/**
 * Anade X-Session a todas las peticiones a la API y a /api/docs, que el servidor
 * de Next reenvia. Va aqui y no en cada llamada porque la app las construye a
 * mano en muchos sitios y una que se olvide daria 401.
 */
export const enviarSesionEnLasPeticiones = () => {
  const fetchOriginal = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const url = urlDe(input);
    if (!url.startsWith(API_BASE) && !url.startsWith('/api/docs')) {
      return fetchOriginal(input, init);
    }

    // Las de /auth son las que abren la sesion: no pueden esperarse a si mismas.
    const auth = url.startsWith(API_BASE) && esDeAuth(url);
    if (!auth) await aperturaEnCurso;

    const cabeceras = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const sessionId = localStorage.getItem(STORAGE_KEY);
    if (sessionId) cabeceras.set('X-Session', sessionId);

    const response = await fetchOriginal(input, { ...init, headers: cabeceras });
    if (response.status === 401 && sessionId && !auth) {
      window.dispatchEvent(new Event(SESION_RECHAZADA));
    }
    return response;
  };
};

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
 * 'missing': sesion sin identificador o caducada, hay que entrar de nuevo.
 * 'unknown': no se pudo comprobar (red, backend caido); no se echa a nadie por eso.
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
    if (data.valid) return 'valid';
    return data.caducada ? 'missing' : 'replaced';
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
