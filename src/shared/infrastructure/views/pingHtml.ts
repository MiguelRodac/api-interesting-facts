/**
 * Ping page HTML — rendered when a browser hits /ping
 */

export interface PingData {
  dbOk: boolean
  uptimeSeconds: number
  timestamp: string
  baseUrl: string
  version: string
}

export function renderPingHtml (data: PingData): string {
  const { dbOk, uptimeSeconds, timestamp, baseUrl, version } = data
  const statusColor = dbOk ? '#22c55e' : '#ef4444'
  const dbColor = dbOk ? '#22c55e' : '#ef4444'
  const statusText = dbOk ? 'OK' : 'DEGRADED'
  const statusBadge = dbOk ? 'All systems operational' : 'Database unreachable'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Interesting Facts — Alive</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .logo { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .version { color: #64748b; font-size: 14px; margin-bottom: 32px; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: ${statusColor}22;
      border: 1px solid ${statusColor};
      color: ${statusColor};
      padding: 8px 20px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 32px;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
      text-align: left;
    }
    .metric {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
    }
    .metric-label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .metric-value { font-size: 20px; font-weight: 600; }
    .docs-btn {
      display: inline-block;
      background: #3b82f6;
      color: #fff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      transition: background 0.2s;
    }
    .docs-btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🦆</div>
    <h1>API Interesting Facts</h1>
    <p class="version">v${version}</p>

    <div class="status-badge">
      <span class="dot"></span>
      ${statusBadge}
    </div>

    <div class="grid">
      <div class="metric">
        <div class="metric-label">Status</div>
        <div class="metric-value" style="color: ${statusColor}">${statusText}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Uptime</div>
        <div class="metric-value">${uptimeSeconds}s</div>
      </div>
      <div class="metric">
        <div class="metric-label">Database</div>
        <div class="metric-value" style="color: ${dbColor}">${dbOk ? 'Connected' : 'Error'}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Timestamp</div>
        <div class="metric-value" style="font-size: 14px">${timestamp}</div>
      </div>
    </div>

    <a href="${baseUrl}/api/docs" class="docs-btn">📖 Open API Documentation</a>
  </div>
</body>
</html>`
}
