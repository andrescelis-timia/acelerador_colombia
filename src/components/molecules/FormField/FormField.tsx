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

  const inputClasses = "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-timia-accent focus:outline-none focus:ring-1 focus:ring-timia-accent/30 transition-smooth";

  return (
    <div className="space-y-2">
      {children ? children : type === 'checkbox' ? (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-timia-accent focus:ring-timia-accent/50"
            />
            <label className="ml-2 block text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-timia-accent ml-1">*</span>}
            </label>
          </div>
          {helperText && (
            <p className="text-sm text-gray-500 ml-6">{helperText}</p>
          )}
        </div>
      ) : (
        <>
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-timia-accent ml-1">*</span>}
          </label>
          {type === 'select' ? (
            <select
              value={inputValue as string}
              onChange={handleChange}
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
              rows={rows}
              value={inputValue as string}
              onChange={handleChange}
              placeholder={placeholder}
              className={inputClasses}
            />
          ) : (
            <div>
              <input
                type="text"
                name={name}
                value={inputValue as string}
                onChange={handleChange}
                placeholder={placeholder}
                pattern={pattern}
                min={min}
                inputMode={inputMode}
                className={inputClasses}
              />
              {errorMessage && pattern && inputValue && !(new RegExp(pattern).test(inputValue as string)) && (
                <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
              )}
              {helperText && !errorMessage && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};