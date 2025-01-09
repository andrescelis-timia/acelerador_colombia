import { StatMetricCardProps } from './types';

export const StatMetricCard = ({ title, value, description, icon, color }: StatMetricCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            {description && <p className="ml-2 text-sm text-gray-500">{description}</p>}
          </div>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}; 