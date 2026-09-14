/**
 * Safely sanitizes a string to ensure well-formed UTF-16 / Unicode.
 * Replaces lone / unpaired surrogates with U+FFFD to avoid database encoding and engine crashes.
 */
export function sanitizeUnicode (input: string): string {
  const str = input as unknown as { toWellFormed?: () => string }
  if (typeof str.toWellFormed === 'function') {
    return str.toWellFormed()
  }
  return input.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD')
}
