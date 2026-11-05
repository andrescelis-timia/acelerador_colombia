'use client';

import { useCallback, useEffect, useState, type DragEvent } from 'react';
import {
  ArrowPathIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { analizarCarga, aplicarCarga, crearCarga, getCargas, subirArchivo } from '@/services/RcnCarga';
import type { Carga, EstadoCarga, ResumenCarga, TipoCarga } from '@/services/RcnCarga/types';

const REFRESCO_MS = 5000;
const PAISES = ['CO', 'PE'];

const TIPOS: { tipo: TipoCarga; titulo: string; detalle: string }[] = [
  { tipo: 'rcn', titulo: 'Catálogo RCN', detalle: 'Aplica solo lo que cambió' },
  { tipo: 'legacy', titulo: 'Histórico legacy', detalle: 'Sustituye las filas del país' },
];

const ESTADOS: Record<EstadoCarga, { label: string; className: string }> = {
  esperando_archivo: { label: 'Sin subir', className: 'bg-gray-100 text-gray-600' },
  lanzada: { label: 'Iniciando', className: 'bg-warning-subtle text-warning' },
  en_curso: { label: 'En curso', className: 'bg-warning-subtle text-warning' },
  analizada: { label: 'Por confirmar', className: 'bg-timia-accent/10 text-timia-accent' },
  terminada: { label: 'Aplicada', className: 'bg-success-subtle text-success' },
  rechazada: { label: 'Rechazada', className: 'bg-danger-subtle text-danger' },
  fallida: { label: 'Fallida', className: 'bg-danger-subtle text-danger' },
  interrumpida: { label: 'Interrumpida', className: 'bg-danger-subtle text-danger' },
};

const FASES: Record<string, string> = {
  descargando: 'Descargando el fichero',
  leyendo_csv: 'Leyendo el CSV',
  comparando: 'Comparando con la base',
  comparado: 'Comparación lista',
  cargando_modelo: 'Cargando el modelo',
  generando_embeddings: 'Generando embeddings',
  aplicando: 'Aplicando los cambios',
  limpiando: 'Terminando',
  volcando: 'Preparando el volcado local',
};

// es-CO: es-ES no agrupa los miles en cifras de cuatro digitos.
const numero = new Intl.NumberFormat('es-CO');
const n = (v?: number) => (v === undefined || v === null ? '—' : numero.format(v));

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTamano(bytes: number): string {
  return `${(bytes / 1024 / 1024).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`;
}

function formatDuracion(s?: number): string {
  if (s === undefined || s === null) return '—';
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m ? `${m} m ${r} s` : `${r} s`;
}

const activa = (c: Carga) => c.estado === 'lanzada' || c.estado === 'en_curso';
const titulo = (c: Carga) => (c.tipo === 'rcn' ? 'Catálogo RCN' : `Histórico legacy ${c.pais}`);

function Metrica({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono?: 'alta' | 'baja' }) {
  const color = tono === 'alta' ? 'text-success' : tono === 'baja' ? 'text-danger' : 'text-gray-900';
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{etiqueta}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${color}`}>{valor}</p>
    </div>
  );
}

function PorConfirmar({
  carga,
  aplicando,
  bloqueada,
  alAplicar,
}: {
  carga: Carga;
  aplicando: boolean;
  bloqueada: boolean;
  alAplicar: () => void;
}) {
  const r: ResumenCarga = carga.resumen ?? {};
  const legacy = carga.tipo === 'legacy';
  const sinCambios =
    !legacy && !r.altas && !r.bajas && !r.cambios_texto && !r.cambios_metadatos;
  const generar = (r.pares_necesarios ?? 0) - (r.pares_reutilizados ?? 0);
  const tras = (r.filas_antes ?? 0) + (r.altas ?? 0) - (r.bajas ?? 0);

  return (
    <section className="rounded-lg border border-timia-accent/30 bg-timia-accent/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {sinCambios ? 'El fichero no trae cambios' : 'Revisa los cambios antes de aplicarlos'}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {titulo(carga)} · {carga.archivo} · {carga.usuario}
          </p>
        </div>
        {!sinCambios && (
          <Button size="small" onClick={alAplicar} disabled={aplicando || bloqueada}>
            {aplicando ? 'Iniciando…' : 'Aplicar cambios'}
          </Button>
        )}
      </div>

      {legacy ? (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Metrica etiqueta={`Filas actuales de ${carga.pais}`} valor={n(r.filas_antes)} />
            <Metrica etiqueta="Filas en el CSV" valor={n(r.filas_csv)} />
          </div>
          <p className="mt-3 text-xs text-gray-500">Al aplicar, las filas de {carga.pais} se sustituyen por las del CSV.</p>
        </>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metrica etiqueta="Altas" valor={n(r.altas)} tono={r.altas ? 'alta' : undefined} />
            <Metrica etiqueta="Bajas" valor={n(r.bajas)} tono={r.bajas ? 'baja' : undefined} />
            <Metrica etiqueta="Cambios de texto" valor={n(r.cambios_texto)} />
            <Metrica etiqueta="Cambios de metadatos" valor={n(r.cambios_metadatos)} />
          </div>
          <p className="mt-3 text-xs tabular-nums text-gray-500">
            {n(r.filas_antes)} filas pasarán a {n(tras)}. Se generarán {n(generar)} embeddings y se reutilizarán{' '}
            {n(r.pares_reutilizados)}.
          </p>
        </>
      )}
    </section>
  );
}

function EnCurso({ carga }: { carga: Carga }) {
  const { progreso } = carga;
  const porcentaje = progreso?.total ? Math.round((progreso.hechos / progreso.total) * 100) : 0;
  const fase =
    carga.estado === 'lanzada'
      ? 'Reservando capacidad: puede tardar unos minutos'
      : (carga.fase && FASES[carga.fase]) || 'En curso';

  return (
    <section className="rounded-lg border border-warning-border bg-warning-subtle/60 p-4">
      <div className="flex items-center gap-3">
        <ArrowPathIcon className="h-5 w-5 flex-none animate-spin text-warning-icon" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">
            {carga.accion === 'aplicar' ? 'Aplicando la carga' : 'Analizando el fichero'}
          </h3>
          <p className="truncate text-xs text-gray-600">
            {titulo(carga)} · {fase}
          </p>
        </div>
      </div>
      {progreso && (
        <div className="mt-3">
          <ProgressBar progress={porcentaje} className="!h-1.5" />
          <p className="mt-1 text-right text-[11px] tabular-nums text-gray-500">
            {n(progreso.hechos)} de {n(progreso.total)}
          </p>
        </div>
      )}
    </section>
  );
}

function SelectorFichero({
  archivo,
  deshabilitado,
  alElegir,
}: {
  archivo: File | null;
  deshabilitado: boolean;
  alElegir: (archivo: File | null) => void;
}) {
  const [encima, setEncima] = useState(false);

  const soltar = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setEncima(false);
    const fichero = e.dataTransfer.files?.[0];
    if (fichero && !deshabilitado) alElegir(fichero);
  };

  if (archivo) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
        <DocumentTextIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{archivo.name}</p>
          <p className="text-[11px] tabular-nums text-gray-500">{formatTamano(archivo.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => alElegir(null)}
          disabled={deshabilitado}
          aria-label="Quitar el fichero"
          className="rounded p-1 text-gray-400 hover:text-danger-icon disabled:opacity-40"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={soltar}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-5 text-sm transition-colors ${
        encima
          ? 'border-timia-accent bg-timia-accent/5 text-timia-accent'
          : 'border-gray-300 text-gray-500 hover:border-timia-accent/40 hover:bg-gray-50'
      }`}
    >
      <input
        type="file"
        accept=".csv"
        className="sr-only"
        disabled={deshabilitado}
        onChange={(e) => {
          alElegir(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
      <DocumentArrowUpIcon className="h-5 w-5" aria-hidden="true" />
      Arrastra el CSV o <span className="font-medium text-timia-accent">elígelo</span>
    </label>
  );
}

function Resultado({ carga }: { carga: Carga }) {
  const r = carga.resumen;
  if (!r) return <span className="text-gray-400">—</span>;
  if (carga.tipo === 'legacy') {
    return <span className="tabular-nums text-gray-700">{n(r.filas_despues ?? r.filas_csv)} filas</span>;
  }
  const cambios = (r.cambios_texto ?? 0) + (r.cambios_metadatos ?? 0);
  return (
    <span
      className="inline-flex gap-2 tabular-nums"
      title={`${n(r.altas)} altas · ${n(r.bajas)} bajas · ${n(cambios)} cambios`}
    >
      <span className="text-success">+{n(r.altas)}</span>
      <span className={r.bajas ? 'text-danger' : 'text-gray-400'}>−{n(r.bajas)}</span>
      <span className="text-gray-500">~{n(cambios)}</span>
    </span>
  );
}

interface Props {
  user: string;
  country: string;
}

export const RcnCargaPanel = ({ user, country }: Props) => {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tipo, setTipo] = useState<TipoCarga>('rcn');
  const [pais, setPais] = useState('CO');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subida, setSubida] = useState<number | null>(null);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState('');

  const refrescar = useCallback(async () => {
    try {
      setCargas(await getCargas(user, country));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el historial');
    } finally {
      setCargando(false);
    }
  }, [user, country]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const enCurso = cargas.find(activa);

  useEffect(() => {
    if (!enCurso) return;
    const id = setInterval(refrescar, REFRESCO_MS);
    return () => clearInterval(id);
  }, [enCurso, refrescar]);

  const analizar = async () => {
    if (!archivo) return;
    setError('');
    try {
      setSubida(0);
      const nueva = await crearCarga(user, country, tipo, archivo.name, tipo === 'legacy' ? pais : undefined);
      await subirArchivo(nueva.url_subida, archivo, setSubida);
      await analizarCarga(user, country, nueva.id);
      setArchivo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar la carga');
    } finally {
      setSubida(null);
      refrescar();
    }
  };

  const aplicar = async (id: string) => {
    setError('');
    setAplicando(true);
    try {
      await aplicarCarga(user, country, id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aplicar la carga');
    } finally {
      setAplicando(false);
      refrescar();
    }
  };

  // Solo la última: una carga nueva deja sin efecto los análisis anteriores.
  const pendiente = cargas[0]?.estado === 'analizada' ? cargas[0] : undefined;
  const subiendo = subida !== null;

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-danger-border bg-danger-subtle px-3 py-2 text-xs text-danger">
          <ExclamationTriangleIcon className="h-4 w-4 flex-none text-danger-icon" aria-hidden="true" />
          {error}
        </div>
      )}

      {enCurso && <EnCurso carga={enCurso} />}
      {pendiente && (
        <PorConfirmar
          carga={pendiente}
          aplicando={aplicando}
          bloqueada={Boolean(enCurso)}
          alAplicar={() => aplicar(pendiente.id)}
        />
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">Nueva carga</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Primero se compara el fichero con la base, sin escribir nada. Tú decides si aplicar los cambios.
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de carga">
              {TIPOS.map((t) => {
                const elegido = tipo === t.tipo;
                return (
                  <button
                    key={t.tipo}
                    type="button"
                    role="radio"
                    aria-checked={elegido}
                    onClick={() => setTipo(t.tipo)}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      elegido
                        ? 'border-timia-accent bg-timia-accent/5'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`block text-xs font-semibold ${elegido ? 'text-timia-accent' : 'text-gray-900'}`}>
                      {t.titulo}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-gray-500">{t.detalle}</span>
                  </button>
                );
              })}
            </div>
            {tipo === 'legacy' && (
              <label
                htmlFor="carga-pais"
                className="grid max-w-[8rem] gap-1 text-[10px] font-medium uppercase text-gray-500"
              >
                País
                <select
                  id="carga-pais"
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs normal-case text-gray-900 focus:outline-none focus:ring-1 focus:ring-timia-accent"
                >
                  {PAISES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="space-y-3">
            <SelectorFichero archivo={archivo} deshabilitado={subiendo} alElegir={setArchivo} />
            {subiendo ? (
              <div>
                <ProgressBar progress={subida ?? 0} className="!h-1.5" />
                <p className="mt-1 text-right text-[11px] tabular-nums text-gray-500">Subiendo {subida} %</p>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3">
                {enCurso && <span className="text-[11px] text-gray-500">Espera a que termine la carga en curso</span>}
                <Button size="small" onClick={analizar} disabled={!archivo || Boolean(enCurso)}>
                  Analizar fichero
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-[10px] uppercase text-gray-500">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Carga</th>
              <th className="px-3 py-2 font-medium">Usuario</th>
              <th className="px-3 py-2 font-medium">Resultado</th>
              <th className="px-3 py-2 text-right font-medium">Duración</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  Cargando historial…
                </td>
              </tr>
            )}
            {!cargando && cargas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                  Todavía no hay cargas.
                </td>
              </tr>
            )}
            {cargas.map((c) => {
              const caducada = c.estado === 'analizada' && c.id !== pendiente?.id;
              const estado = caducada
                ? { label: 'Sin aplicar', className: 'bg-gray-100 text-gray-600' }
                : ESTADOS[c.estado] ?? { label: c.estado, className: 'bg-gray-100 text-gray-600' };
              return (
                <tr key={c.id} className="border-b border-gray-100 align-top last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatFecha(c.creada)}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{titulo(c)}</div>
                    <div className="font-mono text-[11px] text-gray-500">{c.archivo}</div>
                    {c.error && <div className="mt-1 max-w-md text-[11px] text-danger">{c.error}</div>}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{c.usuario}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <Resultado carga={c} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-gray-600">
                    {formatDuracion(c.duracion_s)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${estado.className}`}>
                      {estado.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
