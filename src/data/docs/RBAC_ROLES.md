# Sistema de Roles

## Resumen

La plataforma maneja dos niveles de roles:

- **Rol del sistema** (tabla `users`): define permisos globales del usuario
- **Rol de proyecto** (tabla `project_members`): define permisos dentro de un proyecto especifico

---

## Roles del Sistema

Se asignan al crear el usuario desde el panel de administracion.

| Rol | Descripcion |
|---|---|
| ADMIN | Acceso total. Panel admin, gestion de usuarios, ve todos los proyectos de su pais sin necesidad de ser miembro. |
| APP_OWNER | Puede crear proyectos. Solo ve proyectos donde esta asignado como miembro. Variante "Application Owner". |
| SERVICE_OWNER | Puede crear proyectos. Solo ve proyectos donde esta asignado como miembro. Variante "Service Owner". |
| DATA_ENGINEER | No puede crear proyectos. Solo ve proyectos donde esta asignado como miembro. |

> APP_OWNER y SERVICE_OWNER tienen exactamente los mismos permisos; el split
> es solo organizacional (distinguir owner de aplicacion vs owner de servicio).

> El rol del sistema se almacena en la columna `role` de la tabla `users`.

---

## Roles de Proyecto

Se asignan en el panel de administracion > Asignaciones. Un usuario puede tener un rol diferente en cada proyecto.

| Rol | Ver proyecto | Crear objetos | Editar objetos | Generar artefactos | Desplegar | Editar proyecto |
|---|---|---|---|---|---|---|
| OWNER | Si | Si | Todos | Si | Si | Si |
| OWNER_READONLY | Si | No | No | No | No | No |
| DATA_ENGINEER | Si | Si | Solo los propios | Si | Si | No |

> Los roles de proyecto se almacenan en la columna `project_role` de la tabla `project_members`.

### Detalle por rol

**OWNER**
- Control total sobre el proyecto y sus objetos
- Puede editar metadatos del proyecto (nombre, ticket Jira)
- Puede crear, editar y archivar cualquier objeto del proyecto
- Puede generar diccionarios, schemas, configs (Kirby, Hammurabi, SmartCleaner), mallas Control-M
- Puede desplegar a repositorios Bitbucket

**OWNER_READONLY**
- Ve el proyecto y todos sus objetos
- Ve los artefactos generados (diccionarios, schemas, configs, mallas)
- No puede crear, editar ni archivar objetos
- No puede generar ningun artefacto
- No puede desplegar a repositorios
- En la interfaz: todas las secciones se muestran con opacidad reducida y sin interaccion
- Se muestra un indicador "Solo lectura" junto al nombre del objeto
- Hoy estas restricciones las aplica solo el front: la API trata a OWNER_READONLY igual que a OWNER al editar o archivar objetos

**DATA_ENGINEER**
- Puede crear objetos dentro del proyecto
- Solo puede editar y archivar los objetos que el mismo creo
- Puede generar todos los artefactos
- Puede desplegar a repositorios
- No puede editar metadatos del proyecto

---

## Matriz de permisos

### Acceso a proyectos

| Accion | ADMIN | APP_OWNER / SERVICE_OWNER (sistema) | DATA_ENGINEER (sistema) |
|---|---|---|---|
| Ver todos los proyectos del pais | Si | No | No |
| Crear proyecto | Si | Si | No |
| Ver proyecto asignado | Si | Si | Si |

### Acciones dentro de un proyecto

| Accion | OWNER (proyecto) | OWNER_READONLY | DATA_ENGINEER |
|---|---|---|---|
| Editar proyecto | Si | No | No |
| Crear objeto | Si | No | Si |
| Editar cualquier objeto | Si | No | No |
| Editar objeto propio | Si | No | Si |
| Archivar objeto | Si | No | Solo los propios |
| Generar diccionarios | Si | No | Si |
| Generar schemas | Si | No | Si |
| Generar Kirby/Hammurabi/SmartCleaner | Si | No | Si |
| Generar mallas Control-M | Si | No | Si |
| Desplegar a repositorio | Si | No | Si |
| Analizar muestra | Si | No | Si |
| Ver artefactos generados | Si | Si | Si |
| Descargar archivos | Si | Si | Si |

