# Frontend Integration Spec — Reposts, Feed, Engagement, Versioning

> **Fecha:** 2026-08-26
> **Backend branch:** main
> **Status:** Pusheado a origin/main

---

## 1. Cambios en el Feed (`GET /facts`)

El feed mezcla facts y reposts. Cada entrada tiene un `type` discriminator.

### `type: "fact"`

```typescript
{
  type: "fact",
  fact: FactResponse,
  createdAt: string
}
```

### `type: "repost"`

```typescript
{
  type: "repost",
  repost: {
    id: string,              // UUID del repost
    factId: string,          // UUID del fact original
    author: FactAuthorPreview, // author del fact ORIGINAL
    title: string | null,
    content: string,
    hashtags: HashtagPreview[],
    repostCount: number,           // reposts del fact original
    repostedBy: {                  // quien lo reposteó
      username: string,
      displayName: string,
      avatarUrl: string | null,
      avatarColor: string | null,
      isMe: boolean
    },
    repostLikeCount: number,       // likes AL repost
    liked?: boolean,               // NUEVO: viewer dio like al repost? (con token)
    likeBy: UserAvatarPreview[],   // NUEVO: hasta 3 usuarios recientes
    repostCommentCount: number,    // comments AL repost
    repostCommentsDetails: CommentPreview | null,
    createdAt: string
  },
  createdAt: string
}
```

**`likeBy` (facts y reposts):** devuelve hasta **3** usuarios recientes. Todos traen `avatarUrl`/`avatarColor`; solo el **último** trae `username`.

---

## 2. IDs — QUÉ USAR PARA CADA ACCIÓN

| Acción | Endpoint | ID a usar |
|--------|----------|-----------|
| Like al repost | `POST /reposts/:repostId/likes` | `repost.id` |
| Unlike al repost | `DELETE /reposts/:repostId/likes` | `repost.id` |
| Comment al repost | `POST /reposts/:repostId/comments` | `repost.id` |
| Like a comment de repost | `POST /reposts/:repostId/comments/:commentId/likes` | `repost.id` + `comment.id` |
| Repost detail | `GET /reposts/:repostId` | `repost.id` |
| Repostear el fact original | `POST /facts/:factId/reposts` | `repost.factId` |
| Like al fact original | `POST /facts/:factId/likes` | `fact.id` (en type:"fact") |
| Ver fact original | `GET /facts/:factId` | `repost.factId` |

**Regla simple:**
- `repost.id` → para todo lo que sea interactuar CON el repost
- `repost.factId` → para repostear el fact original de nuevo

---

## 3. SEARCH (`GET /facts/search`) — ⚠️ CAMBIO DE FORMATO

El shape de la respuesta depende del prefijo del query:

### `@mention` y texto plano → campo `results` (FeedEntry[])

```json
{
  "users": [UserSearchResult],
  "results": [
    { "type": "fact", "fact": { }, "createdAt": "..." },
    { "type": "repost", "repost": { }, "createdAt": "..." }
  ],
  "hashtags": [],
  "page": 1, "limit": 100, "hasMore": false
}
```

- Ahora incluye **reposts** de los autores matcheados (además de facts)
- Facts y reposts vienen con enriquecimiento completo
- El campo se llama **`results`**, NO `facts`

### `#hashtag` → formato legacy (sin cambios)

```json
{
  "users": [],
  "facts": [FactResponse],
  "hashtags": [HashtagWithUsage],
  "page": 1, "limit": 100, "hasMore": false
}
```

---

## 4. USER LIKES (`GET /users/:userId/likes`) — ⚠️ CAMBIO DE FORMATO

Devuelve un feed enriquecido de TODO lo que el usuario likeó (facts + reposts), ordenado por fecha de like:

```json
{
  "results": [
    { "type": "fact", "fact": { }, "createdAt": "<fecha del LIKE>" },
    { "type": "repost", "repost": { }, "createdAt": "<fecha del LIKE>" }
  ],
  "page": 1, "limit": 20, "nextPage": null
}
```

- Ya NO devuelve la lista plana de likes con `factId`
- Auth **opcional** — sin token, `liked`/`repostedByMe` vienen indefinidos
- El `createdAt` de cada entry es la fecha **del like**, no del post

---

## 5. NUEVOS ENDPOINTS

