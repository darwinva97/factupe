# API - Guía de Inicio

## Introducción

La API de Factupe permite integrar la facturación electrónica con cualquier sistema externo. Proporciona endpoints REST para gestionar documentos, clientes y productos.

## Autenticación

La API utiliza autenticación mediante API Key:

```bash
curl -X GET https://tu-instancia.com/api/documents \
  -H "Authorization: Bearer tu-api-key"
```

### Obtener API Key

1. Inicia sesión en el dashboard
2. Ve a **Configuración > API**
3. Genera una nueva API Key
4. Guarda la key de forma segura (solo se muestra una vez)

## Base URL

```
https://tu-instancia.com/api
```

## Formato de Respuesta

Todas las respuestas siguen el formato:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalCount": 100
  }
}
```

### Errores

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El RUC es inválido",
    "details": {
      "field": "documentNumber",
      "value": "12345"
    }
  }
}
```

## Endpoints Principales

### Documentos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/invoices` | Crear factura/boleta |
| GET | `/invoices/{id}` | Obtener documento |
| GET | `/invoices` | Listar documentos |
| POST | `/invoices/{id}/void` | Anular documento |
| GET | `/invoices/{id}/pdf` | Descargar PDF |
| GET | `/invoices/{id}/xml` | Descargar XML |

### Clientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/customers` | Crear cliente |
| GET | `/customers/{id}` | Obtener cliente |
| GET | `/customers` | Listar clientes |
| PATCH | `/customers/{id}` | Actualizar cliente |
| DELETE | `/customers/{id}` | Eliminar cliente |

### Productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/products` | Crear producto |
| GET | `/products/{id}` | Obtener producto |
| GET | `/products` | Listar productos |
| PATCH | `/products/{id}` | Actualizar producto |
| DELETE | `/products/{id}` | Eliminar producto |

## Ejemplos

### Crear Factura

```bash
curl -X POST https://tu-instancia.com/api/invoices \
  -H "Authorization: Bearer tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cst_abc123",
    "series": "F001",
    "items": [
      {
        "description": "Servicio de consultoría",
        "quantity": 1,
        "unitPrice": 500,
        "unitCode": "ZZ",
        "taxType": "10"
      }
    ],
    "observations": "Pago a 30 días"
  }'
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "id": "doc_xyz789",
    "series": "F001",
    "number": "00001",
    "status": "pending",
    "total": 590.00
  }
}
```

### Crear Cliente

```bash
curl -X POST https://tu-instancia.com/api/customers \
  -H "Authorization: Bearer tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "6",
    "documentNumber": "20123456789",
    "name": "Empresa Cliente S.A.C.",
    "address": "Av. Principal 123, Lima",
    "email": "contacto@cliente.com"
  }'
```

### Listar con Filtros

```bash
curl -X GET "https://tu-instancia.com/api/invoices?status=accepted&startDate=2024-01-01&pageSize=50" \
  -H "Authorization: Bearer tu-api-key"
```

## SDK

Para una integración más sencilla, usa el SDK oficial:

```bash
npm install @factupe/sdk
```

```typescript
import { FactupeClient } from '@factupe/sdk'

const client = new FactupeClient({
  apiKey: 'tu-api-key',
  baseUrl: 'https://tu-instancia.com/api',
})

// Crear factura
const invoice = await client.invoices.create({
  customerId: 'cst_abc123',
  series: 'F001',
  items: [
    { description: 'Producto A', quantity: 2, unitPrice: 100 }
  ]
})

// Descargar PDF
const pdf = await client.invoices.downloadPdf(invoice.data.id)
```

## Webhooks

Recibe notificaciones cuando cambia el estado de los documentos:

```typescript
// En tu servidor
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-factupe-signature']
  const isValid = client.webhooks.verify(req.body, signature, 'tu-secret')

  if (!isValid) {
    return res.status(401).send('Invalid signature')
  }

  const event = JSON.parse(req.body)

  switch (event.type) {
    case 'document.accepted':
      console.log('Documento aceptado:', event.data.id)
      break
    case 'document.rejected':
      console.log('Documento rechazado:', event.data.id)
      break
  }

  res.status(200).send('OK')
})
```

## Rate Limits

| Plan | Requests/min | Requests/día |
|------|-------------|--------------|
| Free | 60 | 1,000 |
| Pro | 300 | 10,000 |
| Enterprise | Sin límite | Sin límite |

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - API Key inválida |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Documento duplicado |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Error - Error del servidor |
