'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  CreateUserWithPasswordFormProps,
  CreateUserWithPasswordFormData,
  CreateUserFormErrors,

  PasswordStrength
} from './types';

export const CreateUserWithPasswordForm: React.FC<CreateUserWithPasswordFormProps> = ({
  onSuccess,
  onError,
  isLoading = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateUserWithPasswordFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    country: 'CO',
    role: 'DEVELOPER',
    authMethod: 'google'
  });
  const [errors, setErrors] = useState<CreateUserFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email validation
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

  // Password strength validation
  const validatePasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Debe tener al menos 8 caracteres');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Debe incluir al menos una letra minúscula');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Debe incluir al menos una letra mayúscula');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Debe incluir al menos un número');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Debe incluir al menos un carácter especial');
    } else {
      score += 1;
    }

    return {
      score,
      feedback,
      isValid: score >= 4 && password.length >= 8
    };
  };

  // Password validation
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'La contraseña es requerida';
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return strength.feedback[0] || 'La contraseña no cumple con los requisitos mínimos';
    }

    return undefined;
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) {
      return 'La confirmación de contraseña es requerida';
    }
    if (confirmPassword !== password) {
      return 'Las contraseñas no coinciden';
    }
    return undefined;
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: CreateUserFormErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    if (!formData.country) {
      newErrors.country = 'El país es requerido';
    }

    if (!formData.role) {
      newErrors.role = 'El rol es requerido';
    }

    if (!formData.authMethod) {
      newErrors.authMethod = 'El método de autenticación es requerido';
    }

    // Only validate password if auth method is password
    if (formData.authMethod === 'password') {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;

      const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof CreateUserWithPasswordFormData, value: string) => {
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


      // Get user info from auth context
      let userEmail = '';
      let userCountry = '';



      if (user?.email) {
        // Google OAuth user
        userEmail = user.email;
        // Get country from localStorage or default to CO
        userCountry = localStorage.getItem('selectedCountry') || 'CO';

      } else {

        throw new Error('No se encontró usuario autenticado. Por favor, inicia sesión nuevamente.');
      }



      // Make API call to create user
      const endpoint = formData.authMethod === 'password' 
        ? '/admin/users/create-with-password'
        : '/admin/users/create-google-only';
      
      const requestBody = formData.authMethod === 'password'
        ? {
            email: formData.email,
            password: formData.password,
            country: formData.country,
            role: formData.role
          }
        : {
            email: formData.email,
            country: formData.country,
            role: formData.role
          };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User': userEmail,
          'X-Country': userCountry
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok && result.success && result.user) {
        onSuccess(result.user);
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          country: 'CO',
          role: 'DEVELOPER',
          authMethod: 'password'
        });
      } else {
        const errorMessage = result.error || 'Error al crear el usuario';
        setErrors({ general: errorMessage });
        onError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el usuario';
      setErrors({ general: errorMessage });
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;
  const passwordStrength = formData.password ? validatePasswordStrength(formData.password) : null;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label
              htmlFor="create-user-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="create-user-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={isFormDisabled}
              className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A3977] focus:border-[#0A3977] disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${errors.email
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300'
                }`}
              placeholder="usuario@empresa.com"
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Auth Method Field */}
          <div>
            <label
              htmlFor="create-user-auth-method"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Método de Autenticación <span className="text-red-500">*</span>
            </label>
            <select
              id="create-user-auth-method"
              value={formData.authMethod}
              onChange={(e) => {
                handleInputChange('authMethod', e.target.value as 'google' | 'password');
                // Clear password fields when switching to Google
                if (e.target.value === 'google') {
                  handleInputChange('password', '');
                  handleInputChange('confirmPassword', '');
                }
              }}
              required
              disabled={isFormDisabled}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A3977] focus:border-[#0A3977] disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${errors.authMethod
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300'
                }`}
              aria-describedby={errors.authMethod ? 'auth-method-error' : undefined}
              aria-invalid={!!errors.authMethod}
            >
              <option value="password">User/password</option>
              <option value="google">Google</option>
            </select>
            {errors.authMethod && (
              <p id="auth-method-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.authMethod}
              </p>
            )}
          </div>

          {/* Country Field */}
          <div>
            <label
              htmlFor="create-user-country"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              País <span className="text-red-500">*</span>
            </label>
            <select
              id="create-user-country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value as 'CO' | 'PE')}
              required
              disabled={isFormDisabled}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A3977] focus:border-[#0A3977] disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${errors.country
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300'
                }`}
              aria-describedby={errors.country ? 'country-error' : undefined}
              aria-invalid={!!errors.country}
            >
              <option value="CO">Colombia</option>
              <option value="PE">Perú</option>
            </select>
            {errors.country && (
              <p id="country-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.country}
              </p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label
              htmlFor="create-user-role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              id="create-user-role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as 'ADMIN' | 'USER')}
              required
              disabled={isFormDisabled}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A3977] focus:border-[#0A3977] disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${errors.role
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300'
                }`}
              aria-describedby={errors.role ? 'role-error' : undefined}
              aria-invalid={!!errors.role}
            >
              <option value="DEVELOPER">Developer</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Administrador</option>
            </select>
            {errors.role && (
              <p id="role-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.role}
              </p>
            )}
          </div>

          {/* Password Field - Only show if auth method is password */}
          {formData.authMethod === 'password' && (
          <div>
            <label
              htmlFor="create-user-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="create-user-password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={isFormDisabled}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A3977] focus:border-[#0A3977] disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${errors.password
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
                  }`}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
                aria-describedby={errors.password ? 'password-error' : 'password-help'}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isFormDisabled}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.score <= 1 ? 'bg-red-500 w-1/4' :
                        passwordStrength.score === 2 ? 'bg-yellow-500 w-2/4' :
                          passwordStrength.score === 3 ? 'bg-blue-500 w-3/4' :
                            'bg-green-500 w-full'
                        }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${passwordStrength.score <= 1 ? 'text-red-600' :
                    passwordStrength.score === 2 ? 'text-yellow-600' :
                      passwordStrength.score === 3 ? 'text-blue-600' :
                        'text-green-600'
                    }`}>
                    {passwordStrength.score <= 1 ? 'Débil' :
                      passwordStrength.score === 2 ? 'Regular' :
                        passwordStrength.score === 3 ? 'Buena' :
                          'Fuerte'}
                  </span>
                </div>
                {!passwordStrength.isValid && passwordStrength.feedback.length > 0 && (
                  <ul className="mt-1 text-xs text-gray-600 space-y-1">
                    {passwordStrength.feedback.map((feedback, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-red-400 mr-1">•</span>
                        {feedback}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {errors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.password}
              </p>
            )}
          </div>
          )}

          {/* Confirm Password Field - Only show if auth method is password */}
          {formData.authMethod === 'password' && (
          <div>
            <label
              htmlFor="create-user-confirm-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirmar Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="create-user-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                disabled={isFormDisabled}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A3977] focus:border-[#0A3977] disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${errors.confirmPassword
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
                  }`}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isFormDisabled}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirm-password-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>
          )}

          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {errors.general}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isFormDisabled || !formData.email || (formData.authMethod === 'password' && (!formData.password || !formData.confirmPassword))}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0A3977] hover:bg-[#082f5f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3977] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" aria-hidden="true"></div>
                <span>Creando usuario...</span>
              </>
            ) : (
              'Crear Usuario'
            )}
          </button>
        </form>


      </div>
    </div>
  );
};