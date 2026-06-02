'use client';

import { useMemo, useState } from 'react';
import { PlusIcon, TrashIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { HIERARCHY_VALUES, SECURITY_STATUS_VALUES } from '@/services/Rcn/types';

interface ColumnMeta {
  name: string;
  label: string;
  numeric?: boolean;
  enumValues?: readonly string[];
}

export const RCN_COLUMNS: ColumnMeta[] = [
  { name: 'id', label: 'ID', numeric: true },
  { name: 'physical_name_field', label: 'Physical name' },
  { name: 'logical_name_sp', label: 'Logical (SP)' },
  { name: 'logical_name_eng', label: 'Logical (EN)' },
  { name: 'field_description_sp', label: 'Description (SP)' },
  { name: 'field_description_eng', label: 'Description (EN)' },
  { name: 'hierarchy', label: 'Hierarchy', enumValues: HIERARCHY_VALUES },
  { name: 'security_class', label: 'Security class' },
  { name: 'security_label', label: 'Security label' },
  { name: 'security_status', label: 'Security status', enumValues: SECURITY_STATUS_VALUES },
  { name: 'date_of_registration', label: 'Date of registration' },
  { name: 'date_of_last_modification', label: 'Date of last modification' },
];

const COLUMN_BY_NAME: Record<string, ColumnMeta> = Object.fromEntries(
  RCN_COLUMNS.map(c => [c.name, c])
);

// Columnas elegibles en SELECT (subset acotado para mantener la UI simple).
// Los filtros siguen aceptando cualquier columna de RCN_COLUMNS.
const SELECTABLE_COLUMNS: ColumnMeta[] = [
  COLUMN_BY_NAME['physical_name_field'],
  COLUMN_BY_NAME['logical_name_sp'],
  COLUMN_BY_NAME['field_description_sp'],
  COLUMN_BY_NAME['hierarchy'],
  COLUMN_BY_NAME['security_class'],
];

const OPERATORS = [
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: 'ILIKE', label: 'ILIKE' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: 'IS NULL', label: 'IS NULL' },
  { value: 'IS NOT NULL', label: 'IS NOT NULL' },
] as const;

type Operator = typeof OPERATORS[number]['value'];

interface FilterRow {
  id: string;
  column: string;
  operator: Operator;
  value: string;
}

const DEFAULT_COLUMNS = new Set(['physical_name_field', 'logical_name_sp', 'field_description_sp', 'hierarchy']);
const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));

const escapeValue = (column: string, operator: Operator, raw: string): string => {
  if (operator === 'IS NULL' || operator === 'IS NOT NULL') return '';
  const meta = COLUMN_BY_NAME[column];
  if (meta?.numeric && /^-?\d+(\.\d+)?$/.test(raw.trim())) return raw.trim();
  let v = raw;
  if (operator === 'ILIKE' && v && !v.includes('%')) v = `%${v}%`;
  return `'${v.replace(/'/g, "''")}'`;
};

const generateSql = (columns: Set<string>, filters: FilterRow[], limit: number): string => {
  const cols = columns.size > 0 ? Array.from(columns).join(', ') : '*';
  let sql = `SELECT ${cols}\nFROM rcn`;

  const validFilters = filters.filter(f => f.column && f.operator);
  if (validFilters.length > 0) {
    const parts = validFilters.map(f => {
      if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') {
        return `${f.column} ${f.operator}`;
      }
      return `${f.column} ${f.operator} ${escapeValue(f.column, f.operator, f.value)}`;
    });
    sql += `\nWHERE ${parts.join('\n  AND ')}`;
  }

  if (limit > 0) sql += `\nLIMIT ${limit}`;
  return sql + ';';
};

interface Props {
  onRun: (sql: string) => void;
  onCopyToEditor: (sql: string) => void;
  loading: boolean;
}

