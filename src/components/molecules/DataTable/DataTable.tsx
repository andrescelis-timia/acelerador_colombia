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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              {renderActions && <th key="actions" scope="col" className="relative px-6 py-3" />}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} onClick={() => onEdit?.(item.id)} className="hover:bg-gray-50 cursor-pointer">
                {columns.map((column) => (
                  <td key={`${item.id}-${column.accessor}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {column.render 
                      ? column.render(item[column.accessor])
                      : item[column.accessor]?.toString()}
                  </td>
                ))}
                {renderActions && (
                  <td key={`${item.id}-actions`} className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              Confirmar archivo
            </Dialog.Title>
            <p className="mb-6">¿Está seguro que desea archivar este elemento?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsArchiveDialogOpen(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                disabled={isArchiving}
              >
                Cancelar
              </button>
              <button
                onClick={confirmArchive}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
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