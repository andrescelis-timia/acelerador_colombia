'use client';

import type { RcnEntry } from '@/services/Rcn/types';

interface Props {
  results: RcnEntry[];
  onSelect: (entry: RcnEntry) => void;
}

const HIERARCHY_BADGE: Record<string, string> = {
  PRINCIPAL: 'bg-blue-100 text-blue-700',
  'GLOBAL MODEL': 'bg-purple-100 text-purple-700',
  LEGACY: 'bg-amber-100 text-amber-700',
  SPECIFIC: 'bg-emerald-100 text-emerald-700',
  SECONDARY: 'bg-slate-100 text-slate-700',
  'GLOBAL MODEL SECONDARY': 'bg-pink-100 text-pink-700',
};

const truncate = (text: string | undefined, max = 110) => {
  if (!text) return '—';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
};

const SimilarityBar = ({ value }: { value: number | undefined }) => {
  if (value === undefined) return <span className="text-gray-400">—</span>;
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-timia-accent rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-gray-600 tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
};

export const RcnResultsTable = ({ results, onSelect }: Props) => {
  if (!results.length) {
    return (
      <p className="text-center text-sm text-gray-400 py-8 border border-dashed border-gray-200 rounded-md">
        Sin resultados. Ingresa un término y presiona Buscar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-md">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Physical</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Logical (SP)</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Descripción</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Jerarquía</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Match</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Sim.</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, idx) => {
            const badge = HIERARCHY_BADGE[r.hierarchy] || 'bg-gray-100 text-gray-700';
            // El idx (posicion en la lista paginada) garantiza unicidad incluso
            // si el backend repitiera la misma fila entre paginas.
            const key = `${r.id ?? 'noid'}-${r.matched_field ?? ''}-${idx}`;
            return (
              <tr
                key={key}
                onClick={() => onSelect(r)}
                className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-3 py-2 font-mono text-xs text-gray-900">{r.physical_name_field}</td>
                <td className="px-3 py-2 text-gray-700 max-w-[220px]">
                  <div className="truncate" title={r.logical_name_sp}>{r.logical_name_sp || '—'}</div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600 max-w-[300px]">
                  <div className="line-clamp-2" title={r.field_description_sp}>
                    {truncate(r.field_description_sp, 160)}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-2 py-0.5 text-[11px] rounded-full font-medium ${badge}`}>
                    {r.hierarchy}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">{r.matched_field || '—'}</td>
                <td className="px-3 py-2">
                  <SimilarityBar value={r.similarity} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
