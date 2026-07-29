'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { PasswordLoginFormProps, PasswordLoginFormData, FormErrors } from './types';
import { ResponseUserDto } from '@/services/User/types';

export const PasswordLoginForm: React.FC<PasswordLoginFormProps> = ({
  onSuccess,
  onError,
  isLoading = false,
  className = ''
}) => {
  const { loginWithPassword } = useAuth();
  const [formData, setFormData] = useState<PasswordLoginFormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return 'El email es requerido';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Por favor ingresa un email válido';
    }
    return undefined;
  };

  // Basic password validation
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'La contraseña es requerida';
    }
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    return undefined;
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof PasswordLoginFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {


      // Use AuthContext loginWithPassword for proper session management
      const result = await loginWithPassword(formData.email, formData.password);

      if (result.success) {

        // AuthContext has already set up the session, just call onSuccess
        onSuccess('', {
          email: formData.email,
          country: 'CO', // This will be overridden by AuthContext
          role: 'DATA_ENGINEER' // This will be overridden by AuthContext
        } as ResponseUserDto);
      } else {
        const errorMessage = result.error || 'Error al iniciar sesión';
        setErrors({ general: errorMessage });
        onError(errorMessage);
      }
    } catch (error) {
      console.error('Password login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión al servidor';
      setErrors({ general: errorMessage });
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label
            htmlFor="password-login-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email <span className="text-danger-icon">*</span>
          </label>
          <input
            id="password-login-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            disabled={isFormDisabled}
            className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-timia-accent focus:border-timia-accent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${errors.email
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
              }`}
            placeholder="tu@email.com"
            autoComplete="email"
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-danger" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password-login-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Contraseña <span className="text-danger-icon">*</span>
          </label>
          <input
            id="password-login-password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
            disabled={isFormDisabled}
            className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-timia-accent focus:border-timia-accent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${errors.password
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
              }`}
            placeholder="••••••••"
            autoComplete="current-password"
            minLength={8}
            aria-describedby={errors.password ? 'password-error' : 'password-help'}
            aria-invalid={!!errors.password}
          />
          {errors.password ? (
            <p id="password-error" className="mt-1 text-sm text-danger" role="alert">
              {errors.password}
            </p>
          ) : (
            <p id="password-help" className="mt-1 text-xs text-gray-500">
              Mínimo 8 caracteres
            </p>
          )}
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div className="bg-danger-subtle border border-danger-border rounded-md p-3" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-danger">
                  {errors.general}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isFormDisabled || !formData.email || !formData.password}
          className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-timia-accent hover:bg-timia-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-timia-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-describedby="submit-button-status"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" aria-hidden="true"></div>
              <span>Iniciando sesión...</span>
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>


    </div>
  );
};