import { FormFieldProps } from './types';

export const FormField = ({ name, label, type, placeholder, value, onChange, options, rows, required }: FormFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (type === 'checkbox') {
      onChange(name, (e.target as HTMLInputElement).checked);
    } else if ((e.target as HTMLInputElement).type === 'number') {
      const val = e.target.value;
      onChange(name, val === '' ? null : Number(val));
    } else {
      onChange(name, e.target.value);
    }
  };

  const inputValue = value === 0 ? '0' : value ?? '';

  return (
    <div>
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
      ) : type === 'checkbox' ? (
        <input
          type="checkbox"
          checked={value === 'true' || value === true}
          onChange={handleChange}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ) : (
        <input
          type="text"
          name={name}
          value={inputValue as string}
          onChange={handleChange}
          placeholder={placeholder}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      )}
    </div>
  );
}; 