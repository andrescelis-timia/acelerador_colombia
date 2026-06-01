import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DOCS_DIR = path.join(process.cwd(), 'src', 'data', 'docs');
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const CONTENT_TYPES: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
};

async function isAdmin(email: string, country: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/users/role/${encodeURIComponent(email)}`, {
      headers: { 'X-User': email, 'X-Country': country },
      cache: 'no-store',
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.role === 'ADMIN' || data.role === 'ADMIN-READONLY';
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const email = req.headers.get('X-User') || '';
  const country = req.headers.get('X-Country') || 'CO';

  if (!email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const allowed = await isAdmin(email, country);
  if (!allowed) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { path: segments } = await params;
  const relativePath = segments.join('/');

  // Prevenir path traversal
  const resolved = path.resolve(DOCS_DIR, relativePath);
  if (!resolved.startsWith(DOCS_DIR)) {
    return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  }

  try {
    const content = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}
