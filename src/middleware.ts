import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const isAuthPage = request.nextUrl.pathname === '/login';
  const currentPath = request.nextUrl.pathname;

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

  return NextResponse.next();
}

// Configurar qué rutas deben ser protegidas
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 