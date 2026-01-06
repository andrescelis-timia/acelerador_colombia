'use client';

import { PipelineStatusIndicatorProps, PipelineStageStatus } from './types';

const STAGES = [
  { key: 'gobierno', label: 'Gobierno', description: 'Diccionarios' },
  { key: 'kirby', label: 'Kirby', description: 'Ingesta' },
  { key: 'hammurabi', label: 'Hammurabi', description: 'Calidad' },
  { key: 'smartcleaner', label: 'SmartCleaner', description: 'Limpieza' },
  { key: 'controlm', label: 'Control-M', description: 'Orquestación' }
] as const;

const STATUS_COLORS: Record<PipelineStageStatus, string> = {
  pending: 'bg-gray-300',
  in_progress: 'bg-yellow-400',
  completed: 'bg-green-500',
  error: 'bg-red-500'
};

const STATUS_LABELS: Record<PipelineStageStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completado',
  error: 'Error'
};

export const PipelineStatusIndicator = ({
  status,
  onClick,
  size = 'sm'
}: PipelineStatusIndicatorProps) => {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const gapClass = size === 'sm' ? 'gap-1' : 'gap-1.5';

  return (
    <div
      className={`flex items-center ${gapClass} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {STAGES.map((stage) => {
        const stageStatus = status[stage.key];
        const colorClass = STATUS_COLORS[stageStatus.status];
        const statusLabel = STATUS_LABELS[stageStatus.status];

        return (
          <div
            key={stage.key}
            className={`${sizeClasses} rounded-full ${colorClass} transition-colors`}
            title={`${stage.label} (${stage.description}): ${statusLabel}`}
          />
        );
      })}
    </div>
  );
};
