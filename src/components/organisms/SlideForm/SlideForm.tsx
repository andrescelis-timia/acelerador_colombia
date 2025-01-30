import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FormField } from '@/components/molecules/FormField';
import { Button } from '@/components/atoms/Button';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { SlideFormProps } from './types';

export const SlideForm = <T extends Record<string, unknown>>({ 
  isOpen, 
  onClose, 
  title, 
  fields, 
  initialData, 
  service, 
  docId, 
  mode = 'create' 
}: SlideFormProps<T>) => {
  const [formData, setFormData] = useState<T>(initialData as T);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialData as T);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (mode === 'edit' && docId) {
        await service.updateData(formData);
      } else {
        await service.createData(formData);
      }
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al procesar el formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: string | boolean | number | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        className="fixed inset-0 overflow-y-auto"
      >
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className="flex-1">
                    <div className="bg-[#0A3977] px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-white">
                          {title}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-[#0A3977] text-white hover:text-gray-300"
                            onClick={onClose}
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 divide-y divide-gray-200 px-4 py-6 sm:px-6">
                      <div className="space-y-6 pb-5">
                        {fields.map((field) => (
                          <FormField
                            key={field.name}
                            {...field}
                            value={
                              (formData as Record<string, unknown>)[field.name] === 0 
                                ? '0' 
                                : String((formData as Record<string, unknown>)[field.name] || '')
                            }
                            onChange={(name, value) => handleChange(name, value)}
                          />
                        ))}
                      </div>

                      <div className="flex justify-end pt-5">
                        <Button
                          type="submit"
                          disabled={loading}
                          variant="primary"
                        >
                          {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </div>
      </Dialog>
      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}; 