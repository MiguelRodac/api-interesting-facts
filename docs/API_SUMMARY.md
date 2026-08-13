# API Summary — Social Facts

Base URL: `http://localhost:3000` (desarrollo)
Producción: `https://api.rodacservices.com` (configurar en `.env`)

---

## 1. Autenticación

### Flujo completo
```
1. POST /auth/dev-login   → { token, firebaseUid }
2. POST /auth/profile     → { username, displayName, avatarUrl }
3. Listo — usar Bearer token en requests protegidas
```

### Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/dev-login` | No | Obtener token (desarrollo) |
| POST | `/auth/profile` | Bearer | Crear perfil de usuario |
| GET | `/auth/me` | Bearer | Obtener perfil propio |
| PATCH | `/auth/me` | Bearer | Actualizar perfil propio |

### dev-login
```json
// Request
{ "secret": "tu-dev-secret", "email": "test@example.com", "password": "test-password" }

// Response 200
{ "token": "eyJ...", "firebaseUid": "abc123" }
```

### Crear perfil
```json
// Request
{ "username": "johndoe", "displayName": "John Doe", "avatarUrl": "https://..." }

// Response 201
{ "firebaseUid": "abc123", "username": "johndoe", "displayName": "John Doe", "avatarUrl": "https://...", "createdAt": "2024-..." }
```

### Obtener/Actualizar perfil propio
```json
// GET /auth/me — Response 200
{ "firebaseUid": "...", "email": "...", "username": "...", "displayName": "...", "avatarUrl": "...", "createdAt": "..." }

// PATCH /auth/me — Request
{ "displayName": "Nuevo nombre", "avatarUrl": "https://..." }  // solo estos campos
```

---

## 2. Facts

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/facts` | No | Listar facts (paginable, filtrable) |
| GET | `/facts/popular` | No | Listar facts por likes (respuesta enriquecida) |
| GET | `/facts/:id` | No | Obtener un fact por ID |
| GET | `/facts/author/:authorId` | No | Facts de un autor |
| POST | `/facts` | Bearer + perfil | Crear fact |
| PATCH | `/facts/:id` | Bearer (autor) | Actualizar fact |
| DELETE | `/facts/:id` | Bearer (autor) | Eliminar fact |

### Listar facts
```json
// GET /facts — Response 200
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "author": { "username": "mike07", "email": "mike@example.com" },
      "title": "Did you know?",
      "content": "Honey never spoils...",
      "likes": 42,
      "createdAt": "2026-08-07T20:00:00.000Z",
      "updatedAt": "2026-08-07T20:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "nextPage": null
}
```

### Crear fact
```json
// Request
{ "title": "Título opcional", "content": "Contenido de 10-200 caracteres" }

// Response 201
{ "id": "uuid", "author": { "username": "...", "email": "..." }, "title": "...", "content": "...", "likes": 0, "createdAt": "...", "updatedAt": "..." }
```

### Obtener fact por ID
```json
// Response 200
{ "id": "uuid", "author": { "username": "...", "email": "..." }, "title": "...", "content": "...", "likes": 5, "createdAt": "...", "updatedAt": "..." }
```

---

## 3. Ping

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/ping` | No | Health check |

```json
// GET /ping — Response 200
// Devuelve JSON con status, timestamp, uptime, database health y docs link
{
  "status": "ok",
  "timestamp": "2026-08-13T00:00:00.000Z",
  "uptime": 3600.5,
  "database": "connected",
  "docs": "http://localhost:3000"
}
```

---

## 4. Likes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/facts/:factId/likes` | Bearer + perfil | Dar like |
| DELETE | `/facts/:factId/likes` | Bearer + perfil | Quitar like |
| GET | `/facts/:factId/likes` | No | Likes de un fact |
| GET | `/users/:userId/likes` | No | Likes de un usuario |

### Dar/Quitar like
```json
// POST — Response 201
{ "id": "uuid", "userId": "...", "factId": "...", "createdAt": "..." }

// DELETE — Response 204 (sin body)

// GET /facts/:factId/likes — Response 200 (ver formato paginado abajo)
```

