/**
 * Duck favicon served at /favicon.svg.
 * Kept inline (not read from disk) so it ships inside the compiled JS
 * build — `tsc` does not copy SVG assets to the output directory.
 */
export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f172a"/>
  <text x="32" y="44" font-size="34" text-anchor="middle" dy="0.35em">🦆</text>
</svg>
`
