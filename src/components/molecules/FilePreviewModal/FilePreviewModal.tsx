'use client';

import { Dialog } from '@headlessui/react';
import { Button } from '@/components/atoms/Button';

interface FilePreviewModalProps {
  /** Archivo a mostrar. `null` mantiene el modal cerrado. */
  file: { name: string; content: string } | null;
  onClose: () => void;
}

/**
 * Visor de contenido de archivo generado (conf / job / schema).
 *
 * Reemplaza el bloque `fixed inset-0` + `stopPropagation` que estaba
 * duplicado en los tres paneles generadores y en SchemaUploadSection.
 * Usa Dialog de headlessui, que aporta focus trap, cierre con Escape,
 * restauracion del foco al disparador y semantica aria-modal.
 */
export const FilePreviewModal = ({ file, onClose }: FilePreviewModalProps) => (
  <Dialog open={file !== null} onClose={onClose} className="relative z-50">
    <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col border-2 border-gray-300 ring-1 ring-black/5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <Dialog.Title className="font-medium text-gray-900 truncate">
            {file?.name}
          </Dialog.Title>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
        <pre className="flex-1 overflow-auto p-4 bg-white text-sm font-mono whitespace-pre-wrap">
          {file?.content}
        </pre>
      </Dialog.Panel>
    </div>
  </Dialog>
);
