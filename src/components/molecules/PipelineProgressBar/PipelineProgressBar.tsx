'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { PipelineProgressBarProps } from './types';

export const PipelineProgressBar = ({ 
  completedGenerators = [],
  className = ''
}: PipelineProgressBarProps) => {
  const generators = [
    { id: 'kirby', name: '🔵 Kirby' },
    { id: 'hammurabi', name: '🟡 Hammurabi' },
    { id: 'smartcleaner', name: '🟣 SmartCleaner' },
    { id: 'controlm', name: '🎯 Control-M' }
  ];

  const getOverallProgress = () => {
    const totalGenerators = generators.length; // 4 generadores
    const completedCount = completedGenerators.length;
    return Math.round((completedCount / totalGenerators) * 100);
  };

  const overallProgress = getOverallProgress();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-gray-900">Progreso del Pipeline</h3>
        <span className="text-sm text-gray-600">{completedGenerators.length} de {generators.length} completados</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Generators Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {generators.map((generator) => {
          const isCompleted = completedGenerators.includes(generator.id);
          
          return (
            <div 
              key={generator.id}
              className={`
                flex items-center space-x-2 p-2 rounded border text-sm
                ${isCompleted 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-gray-50 border-gray-200 text-gray-600'
                }
              `}
            >
              <div className={`
                flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
                ${isCompleted 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
                }
              `}>
                {isCompleted && <CheckCircleIcon className="w-3 h-3 text-white" />}
              </div>
              <span className="font-medium truncate">
                {generator.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};