### Repost Detail

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/reposts/:repostId` | Optional | `RepostResponse` completo |

### Comment Likes (facts Y reposts)

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| `POST` | `/facts/:factId/comments/:commentId/likes` | ✅ | — | `CommentLike` (201) |
| `DELETE` | `/facts/:factId/comments/:commentId/likes` | ✅ | — | 204 |
| `GET` | `/facts/:factId/comments/:commentId/likes` | ✅ | — | `{ results: LikePreview[], ... }` |
| `POST` | `/reposts/:repostId/comments/:commentId/likes` | ✅ | — | `CommentLike` (201) |
| `DELETE` | `/reposts/:repostId/comments/:commentId/likes` | ✅ | — | 204 |
| `GET` | `/reposts/:repostId/comments/:commentId/likes` | ✅ | — | `{ results: LikePreview[], ... }` |

```typescript
interface CommentLike {
  id: string
  userId: string
  commentId: string
  factId: string | null     // null si es comment de repost
  repostId: string | null   // null si es comment de fact
  createdAt: string
}
```

---

## 6. BUG FIXES EN COMMENTS

- `POST /reposts/:repostId/comments` — ahora guarda `repostId` en DB y el response trae `author` con datos reales (antes venía `username: ""`)
- `POST /facts/:factId/comments` — mismo fix de author

---

## 7. VERSIONING — HEADER OBLIGATORIO

Enviar en **todas** las requests:

```
X-App-Version: 1.2.0
```

| Status | error_code | Cuándo |
|--------|-----------|--------|
| `400` | `APP_VERSION_MISSING` | Falta el header y el backend está en modo strict |
| `426` | `APP_VERSION_OUTDATED` | La versión es vieja — forzar actualización |

**Importante:** el backend NUNCA revela la versión mínima soportada (seguridad). Ante 426, mostrar UI de "actualizar app" genérica.

---

## 8. TIPOS TYPESCRIPT (para copiar)

```typescript
interface FactAuthorPreview {
  id: string
  username: string
  email: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
}

interface HashtagPreview {
  id: string
  tag: string
}

interface UserAvatarPreview {
  username: string
  avatarUrl: string | null
  avatarColor: string | null
}

interface CommentPreview {
  id: string
  content: string
  author: UserAvatarPreview
  parentCommentId: string | null
  replies: number
  createdAt: string
}

interface FactResponse {
  id: string
  author: FactAuthorPreview
  title: string | null
  content: string
  likes: number
  liked?: boolean
  likeBy: UserAvatarPreview[]
  comments: number
  commentsDetails: CommentPreview | null
  repostCount: number
  repostedByMe?: boolean
  repostBy: UserAvatarPreview[]
  hashtags: HashtagPreview[]
  createdAt: string
  updatedAt: string
}

interface RepostedBy {
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
  isMe: boolean
}

interface RepostResponse {
  id: string
  factId: string
  author: FactAuthorPreview
  title: string | null
  content: string
  hashtags: HashtagPreview[]
  repostCount: number
  repostedBy: RepostedBy
  repostLikeCount: number
  liked?: boolean
  likeBy: UserAvatarPreview[]
  repostCommentCount: number
  repostCommentsDetails: CommentPreview | null
  createdAt: string
}

type FeedEntry =
  | { type: 'fact', fact: FactResponse, createdAt: string }
  | { type: 'repost', repost: RepostResponse, createdAt: string }

interface PaginatedFeed {
  results: FeedEntry[]
  page: number
  limit: number
  nextPage: number | null
}
```

---

## 9. VALIDACIONES

- `POST /reposts/:repostId/likes` — no duplicados (409 si ya tiene like)
- `POST /facts/:factId/reposts` — no puedes repostear tu propio fact (400), no duplicados (409)
- Comments — content required, min 10 chars, max 1000
- Comment likes — no duplicados (409); el comment debe pertenecer al fact/repost de la URL (404 si no)

---

## 10. CHECKLIST FRONTEND

- [ ] Enviar header `X-App-Version` en todas las requests (interceptor HTTP)
- [ ] Manejar 426 → pantalla "actualiza la app"
- [ ] Manejar 400 APP_VERSION_MISSING (solo si strict mode activo)
- [ ] `/users/:id/likes` → renderizar FeedEntry[] en vez de lista de likes
- [ ] `/facts/search` @ y plain → leer `results` en vez de `facts`
- [ ] Mostrar `likeBy` (hasta 3 avatares) en facts y reposts
- [ ] Like a comments de reposts vía nuevos endpoints
- [ ] Usar `GET /reposts/:repostId` para la vista de detalle de repost
