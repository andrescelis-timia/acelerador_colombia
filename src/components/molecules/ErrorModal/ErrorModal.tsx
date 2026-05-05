import { ErrorModalProps } from './types';
import { Dialog } from '@headlessui/react';

export const ErrorModal = ({ message, onClose }: ErrorModalProps) => {
  if (!message) return null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      className="relative z-[100]"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
      
      {/* Modal */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white shadow-dark-lg transition-all animate-slide-up">
            <div className="px-6 pb-4 pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="mt-0.5">
                  <Dialog.Title className="text-base font-semibold text-gray-900">
                    Error
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-xl">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-lg bg-timia-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-timia-accent-hover transition-smooth active:scale-[0.98]"
              >
                Cerrar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};