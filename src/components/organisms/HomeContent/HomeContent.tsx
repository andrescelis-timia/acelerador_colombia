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
  const diff = Date.now() - new Date(timestamp + 'Z').getTime();
  if (diff < 0) return 'hace <1h';
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'hace <1h';
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
};

const PHASE_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  gobierno:     { bar: 'from-rose-500 to-rose-600',      bg: 'bg-rose-50',    text: 'text-rose-600' },
  kirby:        { bar: 'from-indigo-500 to-indigo-600',   bg: 'bg-indigo-50',  text: 'text-indigo-600' },
  hammurabi:    { bar: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  smartcleaner: { bar: 'from-amber-500 to-amber-600',    bg: 'bg-warning-subtle',   text: 'text-warning' },
  controlm:     { bar: 'from-violet-500 to-violet-600',  bg: 'bg-violet-50',  text: 'text-violet-600' },
};

const PHASE_ICONS: Record<string, typeof BookOpenIcon> = {
  gobierno: BookOpenIcon,
  kirby: CubeTransparentIcon,
  hammurabi: ShieldCheckIcon,
  smartcleaner: TrashIcon,
  controlm: Cog6ToothIcon,
};

const ACTION_ICONS: Record<string, { icon: typeof BookOpenIcon; color: string }> = {
  'gobierno': { icon: BookOpenIcon, color: 'text-rose-500 bg-rose-50' },
  'kirby': { icon: CubeTransparentIcon, color: 'text-indigo-500 bg-indigo-50' },
  'hammurabi': { icon: ShieldCheckIcon, color: 'text-emerald-500 bg-emerald-50' },
  'smartcleaner': { icon: TrashIcon, color: 'text-warning-icon bg-warning-subtle' },
  'controlm': { icon: Cog6ToothIcon, color: 'text-violet-500 bg-violet-50' },
};

export const HomeContent = ({ stats, loading }: HomeContentProps) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-gray-900 text-xl font-semibold">Dashboard</h2>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-timia-accent mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Cargando metricas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h2 className="text-gray-900 text-xl font-semibold">Dashboard</h2>
        <div className="text-center py-20 text-gray-500">No se pudieron cargar las metricas</div>
      </div>
    );
  }

  const metricCards = [
    { title: 'Total Proyectos', value: stats.projects.total, icon: FolderIcon, gradient: 'from-[#9D012A] to-[#D4023A]' },
    { title: 'Total Objetos', value: stats.objects.total, icon: CubeIcon, gradient: 'from-indigo-500 to-indigo-700' },
    { title: 'Campos Procesados', value: stats.total_fields, icon: CheckCircleIcon, gradient: 'from-teal-500 to-teal-700' },
    { title: 'Objetos En Curso', value: stats.objects.by_status.in_progress, icon: ArrowPathIcon, gradient: 'from-amber-500 to-amber-600' },
    { title: 'Objetos Completados', value: stats.objects.by_status.completed, icon: CheckCircleIcon, gradient: 'from-emerald-500 to-emerald-700' },
  ];

  const phaseOrder = ['gobierno', 'kirby', 'hammurabi', 'smartcleaner', 'controlm'];

  const objectsByMonthTotal = (stats.objects_by_month ?? []).reduce((acc, m) => acc + m.value, 0);

  const projectChartData = stats.projects_detail.map(p => ({
    label: p.name.length > 100 ? p.name.substring(0, 100) + '...' : p.name,
    value: p.total_objects,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-gray-900 text-xl font-semibold">Dashboard</h2>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((card) => (
          <div key={card.title} className={`bg-gradient-to-br ${card.gradient} rounded-xl shadow-md p-5 text-white relative overflow-hidden group hover:shadow-lg transition-smooth`}>
            <div className="absolute -right-3 -top-3 opacity-10 group-hover:opacity-15 transition-smooth">
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
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Progreso por Fase</h3>
          <div className="space-y-4">
            {phaseOrder.map((key) => {
              const phase = stats.phases[key];
              if (!phase) return null;
              const pct = phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0;
              const colors = PHASE_COLORS[key];
              const PhaseIcon = PHASE_ICONS[key];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${colors.bg}`}>
                        <PhaseIcon className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{phase.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{phase.completed}/{phase.total}</span>
                      <span className="text-sm font-bold text-gray-900">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${colors.bar} h-2.5 rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Objects by Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Objetos por Estado</h3>
          {(() => {
            const total = stats.objects.total || 1;
            const statusItems = [
              { label: 'Completados', value: stats.objects.by_status.completed, bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
              { label: 'En curso', value: stats.objects.by_status.in_progress, bar: 'bg-amber-500', bg: 'bg-warning-subtle', text: 'text-warning' },
              { label: 'Pendientes', value: stats.objects.by_status.pending, bar: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' },
            ];
            return (
              <div className="space-y-4">
                {/* Stacked bar */}
                <div className="w-full bg-gray-100 rounded-full h-4 flex overflow-hidden">
                  {statusItems.map((item) => {
                    const pct = (item.value / total) * 100;
                    return pct > 0 ? (
                      <div key={item.label} className={`${item.bar} h-4 transition-all duration-700`} style={{ width: `${pct}%` }} />
                    ) : null;
                  })}
                </div>
                {/* Legend items */}
                <div className="space-y-3 mt-4">
                  {statusItems.map((item) => {
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={item.label} className={`flex items-center justify-between ${item.bg} rounded-lg px-4 py-2.5`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.bar}`}></div>
                          <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${item.text}`}>{item.value}</span>
                          <span className="text-xs text-gray-400">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Objects by Month + Project Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Objetos Creados por Mes</h3>
          <p className="text-xs text-gray-500 mb-4">Últimos 12 meses</p>
          {/* El backend rellena los meses sin objetos con 0, asi que la lista
              nunca viene vacia: el estado vacio se decide por la suma. */}
          {objectsByMonthTotal > 0 ? (
            <BarChart data={stats.objects_by_month} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Objetos por Proyecto</h3>
          {projectChartData.length > 0 ? (
            <BarChart data={projectChartData} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin proyectos</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Actividad Reciente</h3>
        {stats.recent_activity.length > 0 ? (
          <div className="space-y-0">
            {stats.recent_activity.map((activity, i) => {
              const genType = Object.keys(ACTION_ICONS).find(k => activity.action.toLowerCase().includes(k)) || 'gobierno';
              const iconInfo = ACTION_ICONS[genType];
              const ActivityIcon = iconInfo.icon;
              return (
                <div key={i} className="flex items-center gap-2.5 py-2.5 text-sm hover:bg-gray-50/50 rounded-lg px-2 -mx-2 transition-smooth">
                  <ActivityIcon className={`h-4 w-4 flex-shrink-0 ${iconInfo.color.split(' ')[0]}`} />
                  <span className="text-gray-400 text-xs w-14 flex-shrink-0">{formatTimeAgo(activity.timestamp)}</span>
                  <span className="font-medium text-gray-800 truncate">{activity.project_name}</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-500 truncate">{activity.object_name}</span>
                  <span className="text-gray-400 text-xs ml-auto flex-shrink-0">{activity.action}</span>
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
