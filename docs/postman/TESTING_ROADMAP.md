# Roadmap de Testing — Social Facts API

Colección completa de casos de prueba para validar la API. Organizado por módulo con flujos positivos, negativos y de permisos.

> **Nota:** Usar `POST /auth/dev-login` para obtener token en testing local. Los IDs de prueba se extraen de las respuestas de creación (colección configura `{{testFactId}}` y `{{testUserId}}` automáticamente).

---

## 1. Auth

### 1.1 Dev Login

| # | Caso | Método | Auth | Body / Params | Esperado |
|---|------|--------|------|---------------|----------|
| 1.1.1 | Login exitoso con secret válido | POST | No | `secret`, `email`, `password` correctos | 200 — `{ token, firebaseUid }` |
| 1.1.2 | Login con secret inválido | POST | No | `secret` incorrecto | 401 — RFC 9457 error |
| 1.1.3 | Login sin secret | POST | No | Body vacío o sin `secret` | 400 — validación fallida |
| 1.1.4 | Login sin email | POST | No | Falta `email` en body | 400 — validación fallida |

```bash
# 1.1.1 Login exitoso con secret válido
curl -X POST http://localhost:3009/auth/dev-login \
  -H 'Content-Type: application/json' \
  -d '{"secret": "tu-dev-secret-aqui", "email": "test@example.com", "password": "test-password"}'

# 1.1.2 Login con secret inválido
curl -X POST http://localhost:3009/auth/dev-login \
  -H 'Content-Type: application/json' \
  -d '{"secret": "wrong-secret", "email": "test@example.com", "password": "test-password"}'

# 1.1.3 Login sin secret
curl -X POST http://localhost:3009/auth/dev-login \
  -H 'Content-Type: application/json' \
  -d '{"email": "test@example.com", "password": "test-password"}'

# 1.1.4 Login sin email
curl -X POST http://localhost:3009/auth/dev-login \
  -H 'Content-Type: application/json' \
  -d '{"secret": "tu-dev-secret-aqui", "password": "test-password"}'
```

### 1.2 Perfil

| # | Caso | Método | Auth | Body / Params | Esperado |
|---|------|--------|------|---------------|----------|
| 1.2.1 | Crear perfil exitoso | POST | Bearer token | `username`, `displayName`, `avatarUrl` | 201 — `{ id, username, displayName, ... }` |
| 1.2.2 | Crear perfil sin token | POST | No | Body válido | 401 — RFC 9457 error |
| 1.2.3 | Crear perfil con username duplicado | POST | Bearer token | Username ya existente | 409 — `USERNAME_TAKEN` |
| 1.2.4 | Crear perfil con username muy corto (< 3) | POST | Bearer token | `username: "ab"` | 400 — validación |
| 1.2.5 | Crear perfil sin displayName | POST | Bearer token | Solo `username` | 400 — validación |
| 1.2.6 | Obtener perfil propio | GET | Bearer token | — | 200 — datos del perfil actual |
| 1.2.7 | Obtener perfil propio sin token | GET | No | — | 401 — RFC 9457 error |
| 1.2.8 | Actualizar displayName | PATCH | Bearer token | `displayName` nuevo | 200 — perfil actualizado |
| 1.2.9 | Actualizar avatarUrl | PATCH | Bearer token | `avatarUrl` nuevo | 200 — perfil actualizado |
| 1.2.10 | Actualizar username (no permitido) | PATCH | Bearer token | `username` en body | 400 — campo no editable |
| 1.2.11 | Actualizar sin cambios | PATCH | Bearer token | Body vacío | 200 — sin cambios, 200 OK |
| 1.2.12 | Actualizar sin token | PATCH | No | Body válido | 401 — RFC 9457 error |

