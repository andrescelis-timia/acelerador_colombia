import { EyeIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { PopupLinksProps } from './types';

export const PopupLinks = ({ isOpen, onClose, links, title }: PopupLinksProps) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium mb-4">{title}</Dialog.Title>
          
          <div className="space-y-3">
            {links.map((link, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{link.label}</span>
                <button
                  onClick={() => link.url && window.open(link.url, '_blank')}
                  disabled={!link.url}
                  className={`p-2 rounded-full transition-colors ${
                    link.url 
                      ? 'text-blue-600 hover:text-blue-800' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 