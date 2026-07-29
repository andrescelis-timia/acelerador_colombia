'use client';

import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { RcnEntry } from '@/services/Rcn/types';

interface Props {
  entry: RcnEntry | null;
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-[160px_1fr] gap-3 py-2 border-b border-gray-100">
    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900 break-words">{value || <span className="text-gray-400">—</span>}</dd>
  </div>
);

export const RcnDetailModal = ({ entry, onClose }: Props) => {
  // Dialog de headlessui aporta focus trap, cierre con Escape, restauracion
  // del foco al disparador, aria-modal y bloqueo de scroll del body.
  return (
    <Dialog open={entry !== null} onClose={onClose} className="relative z-[9999]">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-6">
        <Dialog.Panel className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          {entry && (
            <>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Campo RCN · ID {entry.id}</p>
            <Dialog.Title className="text-lg font-semibold text-gray-900 font-mono mt-0.5">
              {entry.physical_name_field}
            </Dialog.Title>
          </div>
          <button onClick={onClose} aria-label="Cerrar detalle" className="p-1 rounded-md hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <dl className="px-6 py-4">
          <Row label="Logical (SP)" value={entry.logical_name_sp} />
          <Row label="Logical (EN)" value={entry.logical_name_eng} />
          <Row label="Descripción (SP)" value={entry.field_description_sp} />
          <Row label="Descripción (EN)" value={entry.field_description_eng} />
          <Row label="Jerarquía" value={entry.hierarchy} />
          <Row label="Security class" value={entry.security_class} />
          <Row label="Security label" value={entry.security_label} />
          <Row label="Security status" value={entry.security_status} />
          <Row label="Registro" value={entry.date_of_registration} />
          <Row label="Última modif." value={entry.date_of_last_modification} />
          {entry.similarity !== undefined && (
            <Row label="Similarity" value={entry.similarity.toFixed(4)} />
          )}
          {entry.combined_score !== undefined && (
            <Row label="Combined score" value={entry.combined_score.toFixed(4)} />
          )}
          {entry.keyword_recall !== undefined && (
            <Row label="Keyword recall" value={entry.keyword_recall.toFixed(2)} />
          )}
          {entry.keyword_precision !== undefined && (
            <Row label="Keyword precision" value={entry.keyword_precision.toFixed(2)} />
          )}
        </dl>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
