'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { getGenerationJobs, getGenerationJobsSummary } from '@/services/Observability';
import type {
  GenerationJobAdminItem,
  GenerationJobAdminSummary,
  GenerationJobFilters,
  GenerationJobStatus,
  Marca,
} from '@/services/Observability/types';

const PAGE_SIZE = 50;

const MARCAS: { marca: Marca; color: string }[] = [
  { marca: 'RCN', color: 'bg-green-600' },
  { marca: 'REVISAR', color: 'bg-amber-400' },
  { marca: 'REVISAR IA', color: 'bg-timia-accent' },
  { marca: 'CAMPO LIBRE', color: 'bg-gray-400' },
];

const ESTADOS: Record<GenerationJobStatus, { label: string; className: string }> = {
  completed: { label: 'Completado', className: 'bg-green-50 text-green-700' },
  running: { label: 'En curso', className: 'bg-amber-50 text-amber-700' },
  failed: { label: 'Fallido', className: 'bg-red-50 text-red-700' },
};

const numero = new Intl.NumberFormat('es-ES');

function formatTokens(n?: number): string {
  if (n === undefined || n === null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k`;
  return String(n);
}

function formatDuracion(s: number | null): string {
  if (s === null || s === undefined) return '—';
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m ? `${m} m ${r} s` : `${r} s`;
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  // El backend guarda UTC sin zona.
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function BarraMarcas({ marcas }: { marcas: GenerationJobAdminItem['marcas'] }) {
  const total = MARCAS.reduce((acc, { marca }) => acc + (marcas[marca] ?? 0), 0);
  if (!total) return <span className="text-gray-400">—</span>;
  return (
    <div
      className="flex h-1.5 w-32 overflow-hidden rounded bg-gray-100"
      title={MARCAS.map(({ marca }) => `${marca}: ${marcas[marca] ?? 0}`).join(' · ')}
    >
      {MARCAS.map(({ marca, color }) =>
        marcas[marca] ? (
          <span key={marca} className={color} style={{ width: `${((marcas[marca] ?? 0) / total) * 100}%` }} />
        ) : null,
      )}
    </div>
  );
}

function Detalle({ job }: { job: GenerationJobAdminItem }) {
  if (job.status === 'failed') {
    return <p className="text-xs text-red-700">{job.error || 'La generación falló sin mensaje de error.'}</p>;
  }
  const t = job.tokens;
  return (
    <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt className="text-gray-500">Hoja</dt>
        <dd className="min-w-0 break-all">
          {job.sheet_url ? (
            <a href={job.sheet_url} target="_blank" rel="noopener noreferrer" className="text-timia-blue hover:underline">
              Abrir prediccionario
            </a>
          ) : '—'}
        </dd>
        <dt className="text-gray-500">País</dt>
        <dd>{[job.pais, job.periodicidad].filter(Boolean).join(' · ') || '—'}</dd>
        <dt className="text-gray-500">IP</dt>
        <dd className="font-mono">{job.client_ip || '—'}</dd>
        <dt className="text-gray-500">Campos</dt>
        <dd>
          {job.campos_leidos ?? '—'} leídos · {job.campos_particion ?? 0} de partición · {job.n_campos ?? '—'} procesados
        </dd>
        <dt className="text-gray-500">Tokens</dt>
        <dd>
          {formatTokens(t.total)}
          {t.total ? ` (${formatTokens(t.input)} entrada · ${formatTokens((t.cache_read ?? 0) + (t.cache_write ?? 0))} caché · ${formatTokens(t.output)} salida)` : ''}
        </dd>
      </dl>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        {MARCAS.map(({ marca }) => (
          <Fragment key={marca}>
            <dt className="text-gray-500">{marca}</dt>
            <dd className="tabular-nums">{job.marcas[marca] ?? 0}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

interface Props {
  user: string;
  country: string;
}

export const ObservabilityPanel = ({ user, country }: Props) => {
  const [summary, setSummary] = useState<GenerationJobAdminSummary | null>(null);
  const [jobs, setJobs] = useState<GenerationJobAdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<GenerationJobFilters>({});
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [lista, resumen] = await Promise.all([
        getGenerationJobs(user, country, { ...filters, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
        getGenerationJobsSummary(user, country, 7),
      ]);
      setJobs(lista.items);
      setTotal(lista.total);
      setSummary(resumen);
    } catch (e) {
      console.error('Error cargando la observabilidad:', e);
      setError('No se pudieron cargar las ejecuciones. Comprueba que tu usuario tiene rol ADMIN en el país seleccionado.');
    } finally {
      setLoading(false);
    }
  }, [user, country, filters, page]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarFiltro = (clave: keyof GenerationJobFilters, valor: string) => {
    setPage(0);
    setFilters((f) => ({ ...f, [clave]: valor }));
  };

  const tarjetas = summary
    ? [
        {
          titulo: `Ejecuciones · ${summary.dias} días`,
          valor: numero.format(summary.ejecuciones),
          detalle: `${summary.completadas} completadas · ${summary.fallidas} fallidas · ${summary.en_curso} en curso`,
        },
        {
          titulo: 'Campos procesados',
          valor: numero.format(summary.campos),
          detalle: summary.completadas ? `${Math.round(summary.campos / summary.completadas)} de media por ejecución` : '—',
        },
        {
          titulo: 'Tokens',
          valor: formatTokens(summary.tokens),
          detalle: summary.tokens ? `${Math.round((summary.tokens_cache_read / summary.tokens) * 100)} % leídos de caché` : '—',
        },
      ]
    : [];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {tarjetas.map((t) => (
          <div key={t.titulo} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{t.titulo}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">{t.valor}</p>
            <p className="text-[11px] text-gray-500">{t.detalle}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {([
          ['obs-usuario', 'Usuario', 'usuario', 'search', 'correo'],
          ['obs-objeto', 'Objeto', 'objeto', 'search', 't_crdc_…'],
          ['obs-desde', 'Desde', 'desde', 'date', ''],
          ['obs-hasta', 'Hasta', 'hasta', 'date', ''],
        ] as const).map(([id, label, clave, tipo, placeholder]) => (
          <label key={id} htmlFor={id} className="grid gap-1 text-[10px] font-medium uppercase text-gray-500">
            {label}
            <input
              id={id}
              type={tipo}
              placeholder={placeholder}
              value={(filters[clave] as string) ?? ''}
              onChange={(e) => cambiarFiltro(clave, e.target.value)}
              className="rounded border border-gray-300 px-2.5 py-1 text-xs normal-case text-gray-900 focus:outline-none focus:ring-1 focus:ring-timia-accent"
            />
          </label>
        ))}
        <label htmlFor="obs-estado" className="grid gap-1 text-[10px] font-medium uppercase text-gray-500">
          Estado
          <select
            id="obs-estado"
            value={filters.estado ?? ''}
            onChange={(e) => cambiarFiltro('estado', e.target.value)}
            className="rounded border border-gray-300 px-2.5 py-1 text-xs normal-case text-gray-900 focus:outline-none focus:ring-1 focus:ring-timia-accent"
          >
            <option value="">Todos</option>
            <option value="completed">Completado</option>
            <option value="failed">Fallido</option>
            <option value="running">En curso</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-4 text-[11px] text-gray-500">
        {MARCAS.map(({ marca, color }) => (
          <span key={marca} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-sm ${color}`} /> {marca}
          </span>
        ))}
      </div>

      {error && <p className="text-xs text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-[860px] w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-[10px] uppercase text-gray-500">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Usuario</th>
              <th className="px-3 py-2 font-medium">Objeto</th>
              <th className="px-3 py-2 font-medium">Modo</th>
              <th className="px-3 py-2 text-right font-medium">Campos</th>
              <th className="px-3 py-2 font-medium">Resultado por marca</th>
              <th className="px-3 py-2 text-right font-medium">Tokens</th>
              <th className="px-3 py-2 text-right font-medium">Duración</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-500">Cargando ejecuciones…</td></tr>
            )}
            {!loading && jobs.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-500">No hay generaciones con estos filtros.</td></tr>
            )}
            {!loading && jobs.map((job) => (
              <Fragment key={job.job_id}>
                <tr
                  onClick={() => setAbierto(abierto === job.job_id ? null : job.job_id)}
                  className="cursor-pointer border-b border-gray-100 hover:bg-timia-accent/5"
                >
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatFecha(job.fecha)}</td>
                  <td className="px-3 py-2">{job.usuario}</td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-[11px]">{job.objeto || '—'}</div>
                    <div className="text-[11px] text-gray-500">{job.proyecto}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {job.modo === 'update' ? `Update (${job.campos_regenerados ?? 0})` : job.modo === 'new' ? 'Nuevo' : '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{job.n_campos ?? '—'}</td>
                  <td className="px-3 py-2"><BarraMarcas marcas={job.marcas} /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatTokens(job.tokens.total)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatDuracion(job.duracion_s)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ESTADOS[job.status].className}`}>
                      {ESTADOS[job.status].label}
                    </span>
                  </td>
                </tr>
                {abierto === job.job_id && (
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td colSpan={9} className="px-4 py-4"><Detalle job={job} /></td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-end gap-3 text-xs text-gray-600">
          <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}</span>
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border px-2 py-1 disabled:opacity-40">Anterior</button>
          <button type="button" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)} className="rounded border px-2 py-1 disabled:opacity-40">Siguiente</button>
        </div>
      )}
    </div>
  );
};
