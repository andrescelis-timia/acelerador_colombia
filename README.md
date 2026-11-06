# BBVA Ingesta App

Frontend Next.js 15 (App Router) que consume `bbva-ingesta-api`. Es la interfaz para gestionar proyectos, objetos, diccionarios, generar artefactos del pipeline (Kirby, Hammurabi, SmartCleaner, Control-M) y disparar despliegues a Bitbucket.

---

## Stack

- **Next.js 15.5** con App Router y Turbopack en dev.
- **React 19** + **TypeScript**.
- **TailwindCSS** para estilos; sigue tokens `timia-*` (tema corporativo).
- **Framer Motion** para transiciones; **Headless UI** + **Heroicons** para componentes.
- **Firebase Auth** (Google OAuth + email/password) — autenticación de usuarios.
- **NextAuth** para gestión de sesión en Next.

---

## Estructura del repo

```
src/
├── app/                  # Rutas (App Router): /, /login, /project, /object, /object-detail/[id], /admin
├── components/
│   ├── atoms/            # Botones, inputs, etc.
│   ├── molecules/        # ErrorModal, ProgressDialog, AuthStateDisplay, LogoutOverlay…
│   └── organisms/        # Bloques grandes: ObjectForm, PipelineGenerator, ControlMFlow,
│                         #                  DataGovernmentFlow, SchemaGenerationFlow, DeployADA…
├── hooks/                # useAuthGuard, useUserRole, useProjectRole
├── lib/
│   ├── api/              # Cliente HTTP base + config
│   ├── auth/             # Helpers JWT y Firebase
│   └── context/          # AuthContext
├── services/             # Una carpeta por dominio (Object, Project, Dictionary,
│                         # PipelineGenerator, ProjectMember, User…) — types + api calls
└── middleware.ts         # Redirige a /login sin sesión
```

## Organismos clave

| Organismo | Responsabilidad |
|---|---|
| `ObjectForm` | Crear / editar objeto (nombre, URL del pre-diccionario, periodicidad) |
| `DataGovernmentFlow` | Genera diccionario via servicio IA (Nebula `lite_co` o DATUM) |
| `SchemaGenerationFlow` | Llama a POST `/schemas` con opción de URL externa, persiste L1T |
| `PipelineGenerator` | Sube schemas, decide `component_type` (tabla / tablón / tabla_no_raw), genera Kirby/Hammurabi/SmartCleaner |
| `ControlMFlow` | Configura Datax / FileWatcher, genera mallas T04/T02 (modo nuevo o aditivo) |
| `DeployADA` | Dispara PR automático a Bitbucket con los artefactos generados |

---

## Requisitos

- **Node.js 20+** y npm.
- Backend (`bbva-ingesta-api`) corriendo en `http://localhost:8000` (ver repo hermano).
- Proyecto Firebase con autenticación Google habilitada.

### `.env.local` necesario

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<projectId>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<projectId>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

> Crea/configura el proyecto en https://console.firebase.google.com/ y habilita Google como método de autenticación.

---

## Arranque rápido

```bash
npm install        # instalar dependencias
npm run dev        # arrancar dev server (turbopack)
```

Abre [http://localhost:3000](http://localhost:3000).

### Otros scripts

```bash
npm run build      # build de producción
npm run start      # servir el build
npm run lint       # ESLint
```

---

## Convenciones del repo

- **Hexagonal en el frontend**: cada dominio en `services/<Domain>/` con sus `types.ts`, `transforms.ts`, `index.ts`. Los organismos NO llaman a `fetch` directo — siempre vía service.
- **Sin backwards-compat shims**: si un campo se renombra, se cambia en todos lados; nada de aliases temporales.
- **Modal stacking**: para modales sobre `framer-motion`, usar `createPortal(..., document.body)` para escapar del stacking context.
- **Tokens de color**: `timia-accent`, `timia-accent-hover` para acciones primarias.

---

## Autenticación y roles

- Header `X-User` y `X-Country` se inyectan en cada request desde `AuthContext`.
- Acceso a `/admin` controlado por `useUserRole().isAdmin`.
- Permisos por proyecto controlados por `useProjectRole(projectId)` — expone `isReadOnly`, `canGenerate`, `canEditProject`, `canCreateObjects`, `canEditObject(creatorEmail)`.
- El detalle del modelo RBAC vive en la doc transversal del workspace (`docs/1_operacion_soporte/`).

---

## Repos hermanos

- `bbva-ingesta-api` — Backend principal (FastAPI)
- `bbva-ingesta-api-ai` — Servicio de IA (Claude en Bedrock + catálogo por `rcn-api-gateway`)
