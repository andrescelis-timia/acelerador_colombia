import { HomeContentProps } from './types';
import {
  FolderIcon,
  CubeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CubeTransparentIcon,
  ShieldCheckIcon,
  TrashIcon,
  Cog6ToothIcon,
  BookOpenIcon,
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

const PHASE_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  gobierno:     { bar: 'from-blue-500 to-blue-600',    bg: 'bg-blue-50',    text: 'text-blue-600' },
  kirby:        { bar: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  hammurabi:    { bar: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  smartcleaner: { bar: 'from-amber-500 to-amber-600',  bg: 'bg-amber-50',  text: 'text-amber-600' },
  controlm:     { bar: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-600' },
};

const PHASE_ICONS: Record<string, typeof BookOpenIcon> = {
  gobierno: BookOpenIcon,
  kirby: CubeTransparentIcon,
  hammurabi: ShieldCheckIcon,
  smartcleaner: TrashIcon,
  controlm: Cog6ToothIcon,
};

const ACTION_ICONS: Record<string, { icon: typeof BookOpenIcon; color: string }> = {
  'gobierno': { icon: BookOpenIcon, color: 'text-blue-500 bg-blue-50' },
  'kirby': { icon: CubeTransparentIcon, color: 'text-indigo-500 bg-indigo-50' },
  'hammurabi': { icon: ShieldCheckIcon, color: 'text-emerald-500 bg-emerald-50' },
  'smartcleaner': { icon: TrashIcon, color: 'text-amber-500 bg-amber-50' },
  'controlm': { icon: Cog6ToothIcon, color: 'text-violet-500 bg-violet-50' },
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
    { title: 'Total Proyectos', value: stats.projects.total, icon: FolderIcon, gradient: 'from-blue-500 to-blue-700' },
    { title: 'Total Objetos', value: stats.objects.total, icon: CubeIcon, gradient: 'from-indigo-500 to-indigo-700' },
    { title: 'Objetos En Curso', value: stats.objects.by_status.in_progress, icon: ArrowPathIcon, gradient: 'from-amber-500 to-amber-600' },
    { title: 'Objetos Completados', value: stats.objects.by_status.completed, icon: CheckCircleIcon, gradient: 'from-emerald-500 to-emerald-700' },
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
          <div key={card.title} className={`bg-gradient-to-br ${card.gradient} rounded-xl shadow-md p-5 text-white relative overflow-hidden`}>
            <div className="absolute -right-3 -top-3 opacity-10">
              <card.icon className="h-20 w-20" />
            </div>
            <div className="relative">
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-sm opacity-90 mt-1">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Phase Progress + Objects by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phase Progress */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Progreso por Fase</h3>
          <div className="space-y-5">
            {phaseOrder.map((key) => {
              const phase = stats.phases[key];
              if (!phase) return null;
              const pct = phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0;
              const colors = PHASE_COLORS[key];
              const PhaseIcon = PHASE_ICONS[key];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${colors.bg}`}>
                        <PhaseIcon className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{phase.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${colors.bar} h-2.5 rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{phase.completed} de {phase.total} objetos</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Objects by Status (donut) */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Objetos por Estado</h3>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm">
                {(() => {
                  const total = stats.objects.total || 1;
                  const segments = [
                    { value: stats.objects.by_status.completed, color: '#10B981' },
                    { value: stats.objects.by_status.in_progress, color: '#F59E0B' },
                    { value: stats.objects.by_status.pending, color: '#E5E7EB' },
                  ];
                  let offset = 0;
                  return segments.map((seg, i) => {
                    const pct = (seg.value / total) * 100;
                    const dash = `${pct} ${100 - pct}`;
                    const el = (
                      <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={seg.color}
                        strokeWidth="4" strokeDasharray={dash} strokeDashoffset={-offset}
                        strokeLinecap="round" transform="rotate(-90 18 18)"
                        className="transition-all duration-700" />
                    );
                    offset += pct;
                    return el;
                  });
                })()}
                <circle cx="18" cy="18" r="10" fill="white" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{stats.objects.total}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">objetos</span>
              </div>
            </div>
            <div className="ml-8 space-y-3">
              {[
                { label: 'Completados', value: stats.objects.by_status.completed, color: 'bg-emerald-500' },
                { label: 'En curso', value: stats.objects.by_status.in_progress, color: 'bg-amber-500' },
                { label: 'Pendientes', value: stats.objects.by_status.pending, color: 'bg-gray-200' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">{item.value}</span>
                    <span className="text-xs text-gray-400 ml-1">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Objects by Month + Project Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Objetos Creados por Mes</h3>
          {stats.objects_by_month && stats.objects_by_month.length > 0 ? (
            <BarChart data={stats.objects_by_month} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Objetos por Proyecto</h3>
          {projectChartData.length > 0 ? (
            <BarChart data={projectChartData} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin proyectos</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
        {stats.recent_activity.length > 0 ? (
          <div className="space-y-1">
            {stats.recent_activity.map((activity, i) => {
              const genType = Object.keys(ACTION_ICONS).find(k => activity.action.toLowerCase().includes(k)) || 'gobierno';
              const iconInfo = ACTION_ICONS[genType];
              const ActivityIcon = iconInfo.icon;
              return (
                <div key={i} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconInfo.color}`}>
                      <ActivityIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">{activity.project_name}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-gray-600">{activity.object_name}</span>
                      </p>
                      <p className="text-xs text-gray-400">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4 bg-gray-50 px-2 py-1 rounded">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">Sin actividad reciente</p>
        )}
      </div>
    </div>
  );
};
