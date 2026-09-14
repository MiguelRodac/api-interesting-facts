import { sanitizeUnicode } from '@shared/domain/utils/unicode'

describe('sanitizeUnicode', () => {
  it('should return regular ASCII strings unchanged', () => {
    const input = 'Hello World!'
    expect(sanitizeUnicode(input)).toBe(input)
  })

  it('should preserve valid multi-byte Unicode and standard emojis', () => {
    const input = 'Interesting fact about 🚀 space and 💡 science! ¿Cómo estás? Ñandú.'
    expect(sanitizeUnicode(input)).toBe(input)
  })

  it('should repair broken lone surrogates without crashing', () => {
    // Lone high surrogate \ud83e followed by normal emoji 🤔 (\ud83e\udd14) followed by lone low surrogate \udd14
    const brokenInput = 'Ajustar facts \ud83e\ud83e\udd14\udd14'
    const sanitized = sanitizeUnicode(brokenInput)

    expect(sanitized).toBeDefined()
    expect((sanitized as unknown as { isWellFormed: () => boolean }).isWellFormed()).toBe(true)
    // The lone surrogates should be replaced by replacement character U+FFFD (\uFFFD)
    expect(sanitized).toBe('Ajustar facts \uFFFD🤔\uFFFD')
  })

  it('should handle single lone high surrogate', () => {
    const input = 'Broken \ud83d'
    const sanitized = sanitizeUnicode(input)
    expect((sanitized as unknown as { isWellFormed: () => boolean }).isWellFormed()).toBe(true)
    expect(sanitized).toBe('Broken \uFFFD')
  })

  it('should handle single lone low surrogate', () => {
    const input = 'Broken \ude00'
    const sanitized = sanitizeUnicode(input)
    expect((sanitized as unknown as { isWellFormed: () => boolean }).isWellFormed()).toBe(true)
    expect(sanitized).toBe('Broken \uFFFD')
  })
})
