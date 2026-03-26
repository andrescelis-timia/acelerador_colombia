'use client';

import { useState } from 'react';
import { BarChartProps } from './types';

const BAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600',
  'from-violet-500 to-violet-600',
  'from-purple-500 to-purple-600',
  'from-cyan-500 to-cyan-600',
  'from-teal-500 to-teal-600',
  'from-sky-500 to-sky-600',
  'from-blue-400 to-blue-500',
];

export const BarChart = ({ data }: BarChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map(item => item.value), 1);
  const gridLines = 4;

  return (
    <div className="w-full h-64">
      <div className="relative h-full flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-xs text-gray-400 pr-3 py-1 w-8">
          {[...Array(gridLines + 1)].map((_, i) => (
            <span key={i} className="text-right">
              {Math.round(maxValue * (gridLines - i) / gridLines)}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {[...Array(gridLines + 1)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full border-t border-gray-100"
                style={{ top: `${(i / gridLines) * 100}%` }}
              />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end gap-1 px-1 pb-6">
            {data.map((item, index) => {
              const height = (item.value / maxValue) * 100;
              const colorClass = BAR_COLORS[index % BAR_COLORS.length];
              const isHovered = hoveredIndex === index;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center justify-end relative group"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
                      {item.value}
                    </div>
                  )}
                  {/* Bar */}
                  <div
                    className={`w-full max-w-[40px] bg-gradient-to-t ${colorClass} rounded-t-md transition-all duration-300 ${isHovered ? 'opacity-90 scale-x-110' : 'opacity-80'}`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 inset-x-0 flex gap-1 px-1">
            {data.map((item, index) => (
              <div key={index} className="flex-1 text-center">
                <span className="text-[10px] text-gray-500 leading-tight block truncate">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
