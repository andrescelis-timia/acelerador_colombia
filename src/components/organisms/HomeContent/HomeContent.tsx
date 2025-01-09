import { MetricsOverview } from '@/components/organisms/MetricsOverview';
import { HomeContentProps } from './types';
import { TableCellsIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { BarChart } from '@/components/molecules/BarChart';

export const HomeContent = ({ metrics, charts }: HomeContentProps) => {
  const metricsArray = [
    { 
      title: 'Total Proyectos',
      value: metrics.totalProyectos,
      icon: <TableCellsIcon className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    { 
      title: 'Proyectos Completados',
      value: metrics.proyectosCompletados,
      description: `${((metrics.proyectosCompletados / metrics.totalProyectos) * 100).toFixed(1)}% del total`,
      icon: <CheckCircleIcon className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    },
    { 
      title: 'Tiempo Promedio',
      value: metrics.tiempoPromedio,
      icon: <ClockIcon className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-100'
    },
    { 
      title: 'Objetos Pendientes',
      value: metrics.objetosPendientes,
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />,
      color: 'bg-orange-100'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-[#00A3FF] text-xl font-semibold">Dashboard</h2>
      <MetricsOverview metrics={metricsArray} />
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tiempo Promedio por Etapa</h3>
        <BarChart data={charts.tiempoPromedioEtapas} />
      </div>
    </div>
  );
}; 