'use client';

import { useState, FormEvent, useEffect } from 'react';
import { 
  AddPasswordToUserFormProps, 
  AddPasswordToUserFormData, 
  AddPasswordFormErrors,
  AddPasswordToUserResponse,
  UserSearchResult,
  PasswordStrength
} from './types';

export const AddPasswordToUserForm: React.FC<AddPasswordToUserFormProps> = ({
  onSuccess,
  onError,
  isLoading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<AddPasswordToUserFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<AddPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchResult, setUserSearchResult] = useState<UserSearchResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Search for user when email changes (debounced)
  useEffect(() => {
    if (!formData.email || !validateEmail(formData.email)) {
      setUserSearchResult(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingUser(true);
      try {
        // TODO: This will be implemented when backend endpoints are ready (Task 3.2)
        console.log('Searching user:', formData.email);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulate user search response
        const mockSearchResult: UserSearchResult = {
          found: true,
          user: {
            id_user: 'mock-user-id',
            email: formData.email,
            country: 'CO',
            role: 'USER'
          },
          hasPassword: false
        };

        setUserSearchResult(mockSearchResult);
      } catch (error) {
        setUserSearchResult({
          found: false,
          error: 'Error al buscar el usuario'
        });
      } finally {
        setIsSearchingUser(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  // Email validation
  const validateEmail = (email: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: AddPasswordFormErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Por favor ingresa un email válido';
    } else if (!userSearchResult?.found) {
      newErrors.email = 'Usuario no encontrado';
    } else if (userSearchResult.hasPassword) {
      newErrors.email = 'Este usuario ya tiene contraseña configurada';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else {
      const strength = validatePasswordStrength(formData.password);
      if (!strength.isValid) {
        newErrors.password = strength.feedback[0] || 'La contraseña no cumple con los requisitos mínimos';
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmación de contraseña es requerida';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof AddPasswordToUserFormData, value: string) => {
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
      // TODO: This will be implemented when backend endpoints are ready (Task 3.2)
      console.log('Add password to user attempt:', { 
        email: formData.email,
        userId: userSearchResult?.user?.id_user,
        password: '***'
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate response
      const mockResponse: AddPasswordToUserResponse = {
        success: false,
        error: 'La funcionalidad de agregar contraseña a usuarios existentes estará disponible cuando se complete la integración del backend (Task 3.2)'
      };

      if (mockResponse.success && mockResponse.user) {
        onSuccess(mockResponse.user);
      } else {
        const errorMessage = mockResponse.error || 'Error al agregar contraseña al usuario';
        setErrors({ general: errorMessage });
        onError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al agregar contraseña al usuario';
      setErrors({ general: errorMessage });
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;
  const passwordStrength = formData.password ? validatePasswordStrength(formData.password) : null;
  const canSubmit = userSearchResult?.found && !userSearchResult.hasPassword && formData.password && formData.confirmPassword;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Agregar Contraseña a Usuario Existente
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field with User Search */}
          <div>
            <label 
              htmlFor="add-password-email" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email del Usuario <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="add-password-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={isFormDisabled}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A3977] focus:border-[#0A3977] disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : userSearchResult?.found 
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300'
                }`}
                placeholder="usuario@empresa.com"
                autoComplete="email"
                aria-describedby={errors.email ? 'email-error' : 'email-help'}
                aria-invalid={!!errors.email}
              />
              
              {/* Loading indicator */}
              {isSearchingUser && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0A3977]" aria-hidden="true"></div>
                </div>
              )}
              
              {/* Success indicator */}
              {!isSearchingUser && userSearchResult?.found && !userSearchResult.hasPassword && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              {/* Warning indicator */}
              {!isSearchingUser && userSearchResult?.found && userSearchResult.hasPassword && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* User search results */}
            {!isSearchingUser && userSearchResult && (
              <div className="mt-2">
                {userSearchResult.found && userSearchResult.user ? (
                  <div className={`p-3 rounded-md border ${
                    userSearchResult.hasPassword 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {userSearchResult.hasPassword ? (
                          <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm ${
                          userSearchResult.hasPassword ? 'text-yellow-700' : 'text-green-700'
                        }`}>
                          {userSearchResult.hasPassword 
                            ? `Usuario encontrado pero ya tiene contraseña configurada`
                            : `Usuario encontrado: ${userSearchResult.user.email} (${userSearchResult.user.country}, ${userSearchResult.user.role})`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-md border bg-red-50 border-red-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          {userSearchResult.error || 'Usuario no encontrado'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
            
            {!errors.email && !userSearchResult && formData.email && validateEmail(formData.email) && (
              <p id="email-help" className="mt-1 text-xs text-gray-500">
                Buscando usuario...
              </p>
            )}
          </div>
          
          {/* Password Field - Only show if user is found and doesn't have password */}
          {userSearchResult?.found && !userSearchResult.hasPassword && (
            <>
              <div>
                <label 
                  htmlFor="add-password-password" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="add-password-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    disabled={isFormDisabled}
                    className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A3977] focus:border-[#0A3977] disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${
                      errors.password 
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
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score <= 1 ? 'bg-red-500 w-1/4' :
                            passwordStrength.score === 2 ? 'bg-yellow-500 w-2/4' :
                            passwordStrength.score === 3 ? 'bg-blue-500 w-3/4' :
                            'bg-green-500 w-full'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score <= 1 ? 'text-red-600' :
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

              {/* Confirm Password Field */}
              <div>
                <label 
                  htmlFor="add-password-confirm-password" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="add-password-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    disabled={isFormDisabled}
                    className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A3977] focus:border-[#0A3977] disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 ${
                      errors.confirmPassword 
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
            </>
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

          {/* Submit Button - Only show if user is found and eligible */}
          {userSearchResult?.found && !userSearchResult.hasPassword && (
            <button
              type="submit"
              disabled={isFormDisabled || !canSubmit}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0A3977] hover:bg-[#082f5f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3977] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" aria-hidden="true"></div>
                  <span>Agregando contraseña...</span>
                </>
              ) : (
                'Agregar Contraseña'
              )}
            </button>
          )}
        </form>

        {/* Info message about backend integration */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                La funcionalidad de agregar contraseña a usuarios existentes estará disponible cuando se complete la integración del backend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};