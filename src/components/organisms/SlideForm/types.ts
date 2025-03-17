export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  defaultValue?: string | boolean | number;
  required?: boolean;
  pattern?: string;
  errorMessage?: string;
  min?: string;
  inputMode?: 'numeric' | 'text' | 'tel' | 'email' | 'url';
  helperText?: string;
}

export interface SlideFormProps<T> {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  title: string;
  fields: FormFieldConfig[];
  initialData?: T;
  service: {
    createData: (data: T) => Promise<unknown>;
    updateData: (data: T) => Promise<unknown>;
  };
  docId?: string;
  mode?: 'create' | 'edit';
  onFormChange?: (data: T) => void;
} 