```bash
# 1.2.1 Crear perfil exitoso
curl -X POST http://localhost:3009/auth/profile \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"username": "johndoe", "displayName": "John Doe", "avatarUrl": "https://example.com/avatar.png"}'

# 1.2.2 Crear perfil sin token
curl -X POST http://localhost:3009/auth/profile \
  -H 'Content-Type: application/json' \
  -d '{"username": "johndoe", "displayName": "John Doe", "avatarUrl": "https://example.com/avatar.png"}'

# 1.2.3 Crear perfil con username duplicado
curl -X POST http://localhost:3009/auth/profile \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"username": "johndoe", "displayName": "John Doe Duplicate", "avatarUrl": "https://example.com/avatar2.png"}'

# 1.2.4 Crear perfil con username muy corto (< 3)
curl -X POST http://localhost:3009/auth/profile \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"username": "ab", "displayName": "Short Name", "avatarUrl": "https://example.com/avatar.png"}'

# 1.2.5 Crear perfil sin displayName
curl -X POST http://localhost:3009/auth/profile \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"username": "validuser"}'

# 1.2.6 Obtener perfil propio
curl -X GET http://localhost:3009/auth/me \
  -H 'Authorization: Bearer {{token}}'

# 1.2.7 Obtener perfil propio sin token
curl -X GET http://localhost:3009/auth/me

# 1.2.8 Actualizar displayName
curl -X PATCH http://localhost:3009/auth/me \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"displayName": "Nuevo Nombre"}'

# 1.2.9 Actualizar avatarUrl
curl -X PATCH http://localhost:3009/auth/me \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"avatarUrl": "https://example.com/new-avatar.png"}'

# 1.2.10 Actualizar username (no permitido)
curl -X PATCH http://localhost:3009/auth/me \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"username": "newusername"}'

# 1.2.11 Actualizar sin cambios
curl -X PATCH http://localhost:3009/auth/me \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{}'

# 1.2.12 Actualizar sin token
curl -X PATCH http://localhost:3009/auth/me \
  -H 'Content-Type: application/json' \
  -d '{"displayName": "Nuevo Nombre"}'
```

---

## 2. Facts

### 2.1 Crear Fact

| # | Caso | Método | Auth | Body | Esperado |
|---|------|--------|------|------|----------|
| 2.1.1 | Crear fact exitoso | POST | Bearer token + perfil | `title`, `content` válidos (10-200 chars) | 201 — `{ id, title, content, authorId, createdAt }` |
| 2.1.2 | Crear fact sin token | POST | No | Body válido | 401 — RFC 9457 error |
| 2.1.3 | Crear fact sin perfil (auth sin onboarding) | POST | Bearer token sin perfil | Body válido | 403 — `PROFILE_INCOMPLETE` |
| 2.1.4 | Crear fact con contenido muy corto (< 10) | POST | Bearer token | `content: "corto"` | 400 — validación |
| 2.1.5 | Crear fact con contenido muy largo (> 200) | POST | Bearer token | `content` > 200 chars | 400 — validación |
| 2.1.6 | Crear fact sin title | POST | Bearer token | Falta `title` | 400 — validación |
| 2.1.7 | Crear fact con title duplicado (同一 autor) | POST | Bearer token | Title igual a uno existente del mismo autor | 201 (título no es único a nivel DB) |

```bash
# 2.1.1 Crear fact exitoso
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Honey Facts", "content": "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible."}'

# 2.1.2 Crear fact sin token
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -d '{"title": "Honey Facts", "content": "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible."}'

# 2.1.3 Crear fact sin perfil (auth sin onboarding)
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Test Fact", "content": "This is a test fact with valid content length."}'

# 2.1.4 Crear fact con contenido muy corto (< 10)
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Short Content", "content": "corto"}'

# 2.1.5 Crear fact con contenido muy largo (> 200)
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Long Content Fact", "content": "This is a very long content that exceeds two hundred characters limit which is the maximum allowed for a fact content in this API. We need to make it really long to test the validation that should reject content over 200 characters. So lets add more text here to ensure it exceeds the limit."}'

# 2.1.6 Crear fact sin title
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"content": "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible."}'

# 2.1.7 Crear fact con title duplicado
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Honey Facts", "content": "Duplicate title test with valid content length."}'
```

### 2.2 Listar Facts (paginación y ordenamiento)

| # | Caso | Método | Auth | Query Params | Esperado |
|---|------|--------|------|-------------|----------|
| 2.2.1 | Listar facts sin params (defaults) | GET | No | ninguno | 200 — page=1, limit=20, ordenados por createdAt desc |
| 2.2.2 | Paginar página 1, limit 5 | GET | No | `?page=1&limit=5` | 200 — max 5 items, `nextPage` si hay más |
| 2.2.3 | Paginar página 2 | GET | No | `?page=2&limit=5` | 200 — items siguientes |
| 2.2.4 | Última página (nextPage=null) | GET | No | `?page=999&limit=1000` | 200 — `nextPage: null` |
| 2.2.5 | Ordenar por createdAt asc (oldest first) | GET | No | `?order_by=createdAt&order_dir=asc` | 200 — ordenado ascendente |
| 2.2.6 | Ordenar por likesCount desc | GET | No | `?order_by=likesCount&order_dir=desc` | 200 — más liked primero |
| 2.2.7 | limit=0 (invalido) | GET | No | `?limit=0` | 400 — validación |
| 2.2.8 | limit negativo | GET | No | `?limit=-5` | 400 — validación |
| 2.2.9 | page=0 inválido | GET | No | `?page=0` | 400 — validación |
| 2.2.10 | order_dir inválido | GET | No | `?order_dir=invalid` | 400 — validación |
| 2.2.11 | order_by con valor inválido | GET | No | `?order_by=invalidField` | 400 — validación |

