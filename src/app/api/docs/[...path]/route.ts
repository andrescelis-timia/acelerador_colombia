import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { checkAdmin } from '@/lib/auth/adminGuard';

const DOCS_DIR = path.join(process.cwd(), 'src', 'data', 'docs');

const CONTENT_TYPES: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const guard = await checkAdmin(req);
  if (!guard.isAdmin) {
    const status = guard.reason === 'no-user' ? 401 : 403;
    return NextResponse.json({ error: guard.reason || 'forbidden' }, { status });
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
