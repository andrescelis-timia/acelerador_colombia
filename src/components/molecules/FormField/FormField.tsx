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
  helperText
}: FormFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  return (
    <div className="space-y-2">
      {type === 'checkbox' ? (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 block text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
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
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {type === 'select' ? (
            <select
              value={inputValue as string}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              {errorMessage && pattern && inputValue && !(new RegExp(pattern).test(inputValue as string)) && (
                <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
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