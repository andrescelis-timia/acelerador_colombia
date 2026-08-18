'use client';

/**
 * Aviso de que hay una generación corriendo en segundo plano.
 *
 * Sustituye a los diálogos modales que se usaban antes. Aquellos bloqueaban la
 * pantalla durante los minutos que tarda el proceso sin ofrecer nada a cambio
 * —no se puede cancelar—, y al recargar la página reaparecían sin que el
 * usuario hubiera pedido nada.
 *
 * Aquí el proceso queda visible pero la interfaz sigue usable: solo el botón
 * que lo lanzó permanece deshabilitado, para no encolar dos veces lo mismo.
 *
 * Va en una sola línea y ajustado al contenido (`inline-flex`) a propósito: es
 * un aviso de fondo, no debe robarle espacio al flujo que hay debajo. A ancho
 * completo quedaba una franja de color casi vacía que pesaba más que el propio
 * mensaje.
 */
export const GenerationBanner = () => (
  <div
    role="status"
    aria-live="polite"
    className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md border border-info-border bg-info-subtle px-3 py-1.5"
  >
    <svg className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-info" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4zm2 5.3A8 8 0 014 12H0c0 3 1.1 5.8 3 7.9l3-2.6z" />
    </svg>
    {/* "Procesando" y no "Generando": la cabecera de la seccion ya dice
        "Generar Diccionario" y repetirlo aqui no aporta nada. */}
    <span className="text-sm font-medium text-info">Procesando…</span>
    <span className="text-xs text-gray-500">
      Puedes seguir navegando; el proceso continúa aunque cierres la pestaña.
    </span>
  </div>
);
