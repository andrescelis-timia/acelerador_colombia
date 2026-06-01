'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { DOCS_CATALOG, findDocBySlug, findGroupForSlug } from '@/lib/docs/catalog';

interface Crumb {
  label: string;
  href?: string;
}

const buildCrumbs = (pathname: string): { crumbs: Crumb[]; description?: string } => {
  const baseCrumb: Crumb = { label: 'Documentación', href: '/admin/docs' };

  // /admin/docs (landing)
  if (pathname === '/admin/docs') {
    return { crumbs: [baseCrumb] };
  }

  // /admin/docs/diagramas/<slug>
  const diagramMatch = pathname.match(/^\/admin\/docs\/diagramas\/([^/]+)$/);
  if (diagramMatch) {
    const slug = diagramMatch[1];
    const entry = findDocBySlug(slug);
    const group = DOCS_CATALOG.find(g => g.id === 'diagramas');
    return {
      crumbs: [
        baseCrumb,
        { label: group?.title || 'Diagramas' },
        { label: entry?.title || slug },
      ],
      description: entry?.description,
    };
  }

  // /admin/docs/<slug>
  const docMatch = pathname.match(/^\/admin\/docs\/([^/]+)$/);
  if (docMatch) {
    const slug = docMatch[1];
    const entry = findDocBySlug(slug);
    const group = findGroupForSlug(slug);
    return {
      crumbs: [
        baseCrumb,
        ...(group ? [{ label: group.title } as Crumb] : []),
        { label: entry?.title || slug },
      ],
      description: entry?.description,
    };
  }

  return { crumbs: [baseCrumb] };
};

export const DocsBreadcrumb = () => {
  const pathname = usePathname();
  const { crumbs, description } = buildCrumbs(pathname);

  return (
    <div className="px-6 py-4 border-b border-gray-200 bg-white">
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />}
              {c.href && !isLast ? (
                <Link href={c.href} className="text-gray-500 hover:text-timia-accent transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                  {c.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
      {description && (
        <p className="text-xs text-gray-500 mt-1.5">{description}</p>
      )}
    </div>
  );
};
