import { ResponseUserDto } from '@/services/User/types';

export interface CreateUserWithPasswordFormProps {
  onSuccess: (user: ResponseUserDto) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  className?: string;
}

export interface CreateUserWithPasswordFormData {
  email: string;
  password: string;
  confirmPassword: string;
  country: 'CO' | 'AR' | 'HO';
  role: 'ADMIN' | 'USER';
}

export interface CreateUserWithPasswordResponse {
  success: boolean;
  user?: ResponseUserDto;
  error?: string;
}

export interface CreateUserFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  country?: string;
  role?: string;
  general?: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}