'use client';

import { useCallback, useEffect, useState } from 'react';
import { analizarCarga, aplicarCarga, crearCarga, getCargas, subirArchivo } from '@/services/RcnCarga';
import type { Carga, EstadoCarga, TipoCarga } from '@/services/RcnCarga/types';

const REFRESCO_MS = 5000;
const PAISES = ['CO', 'PE'];

const ESTADOS: Record<EstadoCarga, { label: string; className: string }> = {
  esperando_archivo: { label: 'Sin subir', className: 'bg-gray-100 text-gray-600' },
  lanzada: { label: 'Iniciando', className: 'bg-amber-50 text-amber-700' },
  en_curso: { label: 'En curso', className: 'bg-amber-50 text-amber-700' },
  analizada: { label: 'Por confirmar', className: 'bg-blue-50 text-blue-700' },
  terminada: { label: 'Aplicada', className: 'bg-green-50 text-green-700' },
  rechazada: { label: 'Rechazada', className: 'bg-red-50 text-red-700' },
  fallida: { label: 'Fallida', className: 'bg-red-50 text-red-700' },
  interrumpida: { label: 'Interrumpida', className: 'bg-red-50 text-red-700' },
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
};

const numero = new Intl.NumberFormat('es-ES');
const n = (v?: number) => (v === undefined || v === null ? '—' : numero.format(v));

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function activa(c: Carga) {
  return c.estado === 'lanzada' || c.estado === 'en_curso';
}

function detalleEnCurso(c: Carga): string {
  if (c.estado === 'lanzada') return 'Esperando capacidad: puede tardar unos minutos.';
  const fase = c.fase ? FASES[c.fase] || c.fase : 'En curso';
  return c.progreso ? `${fase}: ${n(c.progreso.hechos)} de ${n(c.progreso.total)}` : fase;
}

function Resumen({ carga }: { carga: Carga }) {
  const r = carga.resumen;
  if (!r) return null;

  if (carga.tipo === 'legacy') {
    const filas: [string, number | undefined][] = [
      [`Filas actuales de ${r.pais}`, r.filas_antes],
      ['Filas en el CSV', r.filas_csv],
    ];
    return (
      <dl className="grid grid-cols-[auto_auto] justify-start gap-x-6 gap-y-1 text-xs">
        {filas.map(([label, valor]) => (
          <Fragmento key={label} label={label} valor={n(valor)} />
        ))}
      </dl>
    );
  }

  const generar = (r.pares_necesarios ?? 0) - (r.pares_reutilizados ?? 0);
  const filas: [string, string, boolean?][] = [
    ['Altas', n(r.altas)],
    ['Bajas', n(r.bajas), (r.bajas ?? 0) > 0],
    ['Cambios de texto', n(r.cambios_texto)],
    ['Cambios de metadatos', n(r.cambios_metadatos)],
    ['Filas actuales', n(r.filas_antes)],
    ['Filas en el CSV', n(r.filas_csv)],
    ['Embeddings por generar', n(r.pares_generados ?? generar)],
    ['Embeddings reutilizados', n(r.pares_reutilizados)],
  ];
  return (
    <dl className="grid max-w-xl grid-cols-[auto_auto_auto_auto] justify-start gap-x-6 gap-y-1 text-xs">
      {filas.map(([label, valor, alerta]) => (
        <Fragmento key={label} label={label} valor={valor} alerta={alerta} />
      ))}
    </dl>
  );
}

function Fragmento({ label, valor, alerta }: { label: string; valor: string; alerta?: boolean }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className={`font-medium ${alerta ? 'text-red-700' : 'text-gray-900'}`}>{valor}</dd>
    </>
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
  const [aplicando, setAplicando] = useState<string | null>(null);
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

  const hayActiva = cargas.some(activa);

  useEffect(() => {
    if (!hayActiva) return;
    const id = setInterval(refrescar, REFRESCO_MS);
    return () => clearInterval(id);
  }, [hayActiva, refrescar]);

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
    setAplicando(id);
    try {
      await aplicarCarga(user, country, id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aplicar la carga');
    } finally {
      setAplicando(null);
      refrescar();
    }
  };

  const ocupado = subida !== null || hayActiva;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-900">Nueva carga</h2>
        <p className="mt-1 text-xs text-gray-500">
          Primero se compara el fichero con la base, sin escribir nada. Los cambios se aplican cuando los confirmas.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="carga-tipo" className="block text-xs text-gray-600">
              Tipo
            </label>
            <select
              id="carga-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoCarga)}
              className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="rcn">Catálogo RCN</option>
              <option value="legacy">Histórico legacy</option>
            </select>
          </div>
          {tipo === 'legacy' && (
            <div>
              <label htmlFor="carga-pais" className="block text-xs text-gray-600">
                País
              </label>
              <select
                id="carga-pais"
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                {PAISES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="carga-archivo" className="block text-xs text-gray-600">
              Fichero CSV
            </label>
            <input
              id="carga-archivo"
              type="file"
              accept=".csv"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="mt-1 text-sm"
            />
          </div>
          <button
            onClick={analizar}
            disabled={!archivo || ocupado}
            className="rounded-md bg-timia-accent px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {subida !== null ? `Subiendo ${subida} %` : 'Analizar'}
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">Historial</h2>
        {cargando && <p className="px-4 py-3 text-xs text-gray-500">Cargando…</p>}
        {!cargando && cargas.length === 0 && (
          <p className="px-4 py-3 text-xs text-gray-500">Todavía no hay cargas.</p>
        )}
        <ul className="divide-y divide-gray-100">
          {cargas.map((c) => {
            const estado = ESTADOS[c.estado] ?? { label: c.estado, className: 'bg-gray-100 text-gray-600' };
            return (
              <li key={c.id} className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className={`rounded px-2 py-0.5 font-medium ${estado.className}`}>{estado.label}</span>
                  <span className="font-medium text-gray-900">
                    {c.tipo === 'rcn' ? 'Catálogo RCN' : `Legacy ${c.pais}`}
                  </span>
                  <span className="text-gray-600">{c.archivo}</span>
                  <span className="text-gray-500">{c.usuario}</span>
                  <span className="text-gray-500">{formatFecha(c.creada)}</span>
                </div>
                {activa(c) && <p className="text-xs text-gray-600">{detalleEnCurso(c)}</p>}
                {c.error && <p className="text-xs text-red-700">{c.error}</p>}
                <Resumen carga={c} />
                {c.estado === 'analizada' && (
                  <button
                    onClick={() => aplicar(c.id)}
                    disabled={aplicando === c.id || hayActiva}
                    className="rounded-md bg-timia-accent px-3 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Aplicar estos cambios
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