```bash
# 2.2.1 Listar facts sin params (defaults)
curl -X GET http://localhost:3009/facts

# 2.2.2 Paginar página 1, limit 5
curl -X GET 'http://localhost:3009/facts?page=1&limit=5'

# 2.2.3 Paginar página 2
curl -X GET 'http://localhost:3009/facts?page=2&limit=5'

# 2.2.4 Última página (nextPage=null)
curl -X GET 'http://localhost:3009/facts?page=999&limit=1000'

# 2.2.5 Ordenar por createdAt asc (oldest first)
curl -X GET 'http://localhost:3009/facts?order_by=createdAt&order_dir=asc'

# 2.2.6 Ordenar por likesCount desc
curl -X GET 'http://localhost:3009/facts?order_by=likesCount&order_dir=desc'

# 2.2.7 limit=0 (invalido)
curl -X GET 'http://localhost:3009/facts?limit=0'

# 2.2.8 limit negativo
curl -X GET 'http://localhost:3009/facts?limit=-5'

# 2.2.9 page=0 inválido
curl -X GET 'http://localhost:3009/facts?page=0'

# 2.2.10 order_dir inválido
curl -X GET 'http://localhost:3009/facts?order_dir=invalid'

# 2.2.11 order_by con valor inválido
curl -X GET 'http://localhost:3009/facts?order_by=invalidField'
```

### 2.3 Filtrar Facts

| # | Caso | Método | Auth | Query Params | Esperado |
|---|------|--------|------|-------------|----------|
| 2.3.1 | Filtrar por title__like | GET | No | `?title__like=honey` | 200 — facts cuyo title contiene "honey" |
| 2.3.2 | Filtrar por content__like | GET | No | `?content__like=archaeolog` | 200 — facts con "archaeolog" en contenido |
| 2.3.3 | Filtrar por authorId__eq | GET | No | `?authorId__eq={{testUserId}}` | 200 — solo facts del autor |
| 2.3.4 | Filtrar por createdAt__gte | GET | No | `?createdAt__gte=2024-01-01` | 200 — facts desde esa fecha |
| 2.3.5 | Filtrar por createdAt__lte | GET | No | `?createdAt__lte=2024-12-31` | 200 — facts hasta esa fecha |
| 2.3.6 | Filtrar por rango de fechas | GET | No | `?createdAt__between=2024-01-01,2024-06-30` | 200 — facts en rango |
| 2.3.7 | Filtrar con id__in | GET | No | `?id__in=id1,id2,id3` | 200 — facts con esos IDs |
| 2.3.8 | Combinar filtro + paginación + orden | GET | No | `?title__like=honey&order_by=likesCount&page=1&limit=5` | 200 — filtrado + ordenado + paginado |
| 2.3.9 | Filtro sin resultados | GET | No | `?title__like=zzznoseencuentra999` | 200 — `results: []`, `nextPage: null` |
| 2.3.10 | Filter operation inválido | GET | No | `?title__invalidop=value` | Ignorado (no se aplica filtro inválido, returns 200) |

```bash
# 2.3.1 Filtrar por title__like
curl -X GET 'http://localhost:3009/facts?title__like=honey'

# 2.3.2 Filtrar por content__like
curl -X GET 'http://localhost:3009/facts?content__like=archaeolog'

# 2.3.3 Filtrar por authorId__eq
curl -X GET 'http://localhost:3009/facts?authorId__eq={{testUserId}}'

# 2.3.4 Filtrar por createdAt__gte
curl -X GET 'http://localhost:3009/facts?createdAt__gte=2024-01-01'

# 2.3.5 Filtrar por createdAt__lte
curl -X GET 'http://localhost:3009/facts?createdAt__lte=2024-12-31'

# 2.3.6 Filtrar por rango de fechas
curl -X GET 'http://localhost:3009/facts?createdAt__between=2024-01-01,2024-06-30'

# 2.3.7 Filtrar con id__in
curl -X GET 'http://localhost:3009/facts?id__in=id1,id2,id3'

# 2.3.8 Combinar filtro + paginación + orden
curl -X GET 'http://localhost:3009/facts?title__like=honey&order_by=likesCount&page=1&limit=5'

# 2.3.9 Filtro sin resultados
curl -X GET 'http://localhost:3009/facts?title__like=zzznoseencuentra999'

# 2.3.10 Filter operation inválido
curl -X GET 'http://localhost:3009/facts?title__invalidop=value'
```

### 2.4 Facts Popular

| # | Caso | Método | Auth | Query Params | Esperado |
|---|------|--------|------|-------------|----------|
| 2.4.1 | Listar popular sin params | GET | No | ninguno | 200 — ordenado por likesCount desc |
| 2.4.2 | Popular con paginación | GET | No | `?page=1&limit=5` | 200 — top 5 |
| 2.4.3 | Popular filtrado por title | GET | No | `?title__like= honey` | 200 — popular y filtrado |
| 2.4.4 | Popular ordenado por createdAt | GET | No | `?order_by=createdAt&order_dir=desc` | 200 — cambia criterio de orden |

