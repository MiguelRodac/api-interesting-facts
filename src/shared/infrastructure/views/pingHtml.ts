/**
 * Ping page HTML — rendered when a browser hits /ping
 * Visual status page: striking but says just enough.
 */

export interface PingData {
  dbOk: boolean
  uptimeSeconds: number
  baseUrl: string
  version: string
}

export function renderPingHtml (data: PingData): string {
  const {
    dbOk,
    uptimeSeconds,
    baseUrl,
    version
  } = data

  const statusColor = dbOk ? '#34d399' : '#fb7185'
  const statusText = dbOk ? 'Operational' : 'Degraded'
  const statusMessage = dbOk
    ? 'Everything is running smoothly'
    : 'Hold tight — the database is unreachable'

  const uptimeHuman = formatUptime(uptimeSeconds)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>Interesting Facts — Status</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      background:
        radial-gradient(900px 500px at 15% 10%, ${statusColor}14 0%, transparent 60%),
        radial-gradient(900px 500px at 85% 90%, #3b82f614 0%, transparent 60%),
        #0b0f1a;
      color: #e2e8f0;
    }
    .card {
      position: relative;
      width: 100%; max-width: 460px;
      background: rgba(17, 25, 40, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 28px;
      padding: 40px;
      overflow: hidden;
      backdrop-filter: blur(14px);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
    }
    /* soft top sheen */
    .card::before {
      content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, ${statusColor}, transparent);
    }
    .head { display: flex; align-items: center; gap: 14px; margin-bottom: 30px; }
    .duck {
      width: 56px; height: 56px; border-radius: 16px;
      background: linear-gradient(135deg, #1e3a8a, #0f172a);
      border: 1px solid rgba(148,163,184,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 30px;
      animation: float 3.4s ease-in-out infinite;
    }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .title { font-size: 18px; font-weight: 650; letter-spacing: 0.1px; }
    .title small { display: block; color: #64748b; font-size: 12px; font-weight: 400; margin-top: 2px; }
    .ring {
      position: relative;
      width: 132px; height: 132px; margin: 6px auto 0;
      display: flex; align-items: center; justify-content: center;
    }
    .ring::before {
      content: ""; position: absolute; inset: 0; border-radius: 50%;
      border: 3px solid ${statusColor}22;
      border-top-color: ${statusColor};
      border-right-color: ${statusColor};
      animation: spin 2.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ring-inner {
      position: relative;
      width: 98px; height: 98px; border-radius: 50%;
      background: #0f172a;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 26px ${statusColor}22;
    }
    .ring-check { font-size: 40px; line-height: 1; }
    .ring-label { text-align: center; margin-top: 20px; }
    .ring-label .txt { font-size: 19px; font-weight: 700; color: ${statusColor}; }
    .ring-label .hint { color: #94a3b8; font-size: 13px; margin-top: 4px; }
    .footer {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 32px; padding-top: 22px;
      border-top: 1px solid rgba(148,163,184,0.12);
    }
    .uptime .k { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
    .uptime .v { font-size: 17px; font-weight: 650; margin-top: 2px; }
    .docs-btn {
      text-decoration: none; color: #fff;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      padding: 11px 20px; border-radius: 12px; font-size: 13.5px; font-weight: 600;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.38);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .docs-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(37,99,235,0.5); }
    .foot-note { text-align: center; color: #475569; font-size: 11px; margin-top: 18px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="head">
      <div class="duck">🦆</div>
      <div class="title">Interesting Facts<small>v${version} · API status</small></div>
    </div>

    <div class="ring">
      <div class="ring-inner">
        <span class="ring-check">${dbOk ? '✓' : '!'}</span>
      </div>
    </div>

    <div class="ring-label">
      <div class="txt">${statusText}</div>
      <div class="hint">${statusMessage}</div>
    </div>

    <div class="footer">
      <div class="uptime">
        <div class="k">Uptime</div>
        <div class="v">${uptimeHuman}</div>
      </div>
      <a class="docs-btn" href="${baseUrl}/api/docs">Documentation →</a>
    </div>

    <div class="foot-note">API Interesting Facts</div>
  </div>
</body>
</html>`
}

function formatUptime (seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || parts.length === 0) parts.push(`${s}s`)
  return parts.join(' ')
}
