import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { DataTableProps } from './types';

export const DataTable = <T extends Record<string, unknown> & { id: string }>({ 
  data, 
  columns,
  onEdit,
  onDelete,
  renderActions
}: DataTableProps<T>) => {
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const confirmArchive = async () => {
    if (itemToArchive && onDelete) {
      setIsArchiving(true);
      try {
        await onDelete(itemToArchive);
      } finally {
        setIsArchiving(false);
        setIsArchiveDialogOpen(false);
        setItemToArchive(null);
      }
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/80">
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  scope="col"
                  className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              {renderActions && <th key="actions" scope="col" className="relative px-5 py-3.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((item) => (
              <tr key={item.id} onClick={() => onEdit?.(item.id)} className="hover:bg-gray-50/50 cursor-pointer transition-smooth">
                {columns.map((column) => {
                  const rawValue = item[column.accessor];
                  const rendered = column.render
                    ? column.render(rawValue, item as Record<string, unknown>)
                    : rawValue?.toString();
                  if (column.truncate) {
                    const tooltip = typeof rawValue === 'string' ? rawValue : rawValue?.toString();
                    return (
                      <td
                        key={`${item.id}-${column.accessor}`}
                        className="px-5 py-4 text-sm text-gray-600"
                        style={{ maxWidth: column.maxWidth ?? '20rem' }}
                      >
                        <div className="truncate" title={tooltip}>{rendered}</div>
                      </td>
                    );
                  }
                  return (
                    <td key={`${item.id}-${column.accessor}`} className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                      {rendered}
                    </td>
                  );
                })}
                {renderActions && (
                  <td key={`${item.id}-actions`} className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {renderActions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-dark-lg animate-slide-up">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar archivo
            </Dialog.Title>
            <p className="mb-6 text-sm text-gray-600">¿Está seguro que desea archivar este elemento?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsArchiveDialogOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-smooth"
                disabled={isArchiving}
              >
                Cancelar
              </button>
              <button
                onClick={confirmArchive}
                className="px-4 py-2 bg-timia-accent text-white rounded-lg hover:bg-timia-accent-hover text-sm font-medium transition-smooth disabled:opacity-50"
                disabled={isArchiving}
              >
                {isArchiving ? 'Archivando...' : 'Archivar'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};