```bash
# 2.4.1 Listar popular sin params
curl -X GET http://localhost:3009/facts/popular

# 2.4.2 Popular con paginación
curl -X GET 'http://localhost:3009/facts/popular?page=1&limit=5'

# 2.4.3 Popular filtrado por title
curl -X GET 'http://localhost:3009/facts/popular?title__like=honey'

# 2.4.4 Popular ordenado por createdAt
curl -X GET 'http://localhost:3009/facts/popular?order_by=createdAt&order_dir=desc'
```

### 2.5 Obtener Fact por ID

| # | Caso | Método | Auth | Params | Esperado |
|---|------|--------|------|--------|----------|
| 2.5.1 | Obtener fact existente | GET | No | ID válido | 200 — `{ id, title, content, author, likesCount, createdAt }` |
| 2.5.2 | Obtener fact inexistente | GET | No | ID inexistente | 404 — RFC 9457 error |
| 2.5.3 | Obtener fact con ID malformado | GET | No | ID inválido (ej: "abc") | 400 — validación |

```bash
# 2.5.1 Obtener fact existente
curl -X GET http://localhost:3009/facts/{{testFactId}}

# 2.5.2 Obtener fact inexistente
curl -X GET http://localhost:3009/facts/00000000-0000-0000-0000-000000000000

# 2.5.3 Obtener fact con ID malformado
curl -X GET http://localhost:3009/facts/abc
```

### 2.6 Facts por Autor

| # | Caso | Método | Auth | Params | Esperado |
|---|------|--------|------|--------|----------|
| 2.6.1 | Listar facts de un autor | GET | No | authorId válido | 200 — lista de facts del autor |
| 2.6.2 | Autor sin facts | GET | No | authorId sin facts | 200 — `results: []` |
| 2.6.3 | Autor inexistente | GET | No | authorId no existe en BD | 200 — `results: []` (no 404) |

```bash
# 2.6.1 Listar facts de un autor
curl -X GET http://localhost:3009/facts/author/{{testUserId}}

# 2.6.2 Autor sin facts
curl -X GET http://localhost:3009/facts/author/00000000-0000-0000-0000-000000000001

# 2.6.3 Autor inexistente
curl -X GET http://localhost:3009/facts/author/00000000-0000-0000-0000-000000000999
```

### 2.7 Actualizar Fact

| # | Caso | Método | Auth | Body | Esperado |
|---|------|--------|------|------|----------|
| 2.7.1 | Actualizar propio fact exitoso | PUT | Bearer (autor) | `title`, `content` válidos | 200 — fact actualizada |
| 2.7.2 | Actualizar sin token | PUT | No | Body válido | 401 — RFC 9457 error |
| 2.7.3 | Actualizar fact ajena (no autor) | PUT | Bearer (otro user) | Body válido | 403 — `FORBIDDEN` |
| 2.7.4 | Actualizar fact inexistente | PUT | Bearer token | Body válido | 404 — RFC 9457 error |
| 2.7.5 | Actualizar con contenido corto | PUT | Bearer (autor) | `content: "corto"` | 400 — validación |
| 2.7.6 | Actualizar solo title (parcial) | PUT | Bearer (autor) | Solo `title` | 200 — title actualizado |

```bash
# 2.7.1 Actualizar propio fact exitoso
curl -X PUT http://localhost:3009/facts/{{testFactId}} \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Updated Honey Facts", "content": "Updated content that is definitely longer than ten characters."}'

# 2.7.2 Actualizar sin token
curl -X PUT http://localhost:3009/facts/{{testFactId}} \
  -H 'Content-Type: application/json' \
  -d '{"title": "Updated Honey Facts", "content": "Updated content that is definitely longer than ten characters."}'

# 2.7.3 Actualizar fact ajena (no autor)
curl -X PUT http://localhost:3009/facts/{{testFactId}} \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Hacked Title", "content": "Hacked content that is definitely longer than ten characters."}'

# 2.7.4 Actualizar fact inexistente
curl -X PUT http://localhost:3009/facts/00000000-0000-0000-0000-000000000000 \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Updated Title", "content": "Updated content that is definitely longer than ten characters."}'

# 2.7.5 Actualizar con contenido corto
curl -X PUT http://localhost:3009/facts/{{testFactId}} \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Short Content", "content": "corto"}'

# 2.7.6 Actualizar solo title (parcial)
curl -X PUT http://localhost:3009/facts/{{testFactId}} \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "New Title Only"}'
```