> La columna OWNER_READONLY la aplica el front. La API solo comprueba que el
> usuario sea miembro del proyecto, asi que una llamada directa de OWNER_READONLY
> puede editar o archivar objetos.

---

## Implementacion tecnica

### Backend

- Enum sistema: `domain/enums/user_role.py` — ADMIN, APP_OWNER, SERVICE_OWNER, DATA_ENGINEER
- Enum proyecto: `domain/enums/project_role.py` — OWNER, OWNER_READONLY, DATA_ENGINEER
- Tabla: `project_members` con CHECK constraint `ck_pm_role`
- Validacion de creacion de proyecto: `base_repository._can_create_projects()` acepta ADMIN, APP_OWNER, SERVICE_OWNER
- Validacion de escritura de proyecto: `base_repository._is_project_owner()` solo reconoce ProjectRole.OWNER
- Acceso: `project_member_repository.get_user_accessible_project_ids()` incluye los 3 roles de proyecto
- Restriccion DATA_ENGINEER: `object_repository_impl` solo permite editar/borrar objetos creados por el propio usuario
- OWNER_READONLY: sin restriccion en el backend (ver la nota de la matriz)

### Frontend

- Hook sistema: `hooks/useUserRole.ts` — expone `isAdmin`, `isAppOwner`, `isServiceOwner`, `isDataEngineer`, `canCreateProjects`
- Hook proyecto: `hooks/useProjectRole.ts` — expone `isReadOnly`, `canGenerate`, `canEditProject`, `canCreateObjects`, `canEditObject`
- Restriccion visual: `ObjectDetailContent` aplica `pointer-events-none opacity-60` a todos los tab panels cuando `isReadOnly`
- Badge: icono de ojo + "Solo lectura" junto al nombre del objeto

### Migracion de BD

- `scripts/migrations/005a_add_owner_readonly_role.sql` — agrega OWNER_READONLY al CHECK
- `scripts/migrations/006_split_owner_and_rename_developer.sql` — split sistema OWNER y rename DEVELOPER → DATA_ENGINEER
- Rollbacks correspondientes en `*_rollback_*.sql`

---

## Identidad de cada peticion

Los permisos de arriba dependen de saber quien hace cada peticion:

- Se entra con usuario y contraseña (`/auth/login-password`) o con Google. En el login con Google, la API verifica el token de Firebase antes de abrir la sesion (`/auth/session/start`).
- Cada login abre una sesion nueva (`users.session_id`) y deja sin efecto la anterior: un usuario solo tiene una sesion activa.
- La sesion caduca a los 7 dias del login (`users.session_expires_at`) y no se renueva con el uso.
- Cada peticion lleva `X-User`, `X-Country` y `X-Session`. La API responde 401 si la sesion no es la vigente de ese usuario, si ha caducado o si el pais no es el del usuario, salvo para ADMIN.
- Al recibir un 401, el front comprueba la sesion y, si ya no vale, la cierra con un aviso.

Codigo: `auth_dependencies.verificar_sesion` en el backend y `lib/auth/singleSession.ts` en el front.

---

## Asignacion de roles

### Rol del sistema
Panel admin > Lista de Usuarios > dropdown de rol por usuario (ADMIN, APP_OWNER, SERVICE_OWNER, DATA_ENGINEER)

### Rol de proyecto
Panel admin > Asignaciones > seleccionar proyecto > agregar miembro con rol o cambiar rol existente

### Vista inversa
Panel admin > Asignaciones > toggle "Por Usuario" > seleccionar usuario > ver proyectos asignados con roles
