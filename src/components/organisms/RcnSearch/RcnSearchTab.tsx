'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRcnService } from '@/services/Rcn';
import {
  HIERARCHY_VALUES,
  type Hierarchy,
  type RcnEntry,
  type SearchField,
  type SearchMode,
} from '@/services/Rcn/types';
import { RcnResultsTable } from './RcnResultsTable';
import { RcnDetailModal } from './RcnDetailModal';

const MODES: { value: SearchMode; label: string }[] = [
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'strict', label: 'Estricto' },
  { value: 'semantic', label: 'Semántico' },
  { value: 'exact', label: 'Exacto' },
];

export const RcnSearchTab = () => {
  const rcn = useRcnService();
  const [text, setText] = useState('');
  const [mode, setMode] = useState<SearchMode>('hybrid');
  const [field, setField] = useState<SearchField>('both');
  const [hierarchy, setHierarchy] = useState<Hierarchy | ''>('PRINCIPAL');
  const [threshold, setThreshold] = useState(0.7);
  const [limit] = useState(25);

  const [results, setResults] = useState<RcnEntry[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RcnEntry | null>(null);

  const isPhysical = field === 'physical';

  // Columnas pedidas explicitamente al gateway en busqueda fisica.
  // El default del endpoint /campos solo trae 4 columnas y omite el `id`,
  // lo que provoca keys duplicadas en la tabla. Pedimos lo que la tabla
  // y el modal de detalle consumen.
  const PHYSICAL_FIELDS = [
    'id',
    'physical_name_field',
    'logical_name_sp',
    'logical_name_eng',
    'field_description_sp',
    'field_description_eng',
    'hierarchy',
    'security_class',
    'security_label',
    'security_status',
    'date_of_registration',
    'date_of_last_modification',
  ].join(',');

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = isPhysical
        ? await rcn.campos({
            fields: PHYSICAL_FIELDS,
            physical_name: text.trim(),
            hierarchy: hierarchy || undefined,
            limit,
          })
        : await rcn.search({
            text: text.trim(),
            mode,
            field,
            hierarchy: hierarchy || undefined,
            threshold,
            limit,
          });
      setResults(res.data);
      setCount(res.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar');
      setResults([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={
                isPhysical
                  ? 'Buscar por nombre físico (ILIKE, ej. g_entific%)…'
                  : 'Buscar campos por nombre lógico o descripción…'
              }
              className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-timia-accent/50 ${
                isPhysical ? 'font-mono' : ''
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-timia-accent rounded-md hover:bg-timia-accent-hover disabled:opacity-50"
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3 text-xs">
          <div>
            <label className="block text-gray-500 mb-1">Campo</label>
            <select
              value={field}
              onChange={e => setField(e.target.value as SearchField)}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-timia-accent/50 h-8"
            >
              <option value="both">Ambos (lógico + descripción)</option>
              <option value="name">Solo nombre lógico</option>
              <option value="description">Solo descripción</option>
              <option value="physical">Nombre físico (ILIKE)</option>
            </select>
          </div>

          {!isPhysical && (
            <div>
              <label className="block text-gray-500 mb-1">Modo</label>
              <div className="flex gap-1">
                {MODES.map(m => (
                  <button
                    type="button"
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                      mode === m.value
                        ? 'border-timia-accent bg-timia-accent/10 text-timia-accent font-medium'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-500 mb-1">Jerarquía</label>
            <select
              value={hierarchy}
              onChange={e => setHierarchy(e.target.value as Hierarchy | '')}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-timia-accent/50 h-8"
            >
              <option value="">Todas</option>
              {HIERARCHY_VALUES.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {!isPhysical && (
            <div>
              <label className="block text-gray-500 mb-1">Threshold</label>
              <input
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={threshold}
                onChange={e => setThreshold(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-timia-accent/50 h-8"
              />
            </div>
          )}
        </div>
      </form>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">{error}</div>
      )}

      {count > 0 && (
        <p className="text-xs text-gray-500">
          {count} resultado{count === 1 ? '' : 's'}
          {isPhysical ? ' · ILIKE sobre nombre físico' : ` · similarity ≥ ${threshold}`}
        </p>
      )}

      <RcnResultsTable results={results} onSelect={setSelected} />

      <RcnDetailModal entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
};