### 2.8 Eliminar Fact

| # | Caso | Método | Auth | Params | Esperado |
|---|------|--------|------|--------|----------|
| 2.8.1 | Eliminar propio fact exitoso | DELETE | Bearer (autor) | ID válido | 204 — sin contenido |
| 2.8.2 | Eliminar sin token | DELETE | No | ID válido | 401 — RFC 9457 error |
| 2.8.3 | Eliminar fact ajena | DELETE | Bearer (no autor) | ID válido | 403 — `FORBIDDEN` |
| 2.8.4 | Eliminar fact inexistente | DELETE | Bearer token | ID no existe | 404 — RFC 9457 error |

```bash
# 2.8.1 Eliminar propio fact exitoso
curl -X DELETE http://localhost:3009/facts/{{testFactId}} \
  -H 'Authorization: Bearer {{token}}'

# 2.8.2 Eliminar sin token
curl -X DELETE http://localhost:3009/facts/{{testFactId}}

# 2.8.3 Eliminar fact ajena
curl -X DELETE http://localhost:3009/facts/{{testFactId}} \
  -H 'Authorization: Bearer {{token}}'

# 2.8.4 Eliminar fact inexistente
curl -X DELETE http://localhost:3009/facts/00000000-0000-0000-0000-000000000000 \
  -H 'Authorization: Bearer {{token}}'
```

---

## 3. Likes

### 3.1 Dar / Quitar Like

| # | Caso | Método | Auth | Params | Esperado |
|---|------|--------|------|--------|----------|
| 3.1.1 | Dar like a fact exitoso | POST | Bearer token | factId válido | 201 — `{ id, userId, factId, createdAt }` |
| 3.1.2 | Dar like sin token | POST | No | factId válido | 401 — RFC 9457 error |
| 3.1.3 | Dar like a fact inexistente | POST | Bearer token | factId inexistente | 404 — RFC 9457 error |
| 3.1.4 | Dar like dos veces (ya existe) | POST | Bearer token | Mismo factId | 409 — `LIKE_ALREADY_EXISTS` |
| 3.1.5 | Quitar like exitoso | DELETE | Bearer token | factId con like existente | 204 — sin contenido |
| 3.1.6 | Quitar like sin token | DELETE | No | factId válido | 401 — RFC 9457 error |
| 3.1.7 | Quitar like que no existe | DELETE | Bearer token | factId sin like | 404 — `LIKE_NOT_FOUND` |
| 3.1.8 | Quitar like de fact inexistente | DELETE | Bearer token | factId inexistente | 404 — RFC 9457 error |

```bash
# 3.1.1 Dar like a fact exitoso
curl -X POST http://localhost:3009/facts/{{testFactId}}/likes \
  -H 'Authorization: Bearer {{token}}'

# 3.1.2 Dar like sin token
curl -X POST http://localhost:3009/facts/{{testFactId}}/likes

# 3.1.3 Dar like a fact inexistente
curl -X POST http://localhost:3009/facts/00000000-0000-0000-0000-000000000000/likes \
  -H 'Authorization: Bearer {{token}}'

# 3.1.4 Dar like dos veces (ya existe)
curl -X POST http://localhost:3009/facts/{{testFactId}}/likes \
  -H 'Authorization: Bearer {{token}}'

# 3.1.5 Quitar like exitoso
curl -X DELETE http://localhost:3009/facts/{{testFactId}}/likes \
  -H 'Authorization: Bearer {{token}}'

# 3.1.6 Quitar like sin token
curl -X DELETE http://localhost:3009/facts/{{testFactId}}/likes

# 3.1.7 Quitar like que no existe
curl -X DELETE http://localhost:3009/facts/{{testFactId}}/likes \
  -H 'Authorization: Bearer {{token}}'

# 3.1.8 Quitar like de fact inexistente
curl -X DELETE http://localhost:3009/facts/00000000-0000-0000-0000-000000000000/likes \
  -H 'Authorization: Bearer {{token}}'
```

### 3.2 Listar Likes de un Fact

| # | Caso | Método | Auth | Query Params | Esperado |
|---|------|--------|------|-------------|----------|
| 3.2.1 | Listar likes de fact sin paginar | GET | No | ninguno | 200 — page=1, limit=20, ordenados por createdAt desc |
| 3.2.2 | Listar likes con paginación | GET | No | `?page=1&limit=5` | 200 — max 5 likes |
| 3.2.3 | Listar likes orden ascendente | GET | No | `?order_dir=asc` | 200 — oldest likes primero |
| 3.2.4 | Listar likes de fact sin likes | GET | No | factId sin likes | 200 — `results: []` |
| 3.2.5 | Listar likes de fact inexistente | GET | No | factId inexistente | 200 — `results: []` (sin 404, es un findMany) |

