import { paginationSchema, uuidSchema, sortOrderSchema } from '../../src/shared/infrastructure/validation/schemas'
import { validateMentions, USERNAME_PATTERN, EMAIL_PATTERN } from '../../src/shared/domain/validation'
import { ValidationError } from '../../src/shared/domain/errors/ValidationError'

describe('Validation Schemas & Utilities (Unit)', () => {
  describe('paginationSchema', () => {
    it('should use default values when omitted', () => {
      const result = paginationSchema.parse({})
      expect(result).toEqual({ page: 1, limit: 20 })
    })

    it('should coerce string numbers into positive integers', () => {
      const result = paginationSchema.parse({ page: '3', limit: '25' })
      expect(result).toEqual({ page: 3, limit: 25 })
    })

    it('should reject non-positive page numbers', () => {
      expect(() => paginationSchema.parse({ page: 0 })).toThrow()
      expect(() => paginationSchema.parse({ page: -1 })).toThrow()
    })

    it('should reject limits exceeding maximum allowed (100)', () => {
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow()
    })
  })

  describe('uuidSchema', () => {
    it('should accept valid UUIDs', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(uuidSchema.parse(validUuid)).toBe(validUuid)
    })

    it('should reject malformed or non-UUID strings', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow('Invalid UUID format')
      expect(() => uuidSchema.parse('12345')).toThrow('Invalid UUID format')
    })
  })

  describe('sortOrderSchema', () => {
    it('should default to asc', () => {
      expect(sortOrderSchema.parse(undefined)).toBe('asc')
    })

    it('should accept desc', () => {
      expect(sortOrderSchema.parse('desc')).toBe('desc')
    })

    it('should reject unrecognized sort values', () => {
      expect(() => sortOrderSchema.parse('random')).toThrow()
    })
  })

  describe('validateMentions', () => {
    it('should allow valid mentions', () => {
      expect(() => validateMentions('Hello @valid_user and @john.doe!')).not.toThrow()
    })

    it('should throw ValidationError when mention username is too short (<3 chars)', () => {
      expect(() => validateMentions('Hello @ab')).toThrow(ValidationError)
    })

    it('should throw ValidationError when mention username exceeds 30 characters', () => {
      const longUsername = 'a'.repeat(31)
      expect(() => validateMentions(`Hello @${longUsername}`)).toThrow(ValidationError)
    })
  })

  describe('Regex Patterns', () => {
    it('should validate usernames against USERNAME_PATTERN', () => {
      expect(USERNAME_PATTERN.test('alice')).toBe(true)
      expect(USERNAME_PATTERN.test('john_doe.99')).toBe(true)
      expect(USERNAME_PATTERN.test('ab')).toBe(false) // too short
      expect(USERNAME_PATTERN.test('user@invalid')).toBe(false)
    })

    it('should validate email addresses against EMAIL_PATTERN', () => {
      expect(EMAIL_PATTERN.test('user@example.com')).toBe(true)
      expect(EMAIL_PATTERN.test('user.name+tag@sub.domain.co')).toBe(true)
      expect(EMAIL_PATTERN.test('invalid-email')).toBe(false)
      expect(EMAIL_PATTERN.test('@missinguser.com')).toBe(false)
    })
  })
})
