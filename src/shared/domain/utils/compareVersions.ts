/**
 * Compare two semver strings (e.g. "1.3.0" vs "1.2.5").
 * Returns:
 *   -1 if a < b
 *    0 if a === b
 *    1 if a > b
 *
 * Non-numeric segments are compared lexicographically.
 * Missing segments default to 0 (e.g. "1.2" === "1.2.0").
 */
export function compareVersions (a: string, b: string): -1 | 0 | 1 {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)

  const len = Math.max(pa.length, pb.length)

  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0

    if (na < nb) return -1
    if (na > nb) return 1
  }

  return 0
}
