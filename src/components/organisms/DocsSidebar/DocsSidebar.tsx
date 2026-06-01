'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_CATALOG } from '@/lib/docs/catalog';

export const DocsSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
      <div className="px-4 py-5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Documentación</h2>
      </div>
      <nav className="px-2 py-3 space-y-5">
        {DOCS_CATALOG.map(group => (
          <div key={group.id}>
            <h3 className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {group.title}
            </h3>
            <ul className="space-y-0.5">
              {group.entries.map(entry => {
                const href =
                  group.id === 'diagramas'
                    ? `/admin/docs/diagramas/${entry.slug}`
                    : `/admin/docs/${entry.slug}`;
                const isActive = pathname === href || pathname.startsWith(href + '/');
                const Icon = entry.icon;
                return (
                  <li key={entry.slug}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                        isActive
                          ? 'bg-timia-accent/10 text-timia-accent font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 flex-shrink-0 ${
                          isActive ? 'text-timia-accent' : 'text-gray-400'
                        }`}
                      />
                      <span className="truncate">{entry.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};