```bash
# 3.2.1 Listar likes de fact sin paginar
curl -X GET http://localhost:3009/facts/{{testFactId}}/likes

# 3.2.2 Listar likes con paginación
curl -X GET 'http://localhost:3009/facts/{{testFactId}}/likes?page=1&limit=5'

# 3.2.3 Listar likes orden ascendente
curl -X GET 'http://localhost:3009/facts/{{testFactId}}/likes?order_dir=asc'

# 3.2.4 Listar likes de fact sin likes
curl -X GET http://localhost:3009/facts/{{testFactId}}/likes

# 3.2.5 Listar likes de fact inexistente
curl -X GET http://localhost:3009/facts/00000000-0000-0000-0000-000000000000/likes
```

### 3.3 Listar Likes de un Usuario

| # | Caso | Método | Auth | Query Params | Esperado |
|---|------|--------|------|-------------|----------|
| 3.3.1 | Listar likes de usuario sin paginar | GET | No | ninguno | 200 — page=1, limit=20 |
| 3.3.2 | Listar likes de usuario con paginación | GET | No | `?page=2&limit=10` | 200 — página 2 |
| 3.3.3 | Listar likes de usuario sin likes | GET | No | userId sin likes | 200 — `results: []` |
| 3.3.4 | Listar likes de usuario inexistente | GET | No | userId no existe | 200 — `results: []` |

```bash
# 3.3.1 Listar likes de usuario sin paginar
curl -X GET http://localhost:3009/users/{{testUserId}}/likes

# 3.3.2 Listar likes de usuario con paginación
curl -X GET 'http://localhost:3009/users/{{testUserId}}/likes?page=2&limit=10'

# 3.3.3 Listar likes de usuario sin likes
curl -X GET http://localhost:3009/users/00000000-0000-0000-0000-000000000001/likes

# 3.3.4 Listar likes de usuario inexistente
curl -X GET http://localhost:3009/users/00000000-0000-0000-0000-000000000999/likes
```

---

## 4. Users

| # | Caso | Método | Auth | Params | Esperado |
|---|------|--------|------|--------|----------|
| 4.1 | Ver perfil público por username | GET | No | username válido | 200 — `{ username, displayName, avatarUrl, createdAt }` |
| 4.2 | Ver perfil de username inexistente | GET | No | username no existe | 404 — RFC 9457 error |
| 4.3 | Ver perfil público no expone email | GET | No | username válido | 200 — email NO incluido en respuesta |

```bash
# 4.1 Ver perfil público por username
curl -X GET http://localhost:3009/users/johndoe

# 4.2 Ver perfil de username inexistente
curl -X GET http://localhost:3009/users/nonexistentuser999

# 4.3 Ver perfil público no expone email
curl -X GET http://localhost:3009/users/johndoe
```

---

## 5. Errores RFC 9457

Todos los errores de la API siguen el formato RFC 9457 (Problem Details). Probar que cada error devuelva:

```json
{
  "type": "<uri>",
  "title": "<short description>",
  "status": <http status code>,
  "detail": "<long description>",
  "error_code": "<APP_ERROR_CODE>",
  "category": "<category>",
  "instance": "<request path>",
  "trace_id": "<uuid>",
  "timestamp": "<ISO8601>"
}
```

| # | Escenario | Endpoint | Esperado | error_code |
|---|-----------|----------|----------|------------|
| 5.1 | Token inválido | Cualquier endpoint protegido | 401 | `UNAUTHORIZED` |
| 5.2 | Token expirado | Cualquier endpoint protegido | 401 | `UNAUTHORIZED` |
| 5.3 | Sin token en endpoint protegido | Cualquier protegido | 401 | `UNAUTHORIZED` |
| 5.4 | Perfil incompleto | POST /facts | 403 | `PROFILE_INCOMPLETE` |
| 5.5 | No es autor del fact | PUT /facts/:id | 403 | `FORBIDDEN` |
| 5.6 | No es autor del fact | DELETE /facts/:id | 403 | `FORBIDDEN` |
| 5.7 | Recurso no encontrado | GET /facts/:id inexistente | 404 | `RESOURCE_NOT_FOUND` |
| 5.8 | Like ya existe | POST /facts/:id/likes | 409 | `LIKE_ALREADY_EXISTS` |
| 5.9 | Like no existe | DELETE /facts/:id/likes | 404 | `LIKE_NOT_FOUND` |
| 5.10 | Username duplicado | POST /auth/profile | 409 | `USERNAME_TAKEN` |
| 5.11 | Validación fallida body | POST /facts | 400 | `VALIDATION_ERROR` |
| 5.12 | Param inválido | GET /facts?limit=-1 | 400 | `VALIDATION_ERROR` |
| 5.13 | Error interno | Forzar 500 (con test bypass) | 500 | `INTERNAL_ERROR` |
| 5.14 | type siempre es URI canónica | Cualquier error | — | `type` apunta a docs |
| 5.15 | instance es la ruta de la request | Cualquier error | — | `instance` = request path |
| 5.16 | trace_id presente y es UUID válido | Cualquier error | — | UUID v4 |
| 5.17 | timestamp es ISO8601 válido | Cualquier error | — | ISO8601 |

