'use client';

import { useEffect, useRef, useState } from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ModeInfo = {
  label: string;
  short: string;
  desc: string;
  formula: string[];
};

const MODES: ModeInfo[] = [
  {
    label: 'Híbrido',
    short: 'Coseno + FTS (OR)',
    desc: 'Combina similitud semántica (vector E5-large multilingüe, 1024d, normalizado) con FTS en español. Retorna documentos cercanos en coseno que contengan al menos una palabra clave del query.',
    formula: [
      'similarity = 1 − (v_q ⊕ v_d)  (coseno, vía pgvector <=>)',
      'FTS:  doc @@ to_tsquery(w₁ | w₂ | … | wₙ)',
      'Filtro: similarity ≥ threshold · orden DESC · LIMIT k',
    ],
  },
  {
    label: 'Estricto',
    short: 'Coseno + FTS (AND)',
    desc: 'Mismo coseno + FTS pero con AND: el documento debe contener TODAS las palabras clave (stopwords removidas). Recall más bajo, precisión más alta.',
    formula: [
      'similarity = 1 − (v_q ⊕ v_d)',
      'FTS:  doc @@ to_tsquery(w₁ & w₂ & … & wₙ)',
      'Filtro: similarity ≥ threshold · orden DESC · LIMIT k',
    ],
  },
  {
    label: 'Semántico',
    short: 'Solo coseno (kNN HNSW)',
    desc: 'Pura similitud vectorial. El encoder E5-large multilingüe genera el embedding del query, búsqueda kNN sobre índice HNSW de pgvector. Tolera sinónimos y paráfrasis.',
    formula: [
      'v_q = E5("query: " + texto), ‖v_q‖ = 1',
      'similarity = 1 − (v_q <=> v_d) = cos(θ)',
      'ORDER BY embedding <=> v_q  (kNN HNSW) · LIMIT k',
    ],
  },
  {
    label: 'Exacto',
    short: 'FTS gate + re-ranking',
    desc: 'FTS AND como gate (todas las palabras), fetch de 50× el límite, luego re-ranking por score compuesto. Penaliza documentos largos y premia overlap léxico con el query.',
    formula: [
      'combined = 0.40·rlr + 0.25·recall + 0.15·precision + 0.20·sim',
      'recall = |kw ∩ doc_words| / |kw|',
      'precision = |kw ∩ doc_words| / |doc_words|',
      'rlr = min(words(q) / words(doc), 1)',
    ],
  },
];

const GLOSSARY: { term: string; meaning: string }[] = [
  {
    term: 'E5-large',
    meaning: 'Modelo de embeddings multilingüe (Microsoft). Convierte texto en vectores de 1024 dimensiones normalizados a longitud 1.',
  },
  {
    term: 'Embedding',
    meaning: 'Representación numérica (vector) de un texto. Textos con significado similar tienen vectores cercanos en el espacio.',
  },
  {
    term: 'Coseno (similitud)',
    meaning: 'Medida de cercanía entre dos vectores: 1.0 = idénticos, 0.0 = ortogonales (sin relación). Para vectores normalizados es el producto punto.',
  },
  {
    term: 'pgvector',
    meaning: 'Extensión de PostgreSQL para almacenar y consultar vectores. El operador <=> devuelve la distancia coseno (1 − similitud).',
  },
  {
    term: 'HNSW',
    meaning: 'Hierarchical Navigable Small World. Índice multinivel que acelera la búsqueda de vecinos más cercanos (kNN) sobre millones de vectores con coste logarítmico.',
  },
  {
    term: 'kNN',
    meaning: 'k-Nearest Neighbors. Encontrar los k vectores más cercanos a un query dado.',
  },
  {
    term: 'FTS',
    meaning: 'Full-Text Search. Búsqueda por palabras clave (no semántica). En Postgres usa tsvector (texto tokenizado) y tsquery (consulta lógica).',
  },
  {
    term: 'tsquery (OR / AND)',
    meaning: 'Expresión lógica para FTS. Operador | (OR) basta con una palabra; operador & (AND) requiere todas.',
  },
  {
    term: 'GIN index',
    meaning: 'Índice invertido de Postgres optimizado para búsquedas en tsvector (cada palabra apunta a los documentos que la contienen).',
  },
  {
    term: 'Stopwords',
    meaning: 'Palabras muy comunes (de, la, en, …) que el FTS filtra antes del match porque no aportan poder discriminativo.',
  },
  {
    term: 'Stemming (Spanish)',
    meaning: 'Reducción de palabras a su raíz ("comprando" → "comprar"). Permite que variantes morfológicas matcheen entre sí.',
  },
  {
    term: 'Threshold',
    meaning: 'Corte mínimo de similitud (0–1) para incluir un resultado. Por defecto 0.7. Subir = más estricto, bajar = más permisivo.',
  },
  {
    term: 'Recall / Precision',
    meaning: 'Recall = qué fracción de las palabras del query aparecen en el documento. Precision = qué fracción de las palabras del documento están en el query.',
  },
  {
    term: 'ILIKE',
    meaning: 'Comparación de texto case-insensitive con wildcards (% = cualquier secuencia). Usado por el modo "Nombre físico".',
  },
];

export const RcnInfoPopover = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Cómo funciona la búsqueda"
        aria-label="Cómo funciona la búsqueda"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-gray-500 hover:text-timia-accent hover:bg-gray-50 transition-colors"
      >
        <InformationCircleIcon className="h-4 w-4" />
        <span>¿Cómo funciona?</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-[560px] max-h-[70vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl">
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Cómo funciona la búsqueda</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Cerrar"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Modos de búsqueda
              </h4>
              <div className="space-y-3">
                {MODES.map(m => (
                  <div key={m.label} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <div className="text-sm font-semibold text-gray-900">{m.label}</div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-500">{m.short}</div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">{m.desc}</p>
                    <div className="space-y-0.5 pt-2 border-t border-gray-100">
                      {m.formula.map((f, i) => (
                        <div key={i} className="font-mono text-[11px] text-gray-700 break-words">
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Glosario de siglas y conceptos
              </h4>
              <dl className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                {GLOSSARY.map(g => (
                  <div key={g.term} className="px-3 py-2 grid grid-cols-[140px_1fr] gap-3">
                    <dt className="text-xs font-semibold text-gray-900">{g.term}</dt>
                    <dd className="text-xs text-gray-600 leading-relaxed">{g.meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
