import { BarChartProps } from './types';

export const BarChart = ({ data }: BarChartProps) => {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className="w-full h-80">
      <div className="relative h-full">
        {/* Grid lines */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="border-t border-gray-200" 
              style={{ bottom: `${i * 25}%` }}
            />
          ))}
        </div>

        {/* Bars */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between h-full pl-16 pr-4">
          {data.map((item, index) => {
            const height = (item.value / maxValue) * 100;
            return (
              <div key={index} className="flex flex-col items-center justify-end">
                <div 
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: '#0A3977',
                    width: '30px'
                  }}
                  className="rounded-t-sm"
                />
                <span className="mt-2 text-sm text-gray-600">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-4 h-full flex flex-col justify-between text-sm text-gray-600">
          {[...Array(5)].map((_, i) => (
            <span key={i}>
              {((maxValue * (4 - i)) / 4).toFixed(1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}; 