```bash
# 5.1 Token inválido (ejemplo con endpoint GET /auth/me)
curl -X GET http://localhost:3009/auth/me \
  -H 'Authorization: Bearer invalid-token-here'

# 5.2 Token expirado (ejemplo - usar token ya expirado)
curl -X GET http://localhost:3009/auth/me \
  -H 'Authorization: Bearer expired-token-here'

# 5.3 Sin token en endpoint protegido
curl -X GET http://localhost:3009/auth/me

# 5.4 Perfil incompleto (crear fact sin perfil)
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Test Fact", "content": "Test content that is long enough."}'

# 5.5 No es autor del fact (PUT)
curl -X PUT http://localhost:3009/facts/{{testFactId}} \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Hacked Title", "content": "Hacked content that is definitely longer than ten characters."}'

# 5.6 No es autor del fact (DELETE)
curl -X DELETE http://localhost:3009/facts/{{testFactId}} \
  -H 'Authorization: Bearer {{token}}'

# 5.7 Recurso no encontrado
curl -X GET http://localhost:3009/facts/00000000-0000-0000-0000-000000000000

# 5.8 Like ya existe
curl -X POST http://localhost:3009/facts/{{testFactId}}/likes \
  -H 'Authorization: Bearer {{token}}'

# 5.9 Like no existe
curl -X DELETE http://localhost:3009/facts/{{testFactId}}/likes \
  -H 'Authorization: Bearer {{token}}'

# 5.10 Username duplicado
curl -X POST http://localhost:3009/auth/profile \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"username": "johndoe", "displayName": "John Doe Duplicate", "avatarUrl": "https://example.com/avatar.png"}'

# 5.11 Validación fallida body
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Test"}'

# 5.12 Param inválido
curl -X GET 'http://localhost:3009/facts?limit=-1'

# 5.13 Error interno (requiere bypass mechanism si existe)
curl -X GET http://localhost:3009/internal/test-error

# 5.14-5.17 Verificar estructura RFC 9457 en cualquier respuesta de error
curl -X GET http://localhost:3009/facts/invalid-id
```

---

## 6. Matriz de Permisos

| Endpoint | Anónimo | Auth sin perfil | Auth con perfil | Autor | Admin |
|----------|---------|-----------------|-----------------|-------|-------|
| `GET /facts` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /facts/popular` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /facts/:id` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /facts/author/:id` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `POST /facts` | ❌ 401 | ❌ 403 | ✅ 201 | ✅ 201 | ✅ 201 |
| `PUT /facts/:id` | ❌ 401 | ❌ 401 | ❌ 403 | ✅ 200 | ✅ 200 |
| `DELETE /facts/:id` | ❌ 401 | ❌ 401 | ❌ 403 | ✅ 204 | ✅ 204 |
| `POST /facts/:id/likes` | ❌ 401 | ✅ 201 | ✅ 201 | ✅ 201 | ✅ 201 |
| `DELETE /facts/:id/likes` | ❌ 401 | ✅ 204 | ✅ 204 | ✅ 204 | ✅ 204 |
| `GET /facts/:id/likes` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /users/:username` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /users/:id/likes` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `POST /auth/profile` | ❌ 401 | ✅ 201 | ❌ 409 | ✅ 201 | ✅ 201 |
| `GET /auth/me` | ❌ 401 | ❌ 401 | ✅ 200 | ✅ 200 | ✅ 200 |
| `PATCH /auth/me` | ❌ 401 | ❌ 401 | ✅ 200 | ✅ 200 | ✅ 200 |

```bash
# Matriz de Permisos - Ejemplos de cada caso

# Anónimo - GET /facts
curl -X GET http://localhost:3009/facts

# Auth sin perfil - POST /facts (espera 403)
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Test", "content": "Test content that is long enough."}'

# Auth con perfil - POST /facts (espera 201)
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Test Fact", "content": "Test content that is definitely longer than ten characters."}'

# Autor - PUT /facts/:id (espera 200)
curl -X PUT http://localhost:3009/facts/{{testFactId}} \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Updated", "content": "Updated content that is definitely longer than ten characters."}'

# Autor - DELETE /facts/:id (espera 204)
curl -X DELETE http://localhost:3009/facts/{{testFactId}} \
  -H 'Authorization: Bearer {{token}}'
