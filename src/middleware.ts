import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Si no hay sesión y no estamos en login, redirigir a login
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si hay sesión y estamos en login, redirigir a home
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configurar qué rutas deben ser protegidas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (like images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 