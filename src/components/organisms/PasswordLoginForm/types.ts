import { ResponseUserDto } from '@/services/User/types';

export interface PasswordLoginFormProps {
  onSuccess: (token: string, user: ResponseUserDto) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  className?: string;
}

export interface PasswordLoginFormData {
  email: string;
  password: string;
}

export interface PasswordLoginResponse {
  success: boolean;
  token?: string;
  user?: ResponseUserDto;
  error?: string;
}

export interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}