```

**Notas:**
- "Autor" = usuario autenticado que es el creador del fact
- "Admin" = no implementado aún (mismo rol que usuario autenticado con perfil)
- Auth sin perfil: token válido pero no completó onboarding → 403 `PROFILE_INCOMPLETE`

---

## 7. Flujo Completo de Testing (E2E)

Secuencia recomendada para probar el flujo completo de un usuario:

```
1. POST /auth/dev-login         → Obtener token → guardar en {{token}}
2. GET /auth/me                 → Verificar perfil incompleto (403)
3. POST /auth/profile           → Crear perfil  → {{testUserId}} se setea
4. GET /auth/me                 → Verificar perfil completo (200)
5. POST /facts                  → Crear fact    → {{testFactId}} se setea
6. GET /facts                   → Listar facts (200)
7. GET /facts/{{testFactId}}    → Ver fact creado (200)
8. POST /facts/{{testFactId}}/likes  → Dar like (201)
9. GET /facts/{{testFactId}}/likes  → Ver likes del fact (200)
10. GET /facts/popular          → Ver facts popular (200)
11. GET /facts?title__like=honey → Filtrar facts (200)
12. DELETE /facts/{{testFactId}}/likes → Quitar like (204)
13. PUT /facts/{{testFactId}}    → Actualizar fact (200)
14. DELETE /facts/{{testFactId}}  → Eliminar fact (204)
15. GET /users/:username        → Ver perfil público (200)
```

```bash
# Flujo Completo E2E

# 1. Dev Login
curl -X POST http://localhost:3009/auth/dev-login \
  -H 'Content-Type: application/json' \
  -d '{"secret": "tu-dev-secret-aqui", "email": "test@example.com", "password": "test-password"}'

# 2. Verificar perfil incompleto (403)
curl -X GET http://localhost:3009/auth/me \
  -H 'Authorization: Bearer {{token}}'

# 3. Crear perfil
curl -X POST http://localhost:3009/auth/profile \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"username": "johndoe", "displayName": "John Doe", "avatarUrl": "https://example.com/avatar.png"}'

# 4. Verificar perfil completo (200)
curl -X GET http://localhost:3009/auth/me \
  -H 'Authorization: Bearer {{token}}'

# 5. Crear fact
curl -X POST http://localhost:3009/facts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Honey Facts", "content": "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible."}'

# 6. Listar facts
curl -X GET http://localhost:3009/facts

# 7. Ver fact creado
curl -X GET http://localhost:3009/facts/{{testFactId}}

# 8. Dar like
curl -X POST http://localhost:3009/facts/{{testFactId}}/likes \
  -H 'Authorization: Bearer {{token}}'

# 9. Ver likes del fact
curl -X GET http://localhost:3009/facts/{{testFactId}}/likes

# 10. Ver facts popular
curl -X GET http://localhost:3009/facts/popular

# 11. Filtrar facts
curl -X GET 'http://localhost:3009/facts?title__like=honey'

# 12. Quitar like
curl -X DELETE http://localhost:3009/facts/{{testFactId}}/likes \
  -H 'Authorization: Bearer {{token}}'

# 13. Actualizar fact
curl -X PUT http://localhost:3009/facts/{{testFactId}} \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {{token}}' \
  -d '{"title": "Updated Honey Facts", "content": "Updated content that is definitely longer than ten characters."}'

# 14. Eliminar fact
curl -X DELETE http://localhost:3009/facts/{{testFactId}} \
  -H 'Authorization: Bearer {{token}}'

# 15. Ver perfil público
curl -X GET http://localhost:3009/users/johndoe
```

---

## 8. Notas y Gotchas

- **Token Firebase:** `POST /auth/dev-login` devuelve un token JWT que expira. Si los tests fallan por 401, re-ejecutar dev-login.
- **IDs de prueba:** La colección usa variables `{{testFactId}}` y `{{testUserId}}` que se setear automáticamente al crear resources. Si caducan, recreate los recursos.
- **Filtros sin resultados:** Los endpoints de listado NUNCA devuelven 404 — si no hay resultados, devuelven 200 con `results: []`.
- **orden por likesCount:** Solo disponible en `GET /facts` y `GET /facts/popular`. En `GET /facts/:id/likes` y `GET /users/:id/likes` solo `order_by=createdAt`.
- **Operación `like`:** Se traduce a `ILIKE` en PostgreSQL (case-insensitive). El valor se trata como substring, no como regex.
- **Operación `between`:** El formato es `?field__between=valor1,valor2` (coma separada, sin espacios).
- **Operación `in`:** El formato es `?field__in=val1,val2,val3` (coma separada).
- **Username único a nivel global**, no por usuario.
- **Likes y facts de authors inexistentes** devuelven array vacío, no 404 — es un comportamiento de findMany, no de findUnique.

(End of file - total 965 lines)
