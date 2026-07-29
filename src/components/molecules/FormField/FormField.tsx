import { useId } from 'react';
import { FormFieldProps } from './types';

export const FormField = ({
  name,
  label,
  type,
  placeholder,
  value,
  onChange,
  options,
  rows,
  required,
  pattern,
  errorMessage,
  min,
  inputMode,
  helperText,
  children
}: FormFieldProps) => {
  // Id estable para asociar <label htmlFor> con el control y para
  // referenciar el texto de ayuda/error desde aria-describedby.
  const generatedId = useId();
  const fieldId = name ? `field-${name}` : generatedId;
// Nota: NO se propaga `required` al control nativo a proposito. SlideForm
  // ya valida con validateForm() y su propio mensaje; el required nativo
  // dispararia antes el tooltip del navegador y taparia esa validacion.
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!onChange || !name) return;
    
    if (type === 'checkbox') {
      onChange(name, (e.target as HTMLInputElement).checked);
    } else if (inputMode === 'numeric') {
      const val = e.target.value;
      const numericValue = val.replace(/[^0-9]/g, '');
      onChange(name, numericValue === '' ? null : numericValue);
    } else {
      onChange(name, e.target.value);
    }
  };

  const inputValue = value === 0 ? '0' : value ?? '';

  // Un patrón definido que no matchea marca el campo como inválido.
  const hasPatternError = Boolean(
    errorMessage && pattern && inputValue && !new RegExp(pattern).test(inputValue as string)
  );

  const inputClasses = "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-timia-accent focus:outline-none focus:ring-1 focus:ring-timia-accent/30 transition-smooth";

  return (
    <div className="space-y-2">
      {children ? children : type === 'checkbox' ? (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center">
            <input
              id={fieldId}
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={handleChange}
              aria-describedby={helperText ? helperId : undefined}
              className="h-4 w-4 rounded border-gray-300 text-timia-accent focus:ring-timia-accent/50"
            />
            <label htmlFor={fieldId} className="ml-2 block text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-timia-accent ml-1" aria-hidden="true">*</span>}
            </label>
          </div>
          {helperText && (
            <p id={helperId} className="text-sm text-gray-500 ml-6">{helperText}</p>
          )}
        </div>
      ) : (
        <>
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-timia-accent ml-1" aria-hidden="true">*</span>}
          </label>
          {type === 'select' ? (
            <select
              id={fieldId}
              name={name}
              value={inputValue as string}
              onChange={handleChange}
              aria-describedby={helperText ? helperId : undefined}
              className={inputClasses}
            >
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              id={fieldId}
              name={name}
              rows={rows}
              value={inputValue as string}
              onChange={handleChange}
              placeholder={placeholder}
              aria-describedby={helperText ? helperId : undefined}
              className={inputClasses}
            />
          ) : (
            <div>
              <input
                id={fieldId}
                type="text"
                name={name}
                value={inputValue as string}
                onChange={handleChange}
                placeholder={placeholder}
                pattern={pattern}
                min={min}
                inputMode={inputMode}
                aria-invalid={hasPatternError || undefined}
                aria-describedby={
                  hasPatternError ? errorId : helperText ? helperId : undefined
                }
                className={inputClasses}
              />
              {hasPatternError && (
                <p id={errorId} role="alert" className="mt-1 text-sm text-danger">
                  {errorMessage}
                </p>
              )}
              {helperText && !errorMessage && (
                <p id={helperId} className="mt-1 text-sm text-gray-500">{helperText}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};