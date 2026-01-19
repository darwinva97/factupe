# Factupe

Sistema de facturación electrónica para SUNAT - Open Source

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)

## Características

- **Comprobantes Electrónicos**: Facturas, boletas, notas de crédito/débito, guías de remisión, retenciones y percepciones
- **Integración SUNAT**: Comunicación directa con SUNAT o mediante OSE/PSE (Nubefact, eFact, etc.)
- **Multi-empresa**: Gestiona múltiples empresas desde una sola instalación
- **API REST**: API completa para integración con sistemas externos
- **SDK**: SDK oficial para JavaScript/TypeScript
- **Tiempo Real**: Notificaciones en tiempo real del estado de comprobantes
- **Open Source**: Código abierto bajo licencia MIT

## Stack Tecnológico

- **Framework**: Next.js 16 + React 19 + React Compiler
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: better-auth
- **Database**: PostgreSQL + Drizzle ORM
- **Realtime**: Server-Sent Events + PostgreSQL LISTEN/NOTIFY
- **Monorepo**: Turborepo

## Estructura del Proyecto

```
factupe/
├── apps/
│   ├── web/                # App principal Next.js
│   └── docs/               # Documentación (Fumadocs)
├── packages/
│   ├── ui/                 # Componentes shadcn
│   ├── database/           # Drizzle schemas
│   ├── auth/               # better-auth config
│   ├── sunat/              # Core facturación SUNAT
│   ├── sdk/                # SDK para integraciones
│   ├── realtime/           # Sistema realtime
│   ├── types/              # Tipos compartidos
│   └── config/             # Configuraciones
└── docs-content/           # Documentación markdown
```

## Inicio Rápido

### Prerrequisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+
- Docker (opcional)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/factupe/factupe.git
cd factupe

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar base de datos (con Docker)
docker compose up -d postgres

# Ejecutar migraciones
pnpm db:push

# Sembrar datos iniciales
pnpm db:seed

# Iniciar en desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Credenciales de Demo

- **Email**: admin@factupe.com
- **Password**: demo123

## Documentación

### Guías

- [Guía de Instalación](docs-content/user-guides/installation.md)
- [Configuración SUNAT](docs-content/user-guides/sunat-config.md)
- [Crear Primera Factura](docs-content/user-guides/first-invoice.md)
- [Integración API](docs-content/api/getting-started.md)

### Arquitectura

- [Visión General](docs-content/system/overview.md)
- [Base de Datos](docs-content/system/database.md)
- [Autenticación](docs-content/system/auth.md)
- [Adaptadores SUNAT](docs-content/system/sunat-adapters.md)

### API Reference

- [Autenticación](docs-content/api/auth.md)
- [Documentos](docs-content/api/documents.md)
- [Clientes](docs-content/api/customers.md)
- [Productos](docs-content/api/products.md)
- [Webhooks](docs-content/api/webhooks.md)

## Uso del SDK

```typescript
import { FactupeClient } from '@factupe/sdk'

const client = new FactupeClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://tu-instancia.com/api',
})

// Crear factura
const invoice = await client.invoices.create({
  customerId: 'cst_123',
  series: 'F001',
  items: [
    {
      description: 'Servicio de consultoría',
      quantity: 1,
      unitPrice: 500,
    },
  ],
})

// Obtener PDF
const pdf = await client.invoices.downloadPdf(invoice.data.id)
```

## Configuración SUNAT

### Modo Beta (Pruebas)

```env
SUNAT_ENVIRONMENT=beta
SUNAT_RUC=20123456789
SUNAT_USER_SOL=MODDATOS
SUNAT_PASSWORD_SOL=moddatos
```

### Modo Producción

```env
SUNAT_ENVIRONMENT=production
SUNAT_RUC=20123456789
SUNAT_USER_SOL=TU_USUARIO_SOL
SUNAT_PASSWORD_SOL=TU_CLAVE_SOL
SUNAT_CERTIFICATE_PATH=/path/to/certificate.pfx
SUNAT_CERTIFICATE_PASSWORD=tu_clave_certificado
```

### Proveedores OSE/PSE

```env
# Nubefact
OSE_PROVIDER=nubefact
OSE_API_KEY=tu-api-key
OSE_API_URL=https://api.nubefact.com/v1

# eFact
OSE_PROVIDER=efact
OSE_API_KEY=tu-api-key
```

## Roles y Permisos

| Rol | Descripción |
|-----|-------------|
| `owner` | Acceso completo, incluyendo facturación |
| `admin` | Gestión completa excepto facturación |
| `accountant` | Documentos completo, lectura de maestros |
| `sales` | Crear documentos, gestión de clientes |
| `viewer` | Solo lectura |

## Extensibilidad

### Sistema de Plugins

```typescript
import type { FactupePlugin } from '@factupe/core'

export const myPlugin: FactupePlugin = {
  name: 'my-plugin',
  version: '1.0.0',

  onDocumentCreate: async (doc) => {
    // Hook cuando se crea un documento
  },

  onDocumentSent: async (doc, response) => {
    // Hook cuando se envía a SUNAT
  },

  dashboardWidgets: [MyCustomWidget],
}
```

### Webhooks

```typescript
// Verificar firma del webhook
const isValid = client.webhooks.verify(payload, signature, secret)

// Eventos disponibles
// - document.created
// - document.sent
// - document.accepted
// - document.rejected
// - document.voided
```

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar en modo desarrollo
pnpm build            # Construir para producción
pnpm start            # Iniciar en producción

# Base de datos
pnpm db:generate      # Generar migraciones
pnpm db:migrate       # Ejecutar migraciones
pnpm db:push          # Push directo (dev)
pnpm db:studio        # Abrir Drizzle Studio
pnpm db:seed          # Sembrar datos

# Calidad
pnpm lint             # Ejecutar ESLint
pnpm typecheck        # Verificar tipos
pnpm test             # Ejecutar tests
pnpm format           # Formatear código
```

## Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Convención de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formateo
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Mantenimiento

## Licencia

[MIT](LICENSE)

## Soporte

- [GitHub Issues](https://github.com/factupe/factupe/issues)
- [Documentación](https://docs.factupe.com)

---

Hecho con Next.js, React 19 y mucho cafe ☕
