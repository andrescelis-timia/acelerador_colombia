'use client';

import { useState } from 'react';
import { BarChartProps } from './types';

export const BarChart = ({ data }: BarChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map(item => item.value), 1);

  return (
    <div className="w-full">
      <div className="space-y-3">
        {data.map((item, index) => {
          const pct = (item.value / maxValue) * 100;
          const isHovered = hoveredIndex === index;
          return (
            <div
              key={index}
              className="group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 truncate max-w-[60%]">{item.label}</span>
                <span className={`text-xs font-semibold transition-colors ${isHovered ? 'text-[#0A3977]' : 'text-gray-500'}`}>
                  {item.value}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${isHovered ? 'bg-[#0A3977]' : 'bg-[#0A3977]/70'}`}
                  style={{ width: `${Math.max(pct, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
