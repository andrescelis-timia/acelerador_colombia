import { FormFieldConfig } from '@/components/organisms/SlideForm/types';

export interface FormFieldProps extends FormFieldConfig {
  value?: string | boolean | number | null;
  onChange: (name: string, value: string | boolean | number | null) => void;
} 