---

## 5. Users

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/users/:username` | No | Perfil público |

```json
// Response 200
{ "username": "johndoe", "displayName": "John Doe", "avatarUrl": "...", "createdAt": "..." }
// Nota: NO devuelve email ni firebaseUid
```

---

## 6. Paginación y Filtros

### Formato de respuesta (listados)
```json
{
  "results": [...],
  "page": 1,
  "limit": 20,
  "nextPage": 2   // null si es la última página
}
```

### Params reservados
| Param | Valores | Default | Descripción |
|-------|---------|---------|-------------|
| `page` | número | 1 | Página |
| `limit` | 1-100 | 20 | Items por página |
| `order_by` | ver por endpoint | createdAt | Campo de ordenamiento |
| `order_dir` | asc / desc | desc | Dirección |

### Filtros dinámicos
Sintaxis: `campo__operación=valor`

| Operación | Ejemplo | Descripción |
|-----------|---------|-------------|
| `__like` | `title__like=honey` | Contiene texto (case-insensitive) |
| `__eq` | `authorId__eq=uid123` | Igualación exacta |
| `__gt` / `__gte` | `createdAt__gte=2024-01-01` | Mayor/Mayor o igual |
| `__lt` / `__lte` | `createdAt__lte=2024-12-31` | Menor/Menor o igual |
| `__in` | `id__in=id1,id2` | Dentro de lista |
| `__between` | `createdAt__between=2024-01-01,2024-06-30` | Entre rango |

### order_by por endpoint
- `/facts` → `createdAt`, `updatedAt`
- `/facts/popular` → `likesCount`, `createdAt`, `updatedAt`
- `/facts/:id/likes` → `createdAt`
- `/users/:userId/likes` → `createdAt`

### Ejemplos
```
GET /facts?page=2&limit=10
GET /facts?order_by=likesCount&order_dir=desc&limit=5
GET /facts?title__like=honey&createdAt__gte=2024-01-01
GET /facts?authorId__eq=firebaseUid&order_by=createdAt
```

---

## 7. Formato de Errores (RFC 9457)

Todos los errores devuelven:
```json
{
  "type": "http://localhost:3000/errors/validation/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "Request validation failed",
  "error_code": "VALIDATION_ERROR",
  "category": "validation",
  "instance": "/facts",
  "trace_id": "uuid",
  "timestamp": "2026-08-12T00:00:00.000Z",
  "details": [{ "field": "order_by", "message": "Invalid option: expected one of..." }]
}
```

### Códigos de error comunes
| HTTP | error_code | Qué significa |
|------|------------|---------------|
| 400 | BAD_REQUEST | Request malformado |
| 401 | UNAUTHORIZED | Token faltante o inválido |
| 403 | FORBIDDEN | Sin permiso (perfil incompleto o no es autor) |
| 403 | PROFILE_INCOMPLETE | Token válido pero no completó onboarding |
| 404 | RESOURCE_NOT_FOUND | Recurso no encontrado |
| 409 | LIKE_ALREADY_EXISTS | Ya diste like a este fact |
| 409 | USERNAME_TAKEN | Username ya existe |
| 422 | VALIDATION_ERROR | Params o body inválido |
| 500 | INTERNAL_ERROR | Error interno del servidor |

---

## 8. Headers a enviar

### Requests autenticadas
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### En respuestas de error
```
Content-Type: application/problem+json
X-Trace-Id: uuid  // útil para debugging
```

---

## 9. Notas Importantes

- **Username** es único a nivel global
- **Dar like** requiere perfil completo (onboarding hecho)
- **Actualizar/Eliminar fact** solo el autor puede
- **Listar facts** con `authorId__eq` para filtrar por autor específico
- **Likes** está disponible en todos los endpoints de facts (respuesta enriquecida con `author: {username, email}`)
- **No existe 404 en listados** — si no hay resultados devuelve `results: []` con 200
- El token de dev-login es un JWT de Firebase mockeado — en producción usar Firebase Auth real
