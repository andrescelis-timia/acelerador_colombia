import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper function to decode JWT token (simplified for middleware)
function decodeJWTPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const isAuthPage = request.nextUrl.pathname === '/login';
  const currentPath = request.nextUrl.pathname;
  const isAdminPage = currentPath.startsWith('/admin');

  // Si no hay sesión y no estamos en la página de login, redirigir a login
  if (!session && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    // Solo guardar la ruta si no es la página inicial
    if (currentPath !== '/') {
      loginUrl.searchParams.set('callbackUrl', currentPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Si hay sesión y estamos en la página de login, redirigir a la página guardada o al home
  if (session && isAuthPage) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    return NextResponse.redirect(new URL(callbackUrl || '/', request.url));
  }

  // Protección específica para rutas de admin
  if (isAdminPage && session) {
    // Intentar obtener el token JWT del localStorage (esto se maneja en el cliente)
    // Por ahora, la protección principal estará en el componente del lado del cliente
    // El middleware solo verifica que haya sesión activa
    
    // TODO: En una implementación más robusta, el rol debería estar en una cookie segura
    // o verificarse contra el backend en cada request
  }

  return NextResponse.next();
}

// Configurar qué rutas deben ser protegidas
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 