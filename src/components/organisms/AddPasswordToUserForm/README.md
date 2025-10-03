# AddPasswordToUserForm

Componente para agregar contraseña a usuarios existentes que usan Google OAuth.

## Características

- **Búsqueda de usuario**: Busca automáticamente usuarios por email con debounce
- **Validación de estado**: Verifica si el usuario existe y si ya tiene contraseña
- **Validación de contraseña**: Mismos requisitos que CreateUserWithPasswordForm
- **Indicadores visuales**: Muestra estado de búsqueda, éxito, advertencias y errores
- **Prevención de duplicados**: No permite agregar contraseña si ya existe
- **Mostrar/ocultar contraseña**: Botones para alternar visibilidad
- **Accesibilidad**: Implementa ARIA labels y roles apropiados

## Uso

```tsx
import { AddPasswordToUserForm } from '@/components/organisms/AddPasswordToUserForm';

<AddPasswordToUserForm
  onSuccess={(user) => console.log('Contraseña agregada:', user)}
  onError={(error) => console.error('Error:', error)}
  isLoading={false}
  className="custom-class"
/>
```

## Props

- `onSuccess`: Callback ejecutado cuando la contraseña se agrega exitosamente
- `onError`: Callback ejecutado cuando ocurre un error
- `isLoading`: Estado de carga opcional
- `className`: Clases CSS adicionales

## Flujo de Uso

1. **Ingreso de email**: Usuario ingresa email del usuario existente
2. **Búsqueda automática**: Sistema busca el usuario (debounce de 800ms)
3. **Validación de estado**: Verifica si existe y si ya tiene contraseña
4. **Configuración de contraseña**: Si es elegible, permite configurar nueva contraseña
5. **Confirmación**: Valida que las contraseñas coincidan
6. **Envío**: Procesa la solicitud

## Estados de Usuario

### Usuario Encontrado ✅
- Existe en el sistema
- No tiene contraseña configurada
- Puede proceder con la configuración

### Usuario con Contraseña ⚠️
- Existe en el sistema
- Ya tiene contraseña configurada
- No puede proceder (evita duplicados)

### Usuario No Encontrado ❌
- No existe en el sistema
- No puede proceder

## Validaciones

### Email
- Campo requerido
- Formato válido
- Usuario debe existir
- Usuario no debe tener contraseña previa

### Contraseña
- Mismos requisitos que CreateUserWithPasswordForm
- Indicador de fortaleza visual
- Confirmación requerida

## Integración Backend

Este componente está preparado para integrarse con:
- `GET /api/v1/admin/users/search?email=` para búsqueda de usuarios
- `POST /api/v1/admin/users/add-password` para agregar contraseña

Disponible cuando se complete la integración del backend (Task 3.2).