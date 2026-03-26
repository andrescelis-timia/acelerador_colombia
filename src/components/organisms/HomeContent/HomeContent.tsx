import { HomeContentProps } from './types';
import {
  FolderIcon,
  CubeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { BarChart } from '@/components/molecules/BarChart';

const formatTimeAgo = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
};

export const HomeContent = ({ stats, loading }: HomeContentProps) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-[#00A3FF] text-xl font-semibold">Dashboard</h2>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0A3977] mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Cargando metricas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h2 className="text-[#00A3FF] text-xl font-semibold">Dashboard</h2>
        <div className="text-center py-20 text-gray-500">No se pudieron cargar las metricas</div>
      </div>
    );
  }

  const metricCards = [
    { title: 'Proyectos', value: stats.projects.total, icon: FolderIcon, color: 'bg-blue-100', iconColor: 'text-blue-600' },
    { title: 'Objetos', value: stats.objects.total, icon: CubeIcon, color: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { title: 'En Curso', value: stats.objects.by_status.in_progress, icon: ArrowPathIcon, color: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { title: 'Completados', value: stats.objects.by_status.completed, icon: CheckCircleIcon, color: 'bg-green-100', iconColor: 'text-green-600' },
  ];

  const phaseOrder = ['gobierno', 'kirby', 'hammurabi', 'smartcleaner', 'controlm'];

  const projectChartData = stats.projects_detail.map(p => ({
    label: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    value: p.total_objects,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-[#00A3FF] text-xl font-semibold">Dashboard</h2>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Phase Progress + Project Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phase Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Progreso por Fase</h3>
          <div className="space-y-4">
            {phaseOrder.map((key) => {
              const phase = stats.phases[key];
              if (!phase) return null;
              const pct = phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{phase.label}</span>
                    <span className="text-gray-500">{phase.completed}/{phase.total} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-[#0A3977] h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Objetos por Proyecto</h3>
          {projectChartData.length > 0 ? (
            <BarChart data={projectChartData} />
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Sin proyectos</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h3>
        {stats.recent_activity.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_activity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">{activity.project_name}</span>
                    <span className="text-gray-500"> - {activity.object_name}: </span>
                    <span className="text-gray-600">{activity.action}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">Sin actividad reciente</p>
        )}
      </div>
    </div>
  );
};
