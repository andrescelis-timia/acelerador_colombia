export interface HomeContentProps {
  metrics: {
    totalProyectos: number;
    proyectosCompletados: number;
    tiempoPromedio: string;
    objetosPendientes: number;
  };
  charts: {
    tiempoPromedioEtapas: {
      label: string;
      value: number;
    }[];
  };
} 