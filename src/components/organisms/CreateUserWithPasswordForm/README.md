# CreateUserWithPasswordForm

Componente para crear nuevos usuarios con autenticación por contraseña.

## Características

- **Validación de email**: Verifica formato válido de email
- **Validación de contraseña**: Requiere mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos especiales
- **Indicador de fortaleza**: Muestra visualmente la fortaleza de la contraseña
- **Confirmación de contraseña**: Valida que ambas contraseñas coincidan
- **Selección de país y rol**: Permite configurar país (CO/AR/HO) y rol (USER/ADMIN)
- **Mostrar/ocultar contraseña**: Botones para alternar visibilidad de contraseñas
- **Accesibilidad**: Implementa ARIA labels y roles apropiados
- **Estados de carga**: Maneja estados de envío y carga

## Uso

```tsx
import { CreateUserWithPasswordForm } from '@/components/organisms/CreateUserWithPasswordForm';

<CreateUserWithPasswordForm
  onSuccess={(user) => console.log('Usuario creado:', user)}
  onError={(error) => console.error('Error:', error)}
  isLoading={false}
  className="custom-class"
/>
```

## Props

- `onSuccess`: Callback ejecutado cuando el usuario se crea exitosamente
- `onError`: Callback ejecutado cuando ocurre un error
- `isLoading`: Estado de carga opcional
- `className`: Clases CSS adicionales

## Validaciones

### Email
- Campo requerido
- Formato de email válido

### Contraseña
- Mínimo 8 caracteres
- Al menos una letra minúscula
- Al menos una letra mayúscula
- Al menos un número
- Al menos un carácter especial

### Confirmación
- Debe coincidir exactamente con la contraseña

## Estados

- **Débil**: 0-1 criterios cumplidos
- **Regular**: 2 criterios cumplidos
- **Buena**: 3 criterios cumplidos
- **Fuerte**: 4+ criterios cumplidos

## Integración Backend

Este componente está preparado para integrarse con el endpoint `POST /api/v1/admin/users/create-with-password` cuando esté disponible (Task 3.2).