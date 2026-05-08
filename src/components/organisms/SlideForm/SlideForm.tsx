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
  mode = 'create',
  onFormChange
}: SlideFormProps<T>) => {
  const [formData, setFormData] = useState<T>(initialData as T);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(initialData as T);
    setValidationErrors({});
  }, [initialData]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = (formData as Record<string, unknown>)[field.name];

      if (field.required) {
        if (value === undefined || value === null || value === '') {
          errors[field.name] = `El campo ${field.label} es requerido`;
          isValid = false;
        }
      }

      if (field.pattern && typeof value === 'string' && value) {
        try {
          const regex = new RegExp(field.pattern);
          if (!regex.test(value)) {
            errors[field.name] = field.errorMessage || `El campo ${field.label} no tiene un formato válido`;
            isValid = false;
          }
        } catch (error) {
          console.error(`Error en la expresión regular para ${field.name}:`, error);
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrorMessage('Por favor complete todos los campos requeridos correctamente');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'edit' && docId) {
        await service.updateData(formData);
      } else {
        await service.createData(formData);
      }
      onClose(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al procesar el formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: string | boolean | number | null) => {
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);

    // Limpiar el error de validación cuando el campo se modifica
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    onFormChange?.(newFormData);
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={() => onClose(false)}
        className="fixed inset-0 overflow-y-auto z-50"
      >
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className="flex-1">
                    <div className="bg-timia-surface px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-white">
                          {title}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-transparent text-gray-400 hover:text-white transition-smooth"
                            onClick={() => onClose(false)}
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 divide-y divide-gray-200">
                      <div className="px-4 py-6 sm:px-6">
                        <div className="space-y-6 pb-5">
                          {fields.map((field) => (
                            <div key={field.name} className="space-y-1">
                              <FormField
                                {...field}
                                value={
                                  (formData as Record<string, unknown>)[field.name] === 0
                                    ? '0'
                                    : String((formData as Record<string, unknown>)[field.name] || '')
                                }
                                onChange={(name, value) => handleChange(name, value)}
                              />
                              {validationErrors[field.name] && (
                                <p className="text-sm text-red-600">
                                  {validationErrors[field.name]}
                                </p>
                              )}
                            </div>
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