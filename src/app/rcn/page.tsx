'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { RcnSearchTab } from '@/components/organisms/RcnSearch/RcnSearchTab';
import { RcnSqlTab } from '@/components/organisms/RcnSearch/RcnSqlTab';

type Tab = 'search' | 'sql';

export default function RcnPage() {
  const [tab, setTab] = useState<Tab>('search');

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col overflow-hidden">
      <header className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">RCN · Repositorio Central de Namings</h1>
        <p className="text-xs text-gray-500 mt-0.5">357K campos de referencia para validar namings.</p>
      </header>

      <nav className="flex border-b border-gray-200 px-4">
        <TabButton active={tab === 'search'} onClick={() => setTab('search')} icon={MagnifyingGlassIcon} label="Búsqueda" />
        <TabButton active={tab === 'sql'} onClick={() => setTab('sql')} icon={CommandLineIcon} label="SQL" />
      </nav>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'search' ? <RcnSearchTab /> : <RcnSqlTab />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
        active
          ? 'border-timia-accent text-timia-accent font-medium'
          : 'border-transparent text-gray-500 hover:text-gray-900'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
