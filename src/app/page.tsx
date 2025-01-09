'use client';
import { HomeContent } from '@/components/organisms/HomeContent';

export default function Home() {
  const metrics = {
    totalProyectos: 4,
    proyectosCompletados: 0,
    tiempoPromedio: '3.5 días',
    objetosPendientes: 5
  };

  const charts = {
    tiempoPromedioEtapas: [
      { label: 'Muestra', value: 1.5 },
      { label: 'Pre-diccionario', value: 2.8 },
      { label: 'Diccionario I', value: 3.5 },
      { label: 'Diccionario II', value: 2.2 },
      { label: 'Diccionario III', value: 3.0 },
      { label: 'Revisión', value: 1.8 },
      { label: 'Carga', value: 2.5 }
    ]
  };

  return <HomeContent metrics={metrics} charts={charts} />;
}
