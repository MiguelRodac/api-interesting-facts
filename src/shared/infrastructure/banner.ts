/**
 * Welcome banner rendered on server startup.
 * The box width auto-fits its longest line so the version can change
 * without breaking the ASCII alignment (emojis make manual padding fragile).
 */
export function renderBanner (version: string): string {
  // The duck emoji is a spacer on the title line; keep it out of the
  // width math so the box stays pixel-symmetric.
  const lines = [
    '     🦆  API Interesting Facts            ',
    '',
    '     by Miguel Rodac                      ',
    `     Version ${version}                        `
  ]
  const width = Math.max(...lines.map(l => [...l].length))
  const frame = (line: string): string => `║${line.padEnd(width, ' ')}║`
  const top = `╔${'═'.repeat(width)}╗`
  const bottom = `╚${'═'.repeat(width)}╝`

  return [top, ...lines.map(frame), bottom].join('\n')
}
