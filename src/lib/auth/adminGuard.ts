/**
 * Helper compartido para validar rol ADMIN en API routes server-side.
 * Llama al backend para verificar el rol del email recibido en X-User.
 */

import { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface AdminCheckResult {
  isAdmin: boolean;
  email: string;
  country: string;
  reason?: 'no-user' | 'forbidden' | 'error';
}

export async function checkAdmin(req: NextRequest): Promise<AdminCheckResult> {
  const email = req.headers.get('X-User') || '';
  const country = req.headers.get('X-Country') || 'CO';

  if (!email) {
    return { isAdmin: false, email: '', country, reason: 'no-user' };
  }

  try {
    const response = await fetch(`${API_URL}/users/role/${encodeURIComponent(email)}`, {
      headers: { 'X-User': email, 'X-Country': country, 'X-Session': req.headers.get('X-Session') || '' },
      cache: 'no-store',
    });
    if (!response.ok) {
      return { isAdmin: false, email, country, reason: 'forbidden' };
    }
    const data = await response.json();
    const role = data.role || data.user_role;
    const isAdmin = role === 'ADMIN' || role === 'ADMIN-READONLY';
    return { isAdmin, email, country, reason: isAdmin ? undefined : 'forbidden' };
  } catch {
    return { isAdmin: false, email, country, reason: 'error' };
  }
}
