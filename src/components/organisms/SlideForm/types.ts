export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  defaultValue?: string | boolean | number;
  required?: boolean;
}

export interface SlideFormProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FormFieldConfig[];
  initialData?: T;
  service: {
    createData: (data: T) => Promise<unknown>;
    updateData: (data: T) => Promise<unknown>;
  };
  docId?: string;
  mode?: 'create' | 'edit';
} 