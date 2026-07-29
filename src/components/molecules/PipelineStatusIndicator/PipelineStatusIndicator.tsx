'use client';

import { PipelineStatusIndicatorProps, PipelineStageStatus } from './types';
import {
  BookOpenIcon,
  CubeIcon,
  ShieldCheckIcon,
  TrashIcon,
  Cog6ToothIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const STAGES = [
  { key: 'gobierno', label: 'Gobierno', description: 'Diccionarios', Icon: BookOpenIcon },
  { key: 'kirby', label: 'Kirby', description: 'Ingesta', Icon: CubeIcon },
  { key: 'hammurabi', label: 'Hammurabi', description: 'Calidad', Icon: ShieldCheckIcon },
  { key: 'smartcleaner', label: 'SmartCleaner', description: 'Limpieza', Icon: TrashIcon },
  { key: 'controlm', label: 'Control-M', description: 'Orquestación', Icon: Cog6ToothIcon }
] as const;

const STATUS_STYLES: Record<PipelineStageStatus, { bg: string; border: string; icon: string; line: string }> = {
  pending: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    icon: 'text-gray-400',
    line: 'bg-gray-300'
  },
  in_progress: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    icon: 'text-yellow-500',
    line: 'bg-yellow-400'
  },
  completed: {
    bg: 'bg-success-subtle',
    border: 'border-green-500',
    icon: 'text-success',
    line: 'bg-green-500'
  },
  error: {
    bg: 'bg-danger-subtle',
    border: 'border-red-500',
    icon: 'text-danger-icon',
    line: 'bg-red-500'
  }
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
  const circleSize = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const lineWidth = size === 'sm' ? 'w-3' : 'w-4';
  const lineHeight = size === 'sm' ? 'h-0.5' : 'h-1';

  return (
    <div
      className={`flex items-center ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
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
      {STAGES.map((stage, index) => {
        const stageStatus = status[stage.key];
        const styles = STATUS_STYLES[stageStatus.status];
        const statusLabel = STATUS_LABELS[stageStatus.status];
        const StageIcon = stage.Icon;
        const isLast = index === STAGES.length - 1;

        // Determinar el color de la línea basado en si el paso actual está completado
        const lineColor = stageStatus.status === 'completed' ? styles.line : 'bg-gray-300';

        return (
          <div key={stage.key} className="flex items-center">
            {/* Círculo del paso */}
            <div
              className={`
                ${circleSize} rounded-full border-2 flex items-center justify-center relative
                ${styles.bg} ${styles.border}
                transition-all duration-200
              `}
              title={`${stage.label} (${stage.description}): ${statusLabel}`}
            >
              {/* Icono de estado superpuesto o icono de la etapa */}
              {stageStatus.status === 'completed' ? (
                <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center">
                  <CheckIcon className={`${iconSize} text-white`} />
                </div>
              ) : stageStatus.status === 'error' ? (
                <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center">
                  <ExclamationTriangleIcon className={`${iconSize} text-white`} />
                </div>
              ) : stageStatus.status === 'in_progress' ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <ArrowPathIcon className={`${iconSize} ${styles.icon} animate-spin`} />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                </div>
              ) : (
                <StageIcon className={`${iconSize} ${styles.icon}`} />
              )}
            </div>

            {/* Línea conectora */}
            {!isLast && (
              <div className={`${lineWidth} ${lineHeight} ${lineColor} transition-colors duration-200`} />
            )}
          </div>
        );
      })}
    </div>
  );
};