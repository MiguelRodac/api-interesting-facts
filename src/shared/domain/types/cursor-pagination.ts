export interface CursorPayload {
  createdAt: Date
  id: string
}

export interface CursorQueryParams {
  cursor?: string
  limit?: number
}

export interface ResultWithCursor<T> {
  results: T[]
  limit: number
  nextCursor: string | null
  hasMore: boolean
}

export function encodeCursor (payload: CursorPayload): string {
  const data = {
    createdAt: payload.createdAt.toISOString(),
    id: payload.id
  }
  return Buffer.from(JSON.stringify(data)).toString('base64url')
}

export function decodeCursor (cursorStr?: string): CursorPayload | null {
  if (cursorStr == null || cursorStr.trim() === '') return null
  try {
    const raw = Buffer.from(cursorStr, 'base64url').toString('utf8')
    const parsed = JSON.parse(raw)
    if (parsed == null || typeof parsed !== 'object') return null
    if (typeof parsed.id !== 'string' || typeof parsed.createdAt !== 'string') return null

    const createdAt = new Date(parsed.createdAt)
    if (isNaN(createdAt.getTime())) return null

    return {
      createdAt,
      id: parsed.id
    }
  } catch {
    return null
  }
}
