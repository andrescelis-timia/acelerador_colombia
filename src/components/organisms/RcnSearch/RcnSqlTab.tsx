'use client';

import { useState } from 'react';
import { PlayIcon, TrashIcon, WrenchScrewdriverIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { useRcnService } from '@/services/Rcn';
import { RcnQueryBuilder } from './RcnQueryBuilder';

type Mode = 'builder' | 'editor';

const SAMPLE_QUERY = `SELECT physical_name_field, logical_name_sp, hierarchy
FROM rcn
WHERE hierarchy = 'PRINCIPAL'
  AND logical_name_sp ILIKE '%cliente%'
LIMIT 50;`;

const formatCell = (v: unknown): string => {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

export const RcnSqlTab = () => {
  const rcn = useRcnService();
  const [mode, setMode] = useState<Mode>('builder');
  const [sql, setSql] = useState(SAMPLE_QUERY);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (queryToRun: string) => {
    if (!queryToRun.trim()) return;
    setLoading(true);
    setError(null);
    setRows([]);
    setColumns([]);
    setCount(0);
    setElapsedMs(null);
    const t0 = performance.now();
    try {
      const res = await rcn.query({ query: queryToRun });
      setRows(res.data);
      setColumns(res.data[0] ? Object.keys(res.data[0]) : []);
      setCount(res.count);
      setElapsedMs(Math.round(performance.now() - t0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setSql('');
    setRows([]);
    setColumns([]);
    setCount(0);
    setError(null);
    setElapsedMs(null);
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="inline-flex bg-gray-100 rounded-md p-0.5">
        <ModeButton active={mode === 'builder'} onClick={() => setMode('builder')} icon={WrenchScrewdriverIcon} label="Constructor" />
        <ModeButton active={mode === 'editor'} onClick={() => setMode('editor')} icon={CodeBracketIcon} label="Editor libre" />
      </div>

      {/* Builder or Editor */}
      {mode === 'builder' ? (
        <RcnQueryBuilder
          loading={loading}
          onRun={execute}
          onCopyToEditor={(generated) => {
            setSql(generated);
            setMode('editor');
          }}
        />
      ) : (
        <div>
          <textarea
            value={sql}
            onChange={e => setSql(e.target.value)}
            spellCheck={false}
            rows={8}
            className="w-full px-3 py-2 text-xs font-mono text-gray-800 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-timia-accent/50 resize-y"
            placeholder="SELECT ... FROM rcn WHERE ..."
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-gray-500">
              Solo <code className="px-1 bg-gray-100 rounded">SELECT</code> contra la tabla <code className="px-1 bg-gray-100 rounded">rcn</code>. Sin <code className="px-1 bg-gray-100 rounded">;</code> múltiples.
            </p>
            <div className="flex gap-2">
              <button
                onClick={clear}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Limpiar
              </button>
              <button
                onClick={() => execute(sql)}
                disabled={loading || !sql.trim()}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-timia-accent rounded-md hover:bg-timia-accent-hover disabled:opacity-50"
              >
                <PlayIcon className="h-3.5 w-3.5" />
                {loading ? 'Ejecutando…' : 'Ejecutar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
          {error}
        </div>
      )}

      {count > 0 && (
        <div className="text-xs text-gray-500">
          {count} fila{count === 1 ? '' : 's'}{elapsedMs !== null && ` · ${elapsedMs} ms`}
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-md max-h-[60vh] overflow-y-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map(c => (
                  <th key={c} className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  {columns.map(c => (
                    <td key={c} className="px-3 py-1.5 font-mono text-gray-800 align-top max-w-[280px]">
                      <div className="truncate" title={formatCell(row[c])}>
                        {formatCell(row[c])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

function ModeButton({
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
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
        active ? 'bg-white text-timia-accent font-medium shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
