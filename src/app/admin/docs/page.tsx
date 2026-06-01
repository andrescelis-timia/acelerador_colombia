import { BookOpenIcon } from '@heroicons/react/24/outline';

export default function DocsLanding() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-3">
        <BookOpenIcon className="h-7 w-7 text-timia-accent" />
        <h1 className="text-2xl font-semibold text-gray-900">Documentación</h1>
      </div>
      <p className="text-sm text-gray-600 mb-8">
        Material de referencia para perfiles administrativos. Aquí encuentras la matriz
        de roles y permisos del sistema y los diagramas que describen visualmente cómo
        funciona la plataforma.
      </p>

      <div className="space-y-4">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Roles y permisos</h2>
          <p className="text-sm text-gray-600">
            Quién puede hacer qué a nivel de sistema y de proyecto. Útil para asignar
            usuarios desde el panel de admin.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Diagramas</h2>
          <p className="text-sm text-gray-600">
            Vista global de los componentes (CloudFront, ECS, Aurora, Anthropic, …) y
            flujos clave: el proceso end-to-end del equipo Fábrica, la generación
            de diccionarios con IA y la generación de configuraciones del Pipeline.
          </p>
        </section>
      </div>

      <p className="text-xs text-gray-400 mt-10">
        Selecciona un documento en la barra lateral.
      </p>
    </div>
  );
}
