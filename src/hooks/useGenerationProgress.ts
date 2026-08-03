'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Progreso optimista para operaciones de duración desconocida (una sola
 * petición HTTP sin streaming).
 *
 * Antes cada panel recorría los pasos con `await setTimeout(800)` ANTES de
 * lanzar la petición: para Kirby eran 7 pasos = 5.6s de espera fabricada que
 * se sumaban al tiempo real del backend, y la barra llegaba a 100% cuando la
 * petición ni siquiera había arrancado.
 *
 * Aquí el request arranca de inmediato y el indicador corre en paralelo:
 * avanza hacia el tope (90%) con incrementos decrecientes — nunca lo alcanza
 * por sí solo — y sólo salta a 100% cuando `finish()` confirma la respuesta.
 * Los labels de paso siguen rotando porque informan qué está ocurriendo.
 */

const TICK_MS = 450;
const CEILING = 90;

export function useGenerationProgress(steps: string[]) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepsRef = useRef(steps);

  stepsRef.current = steps;

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Arranca el indicador. Llamar justo antes de lanzar la petición. */
  const start = useCallback(() => {
    clear();
    const list = stepsRef.current;
    setProgress(0);
    setCurrentStep(list[0] ?? '');

    let index = 0;
    timerRef.current = setInterval(() => {
      // Avance decreciente: se acerca al techo sin llegar nunca.
      setProgress(prev => prev + (CEILING - prev) * 0.18);
      index = Math.min(index + 1, list.length - 1);
      setCurrentStep(list[index] ?? '');
    }, TICK_MS);
  }, [clear]);

  /** Cierra el indicador al 100%. Llamar cuando la respuesta llegó OK. */
  const finish = useCallback(() => {
    clear();
    setProgress(100);
  }, [clear]);

  /** Corta el indicador sin completar. Llamar en caso de error. */
  const abort = useCallback(() => {
    clear();
    setProgress(0);
    setCurrentStep('');
  }, [clear]);

  // No dejar intervalos vivos si el panel se desmonta a mitad de generación.
  useEffect(() => clear, [clear]);

  return { progress, currentStep, start, finish, abort };
}
