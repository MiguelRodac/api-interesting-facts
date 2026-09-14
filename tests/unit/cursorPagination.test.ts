import { encodeCursor, decodeCursor } from '@shared/domain/types/cursor-pagination'

describe('cursor-pagination', () => {
  describe('encodeCursor and decodeCursor roundtrip', () => {
    it('should correctly encode and decode a valid CursorPayload', () => {
      const now = new Date('2026-09-14T15:00:00.000Z')
      const id = 'fact-uuid-1234'

      const encoded = encodeCursor({ createdAt: now, id })
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)

      const decoded = decodeCursor(encoded)
      expect(decoded).not.toBeNull()
      expect(decoded?.createdAt.getTime()).toBe(now.getTime())
      expect(decoded?.id).toBe(id)
    })
  })

  describe('decodeCursor invalid inputs', () => {
    it('should return null for undefined, empty or whitespace strings', () => {
      expect(decodeCursor(undefined)).toBeNull()
      expect(decodeCursor('')).toBeNull()
      expect(decodeCursor('   ')).toBeNull()
    })

    it('should return null for non-JSON Base64 strings', () => {
      const nonJson = Buffer.from('just a random string').toString('base64url')
      expect(decodeCursor(nonJson)).toBeNull()
    })

    it('should return null for JSON without required properties', () => {
      const missingId = Buffer.from(JSON.stringify({ createdAt: new Date().toISOString() })).toString('base64url')
      expect(decodeCursor(missingId)).toBeNull()

      const missingCreatedAt = Buffer.from(JSON.stringify({ id: 'uuid' })).toString('base64url')
      expect(decodeCursor(missingCreatedAt)).toBeNull()
    })

    it('should return null for invalid date string', () => {
      const invalidDate = Buffer.from(JSON.stringify({ createdAt: 'invalid-date', id: 'uuid' })).toString('base64url')
      expect(decodeCursor(invalidDate)).toBeNull()
    })
  })
})
