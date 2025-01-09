import { StatMetricCard } from '@/components/molecules/StatMetricCard';
import { MetricsOverviewProps } from './types';

export const MetricsOverview = ({ metrics, className = '' }: MetricsOverviewProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <StatMetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          description={metric.description}
          icon={metric.icon}
          color={metric.color}
        />
      ))}
    </div>
  );
}; 