'use client';

/**
 * Las tres estrategias con las que el generador resuelve cada campo, en el
 * orden en que se intentan (`field_orchestrator.py`, repo bbva-ingesta-api-ai).
 *
 * Sin umbrales ni nombres de columnas a propósito: esto es contexto de un
 * vistazo, no documentación. El detalle vive en el repo de IA.
 */
const ESTRATEGIAS = [
  {
    numero: 1,
    titulo: 'Naming legacy gobernado',
    descripcion: 'Reutiliza campos ya gobernados en el país.',
    indice: 'bg-green-100 text-green-700',
  },
  {
    numero: 2,
    titulo: 'Semántica contra RCN',
    descripcion: 'Compara la descripción contra el catálogo RCN.',
    indice: 'bg-blue-100 text-blue-700',
  },
  {
    numero: 3,
    titulo: 'GenAI',
    descripcion: 'Un modelo genera el campo desde cero.',
    indice: 'bg-amber-100 text-amber-700',
  },
];

/**
 * Explica cómo se puebla el diccionario, al lado de la tarjeta que lo genera.
 *
 * El resultado mezcla campos de procedencias muy distintas —uno reutilizado del
 * catálogo gobernado no merece la misma revisión que uno inventado por un
 * modelo— y eso no se veía en ninguna parte antes de generar.
 *
 * Va anclado a la derecha y con ancho fijo (`ml-auto`, no `flex-1`): es apoyo,
 * no el contenido principal, y estirarlo a todo el hueco lo hacía competir con
 * la tarjeta que de verdad importa. En pantallas estrechas ocupa el ancho
 * completo y cae debajo.
 *
 * Contenido estático: no recibe props ni consulta al backend.
 */
export const DictionaryStrategiesPanel = () => (
  <div className="w-full rounded-lg border border-gray-200 bg-gray-50/70 p-4 lg:ml-auto lg:w-[21rem]">
    <h4 className="text-sm font-semibold text-gray-800">Cómo se resuelve cada campo</h4>
    <p className="mt-0.5 text-xs text-gray-500">
      En cascada: si una no acierta, pasa a la siguiente.
    </p>

    <ol className="mt-3 space-y-2">
      {ESTRATEGIAS.map(({ numero, titulo, descripcion, indice }) => (
        <li key={numero} className="flex items-start gap-2">
          <span
            className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${indice}`}
            aria-hidden="true"
          >
            {numero}
          </span>
          <div className="min-w-0">
            <h5 className="text-xs font-medium leading-tight text-gray-800">{titulo}</h5>
            <p className="text-xs leading-tight text-gray-500">{descripcion}</p>
          </div>
        </li>
      ))}
    </ol>
  </div>
);