export const RcnQueryBuilder = ({ onRun, onCopyToEditor, loading }: Props) => {
  const [columns, setColumns] = useState<Set<string>>(new Set(DEFAULT_COLUMNS));
  const [filters, setFilters] = useState<FilterRow[]>([
    { id: newId(), column: 'hierarchy', operator: '=', value: 'PRINCIPAL' },
  ]);
  const [limit, setLimit] = useState(50);
  const [copied, setCopied] = useState(false);

  const sql = useMemo(() => generateSql(columns, filters, limit), [columns, filters, limit]);

  const toggleColumn = (name: string) => {
    setColumns(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addFilter = () =>
    setFilters([...filters, { id: newId(), column: RCN_COLUMNS[0].name, operator: '=', value: '' }]);

  const updateFilter = (id: string, patch: Partial<FilterRow>) =>
    setFilters(filters.map(f => (f.id === id ? { ...f, ...patch } : f)));

  const removeFilter = (id: string) => setFilters(filters.filter(f => f.id !== id));

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-5">
      {/* COLUMNAS */}
      <section>
        <SectionTitle>Columnas (SELECT)</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {SELECTABLE_COLUMNS.map(col => {
            const active = columns.has(col.name);
            return (
              <label
                key={col.name}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md border cursor-pointer transition-colors ${
                  active ? 'border-timia-accent bg-timia-accent/5' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleColumn(col.name)}
                  className="h-3.5 w-3.5 text-timia-accent border-gray-300 rounded focus:ring-timia-accent/50"
                />
                <span className="font-mono text-[11px] text-gray-800">{col.name}</span>
              </label>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5">
          {columns.size === 0 ? 'Sin selección → SELECT *' : `${columns.size} columnas`}
        </p>
      </section>

      {/* FILTROS */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle inline>Filtros (WHERE)</SectionTitle>
          <button
            onClick={addFilter}
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-timia-accent hover:bg-timia-accent/5 rounded-md"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Agregar
          </button>
        </div>
        {filters.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">Sin filtros</p>
        ) : (
          <div className="space-y-1.5">
            {filters.map(f => {
              const meta = COLUMN_BY_NAME[f.column];
              const noValue = f.operator === 'IS NULL' || f.operator === 'IS NOT NULL';
              return (
                <div key={f.id} className="flex items-center gap-1.5 text-xs">
                  <select
                    value={f.column}
                    onChange={e => updateFilter(f.id, { column: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-xs font-mono w-44 h-7"
                  >
                    {RCN_COLUMNS.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={f.operator}
                    onChange={e => updateFilter(f.id, { operator: e.target.value as Operator })}
                    className="px-2 py-1 border border-gray-300 rounded text-xs w-28 h-7"
                  >
                    {OPERATORS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {!noValue && (
                    meta?.enumValues ? (
                      <select
                        value={f.value}
                        onChange={e => updateFilter(f.id, { value: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs h-7"
                      >
                        <option value="">—</option>
                        {meta.enumValues.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : (
                      <input
                        type={meta?.numeric ? 'number' : 'text'}
                        value={f.value}
                        onChange={e => updateFilter(f.id, { value: e.target.value })}
                        placeholder={f.operator === 'ILIKE' ? 'cliente (auto %)' : 'valor'}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs h-7 font-mono"
                      />
                    )
                  )}
                  {noValue && <div className="flex-1" />}
                  <button
                    onClick={() => removeFilter(f.id)}
                    type="button"
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Quitar filtro"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* LIMIT */}
      <section className="flex items-center gap-3">
        <SectionTitle inline>Límite</SectionTitle>
        <input
          type="number"
          min={1}
          max={1000}
          value={limit}
          onChange={e => setLimit(parseInt(e.target.value) || 0)}
          className="px-2 py-1 border border-gray-300 rounded text-xs w-20 h-7"
        />
      </section>

      {/* SQL PREVIEW */}
      <section>
        <div className="flex items-center justify-between mb-1.5">
          <SectionTitle inline>SQL generado</SectionTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={copySql}
              type="button"
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100 rounded-md"
              title="Copiar al portapapeles"
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5 text-green-600" /> : <ClipboardIcon className="h-3.5 w-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button
              onClick={() => onCopyToEditor(sql)}
              type="button"
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Enviar a editor libre →
            </button>
          </div>
        </div>
        <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-[11px] font-mono whitespace-pre-wrap overflow-x-auto">
          {sql}
        </pre>
      </section>

      {/* RUN */}
      <div className="flex justify-end">
        <button
          onClick={() => onRun(sql)}
          disabled={loading}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-timia-accent rounded-md hover:bg-timia-accent-hover disabled:opacity-50"
        >
          {loading ? 'Ejecutando…' : 'Ejecutar query construido'}
        </button>
      </div>
    </div>
  );
};

const SectionTitle = ({ children, inline }: { children: React.ReactNode; inline?: boolean }) => (
  <h3 className={`text-[11px] font-semibold uppercase tracking-wide text-gray-500 ${inline ? '' : 'mb-2'}`}>
    {children}
  </h3>
);
