import { ResponseUserDto } from '@/services/User/types';

export interface AddPasswordToUserFormProps {
  onSuccess: (user: ResponseUserDto) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  className?: string;
}

export interface AddPasswordToUserFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AddPasswordToUserResponse {
  success: boolean;
  user?: ResponseUserDto;
  authMethods?: {
    hasGoogleAuth: boolean;
    hasPasswordAuth: boolean;
    userId: string;
  };
  error?: string;
}

export interface AddPasswordFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export interface UserSearchResult {
  found: boolean;
  user?: ResponseUserDto;
  hasPassword?: boolean;
  error?: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}