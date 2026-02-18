'use client';

import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  BookOpenIcon,
  CubeIcon,
  ShieldCheckIcon,
  TrashIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline';
import { PipelineStatusModalProps } from './types';
import { PipelineStageStatus } from '@/services/Object/types';

const STAGES = [
  { key: 'gobierno', label: 'Gobierno', description: 'Generación de diccionarios de datos', icon: BookOpenIcon },
  { key: 'kirby', label: 'Kirby', description: 'Configuración de ingesta de datos', icon: CubeIcon },
  { key: 'hammurabi', label: 'Hammurabi', description: 'Reglas de calidad de datos', icon: ShieldCheckIcon },
  { key: 'smartcleaner', label: 'SmartCleaner', description: 'Políticas de limpieza y retención', icon: TrashIcon },
  { key: 'controlm', label: 'Control-M', description: 'Mallas de orquestación', icon: Cog6ToothIcon }
] as const;

const STATUS_CONFIG: Record<PipelineStageStatus, {
  label: string;
  bgColor: string;
  textColor: string;
  icon: typeof CheckCircleIcon;
}> = {
  pending: {
    label: 'Pendiente',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: MinusCircleIcon
  },
  in_progress: {
    label: 'En progreso',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    icon: ClockIcon
  },
  completed: {
    label: 'Completado',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: CheckCircleIcon
  },
  error: {
    label: 'Error',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: ExclamationCircleIcon
  }
};

export const PipelineStatusModal = ({
  isOpen,
  onClose,
  objectName,
  status
}: PipelineStatusModalProps) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Estado del Pipeline
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-0.5">{objectName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-3">
            {STAGES.map((stage, index) => {
              const stageStatus = status[stage.key];
              const config = STATUS_CONFIG[stageStatus.status];
              const StageIcon = stage.icon;
              const StatusIcon = config.icon;

              return (
                <div key={stage.key}>
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    {/* Stage Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <StageIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{stage.label}</p>
                      <p className="text-sm text-gray-500 truncate">{stage.description}</p>
                      {stageStatus.message && (
                        <p className="text-xs text-gray-400 mt-1">{stageStatus.message}</p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor}`}>
                      <StatusIcon className={`h-4 w-4 ${config.textColor}`} />
                      <span className={`text-sm font-medium ${config.textColor}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Connector line */}
                  {index < STAGES.length - 1 && (
                    <div className="ml-8 h-3 border-l-2 border-gray-200" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
