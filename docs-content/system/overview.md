# Arquitectura del Sistema

## Visión General

Factupe es un sistema de facturación electrónica diseñado con una arquitectura modular y extensible. Utiliza un monorepo con Turborepo para organizar el código en paquetes independientes pero interconectados.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cliente (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Next.js    │  │    SSE       │  │   SDK (Externo)      │  │
│  │   App        │  │   Client     │  │   @factupe/sdk       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes                     │   │
│  │  /api/auth/*  │  /api/documents/*  │  /api/realtime      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ @factupe/  │  │ @factupe/  │  │ @factupe/  │  │ @factupe/│  │
│  │   auth     │  │   sunat    │  │  realtime  │  │  types   │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  @factupe/database                        │   │
│  │              Drizzle ORM + PostgreSQL                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │   SUNAT    │  │   OSE/PSE  │  │  Storage   │                │
│  │   (Beta/   │  │ (Nubefact, │  │  (S3/GCS/  │                │
│  │   Prod)    │  │   eFact)   │  │   Local)   │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## Paquetes del Monorepo

### Apps

| Paquete | Descripción |
|---------|-------------|
| `@factupe/web` | Aplicación principal Next.js 16 |
| `@factupe/docs` | Documentación con Fumadocs |

### Packages

| Paquete | Descripción |
|---------|-------------|
| `@factupe/database` | Schemas Drizzle y cliente de BD |
| `@factupe/auth` | Configuración better-auth y RBAC |
| `@factupe/sunat` | Core de facturación SUNAT |
| `@factupe/realtime` | Sistema de tiempo real |
| `@factupe/sdk` | SDK para integraciones externas |
| `@factupe/types` | Tipos TypeScript compartidos |
| `@factupe/ui` | Componentes UI (shadcn) |
| `@factupe/config` | Configuraciones compartidas |

## Flujo de Datos

### Creación de Factura

```
1. Usuario crea factura en UI
         │
         ▼
2. Server Action valida datos
         │
         ▼
3. Se inserta documento en BD
         │
         ▼
4. `after()` ejecuta tareas background:
   ├── Generar XML UBL 2.1
   ├── Firmar XML (certificado digital)
   ├── Enviar a SUNAT/OSE
   ├── Procesar respuesta CDR
   ├── Actualizar estado en BD
   ├── Generar PDF
   └── Notificar via realtime
         │
         ▼
5. Usuario recibe notificación SSE
```

### Sistema de Tiempo Real

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PostgreSQL │────▶│  NOTIFY     │────▶│  Listener   │
│  Trigger    │     │  Channel    │     │  (Node.js)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  SSE        │
                                        │  Manager    │
                                        └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
             ┌─────────────┐           ┌─────────────┐            ┌─────────────┐
             │  Tenant A   │           │  Tenant B   │            │  Tenant C   │
             │  Clients    │           │  Clients    │            │  Clients    │
             └─────────────┘           └─────────────┘            └─────────────┘
```

## Multi-tenancy

El sistema utiliza multi-tenancy por fila (`tenant_id`):

- Todas las tablas principales tienen una columna `tenant_id`
- Las consultas siempre filtran por `tenant_id`
- El `tenant_id` se extrae de la sesión del usuario
- Índices optimizados para queries por tenant

```sql
-- Ejemplo de tabla con multi-tenancy
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  -- ... otras columnas
);

-- Índice para queries por tenant
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
```

## Seguridad

### Autenticación

- better-auth con JWT sessions
- Soporte para email/password
- Sessions persistidas en PostgreSQL
- CSRF protection

### Autorización (RBAC)

```typescript
// Roles disponibles
type Role = 'owner' | 'admin' | 'accountant' | 'sales' | 'viewer'

// Verificación de permisos
if (hasPermission(user, 'documents:create')) {
  // Permitir acción
}
```

### Validación

- Zod para validación de inputs
- Validación de RUC y documentos peruanos
- Sanitización de datos antes de persistir

## Extensibilidad

### Sistema de Plugins

```typescript
interface FactupePlugin {
  name: string
  version: string

  // Hooks del ciclo de vida
  onDocumentCreate?: (doc: Document) => Promise<void>
  onDocumentSent?: (doc: Document, response: SunatResponse) => Promise<void>

  // Extensiones de UI
  dashboardWidgets?: ComponentType[]
  documentActions?: DocumentAction[]

  // Rutas adicionales
  routes?: RouteDefinition[]
}
```

### Event Emitter

```typescript
// Suscribirse a eventos
events.on('document:created', async (doc) => {
  // Integración con sistema externo
})

events.on('document:accepted', async ({ document, response }) => {
  // Notificar a sistema ERP
})
```

## Escalabilidad

### Horizontal Scaling

- Stateless API (JWT sessions)
- PostgreSQL como único state
- SSE connections balanceadas por tenant

### Performance

- React Compiler para optimización automática
- Turbopack para desarrollo rápido
- Índices de BD optimizados
- Caching de queries frecuentes

## Monitoreo

### Logs

- Structured logging con pino
- Request/Response logging
- Error tracking

### Métricas

- Documentos emitidos por período
- Tiempo de respuesta SUNAT
- Tasa de éxito/rechazo
- Conexiones SSE activas
