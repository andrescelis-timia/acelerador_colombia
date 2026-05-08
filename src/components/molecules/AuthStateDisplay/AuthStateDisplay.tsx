interface AuthStateDisplayProps {
  state: 'loading' | 'loggingOut' | 'unauthenticated';
}

export const AuthStateDisplay = ({ state }: AuthStateDisplayProps) => {
  const getContent = () => {
    switch (state) {
      case 'loading':
        return {
          spinner: true,
          text: 'Cargando...',
          color: 'text-gray-600'
        };
      case 'loggingOut':
        return {
          spinner: true,
          text: 'Cerrando sesión...',
          color: 'text-timia-accent'
        };
      case 'unauthenticated':
        return {
          spinner: false,
          text: 'Usuario no autenticado',
          color: 'text-red-600'
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        {content.spinner && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-4"></div>
        )}
        <div className={`text-lg ${content.color}`}>
          {content.text}
        </div>
      </div>
    </div>
  );
};