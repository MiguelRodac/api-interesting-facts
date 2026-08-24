# Frontend Integration Spec — Reposts, Feed, Engagement

> **Fecha:** 2026-08-24
> **Backend branch:** main (11 commits ahead of origin)
> **Status:** Listo para push — esperando señal del frontend

---

## 1. Cambios en el Feed (`GET /facts`)

El feed ahora mezcla facts y reposts. Cada entrada tiene un `type` discriminator.

### `type: "fact"` — sin cambios

```typescript
{
  type: "fact",
  fact: FactResponse,  // misma estructura de antes
  createdAt: string
}
```

### `type: "repost"` — NUEVA ESTRUCTURA

```typescript
{
  type: "repost",
  repost: {
    id: string,              // UUID del repost
    factId: string,          // UUID del fact original
    author: {                // author del fact ORIGINAL
      id: string,
      username: string,
      displayName: string,
      avatarUrl: string | null,
      avatarColor: string | null
    },
    title: string | null,    // titulo del fact original
    content: string,          // contenido del fact original
    hashtags: HashtagPreview[],
    repostCount: number,      // reposts del fact original
    repostedBy: {             // quien lo reposteó
      username: string,
      displayName: string,
      avatarUrl: string | null,
      avatarColor: string | null,
      isMe: boolean
    },
    repostLikeCount: number,       // likes AL repost
    repostCommentCount: number,    // comments AL repost
    repostCommentsDetails: CommentPreview | null,  // primer comment del repost
    createdAt: string              // cuando se hizo el repost
  },
  createdAt: string  // = repost.createdAt
}
```

---

## 2. IDs — QUÉ USAR PARA CADA ACCIÓN

| Acción | Endpoint | ID a usar |
|--------|----------|-----------|
| Like al repost | `POST /reposts/:repostId/likes` | `repost.id` |
| Unlike al repost | `DELETE /reposts/:repostId/likes` | `repost.id` |
| Comment al repost | `POST /reposts/:repostId/comments` | `repost.id` |
| Repostear el fact original | `POST /facts/:factId/reposts` | `repost.factId` |
| Like al fact original | `POST /facts/:factId/likes` | `fact.id` (en type:"fact") |
| Ver fact original | `GET /facts/:factId` | `repost.factId` |

**Regla simple:**
- `repost.id` → para todo lo que sea interactuar CON el repost
- `repost.factId` → para repostear el fact original de nuevo

---

## 3. CAMBIOS EN EL FRONTEND

### 3.1 Quitar composite ID

**Antes (hack):**
```typescript
const compositeId = `${factId}-repost-${username}`
```

**Ahora:**
```typescript
// El backend ya manda el ID único del repost
const repostId = entry.repost.id
```

### 3.2 Navegación

**Antes:**
```typescript
router.push(`/fact/${originalFactId}`)
```

**Ahora:**
```typescript
// Para ver el repost
router.push(`/repost/${entry.repost.id}`)

// Para ver el fact original
router.push(`/fact/${entry.repost.factId}`)
```

### 3.3 Like/Comment en reposts

**Antes:** No existía
**Ahora:**
```typescript
// Like al repost
await api.post(`/reposts/${entry.repost.id}/likes`)

// Comment al repost
await api.post(`/reposts/${entry.repost.id}/comments`, { content: "..." })
```

### 3.4 Repostear desde un repost card

**Antes:** No existía
**Ahora:**
```typescript
// Repostear el fact ORIGINAL (no el repost)
await api.post(`/facts/${entry.repost.factId}/reposts`)
```

---

## 4. NUEVOS ENDPOINTS

### Reposts

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| `POST` | `/facts/:factId/reposts` | ✅ | — | `Repost` |
| `DELETE` | `/facts/:factId/reposts` | ✅ | — | 204 |
| `GET` | `/facts/:factId/reposts` | ✅ | — | `{ results: Repost[], ... }` |

### Repost Likes

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| `POST` | `/reposts/:repostId/likes` | ✅ | — | `Like` |
| `DELETE` | `/reposts/:repostId/likes` | ✅ | — | 204 |
| `GET` | `/reposts/:repostId/likes` | ✅ | — | `{ results: Like[], ... }` |

### Repost Comments

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| `POST` | `/reposts/:repostId/comments` | ✅ | `{ content, parentCommentId? }` | `Comment` |
| `GET` | `/reposts/:repostId/comments` | ✅ | — | `{ results: Comment[], ... }` |

### Search

| Method | Path | Auth | Query | Response |
|--------|------|------|-------|----------|
| `GET` | `/search` | ✅ | `q, order_by?, order_dir?, page?, limit?` | `{ users, facts, hashtags, page, limit, hasMore }` |

### User Facts + Reposts

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/users/:username/facts` | None | `{ results: FeedEntry[], ... }` |

> Retorna facts Y reposts del usuario (mixed feed).

---

## 5. TIPOS TYPESCRIPT (para copiar)

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

interface RepostResponse {
  id: string
  factId: string
  author: FactAuthorPreview
  title: string | null
  content: string
  hashtags: HashtagPreview[]
  repostCount: number
  repostedBy: {
    username: string
    displayName: string
    avatarUrl: string | null
    avatarColor: string | null
    isMe: boolean
  }
  repostLikeCount: number
  repostCommentCount: number
  repostCommentsDetails: CommentPreview | null
  createdAt: string
}

type FeedEntry =
  | { type: 'fact', fact: FactResponse, createdAt: string }
  | { type: 'repost', repost: RepostResponse, createdAt: string }
```

---

## 6. VALIDACIONES

- `POST /reposts/:repostId/likes` — no duplicados (409 si ya tiene like)
- `POST /facts/:factId/reposts` — no puedes repostear tu propio fact (400)
- `POST /facts/:factId/reposts` — no duplicados (409)
- `POST /reposts/:repostId/comments` — content required, min 10 chars, max 1000
- `POST /facts/:factId/comments` — content required, min 10 chars, max 1000
- Todos los endpoints de reposts requieren auth + profile completo

---

## 7. PENDIENTES FUTUROS

- `repostCommentsDetails` viene con el primer comment del repost (ya funcionando)
- `repostCommentsDetails` puede venir `null` si no hay comments
- Feed batch optimizado: ~10 queries por request (antes ~30)
- 2 índices compuestos nuevos en PostgreSQL para performance
