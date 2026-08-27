import { type CacheStatus } from '../cache/versionCache'

/**
 * Ping page HTML — rendered when a browser hits /ping
 * Visual status page: striking but says just enough.
 */

export interface PingData {
  dbOk: boolean
  uptimeSeconds: number
  baseUrl: string
  version: string
  cacheStatus?: CacheStatus
}

export function renderPingHtml (data: PingData): string {
  const {
    dbOk,
    uptimeSeconds,
    baseUrl,
    version,
    cacheStatus
  } = data

  const statusColor = dbOk ? '#34d399' : '#fb7185'
  const statusText = dbOk ? 'Operational' : 'Degraded'
  const statusMessage = dbOk
    ? 'Everything is running smoothly'
    : 'Hold tight — the database is unreachable'

  const uptimeHuman = formatUptime(uptimeSeconds)
  const versions = cacheStatus?.versions ?? []
  const initialChips = versions.length > 0
    ? versions.map(v => `<div class="chip"><span class="plat">${v.platform}</span><span class="ver">min v${v.minVersion}</span></div>`).join('')
    : '<div class="chip"><span class="plat">all</span><span class="ver">fallback</span></div>'

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
      width: 100%; max-width: 480px;
      background: rgba(17, 25, 40, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 28px;
      padding: 36px;
      overflow: hidden;
      backdrop-filter: blur(14px);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
    }
    /* soft top sheen */
    .card::before {
      content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, ${statusColor}, transparent);
    }
    .head { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
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
      width: 120px; height: 120px; margin: 4px auto 0;
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
      width: 88px; height: 88px; border-radius: 50%;
      background: #0f172a;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 26px ${statusColor}22;
    }
    .ring-check { font-size: 36px; line-height: 1; }
    .ring-label { text-align: center; margin-top: 16px; margin-bottom: 24px; }
    .ring-label .txt { font-size: 19px; font-weight: 700; color: ${statusColor}; }
    .ring-label .hint { color: #94a3b8; font-size: 13px; margin-top: 4px; }

    /* Version control box */
    .version-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.12);
      border-radius: 16px;
      padding: 16px;
      margin-top: 18px;
    }
    .vbox-head {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .vbox-title {
      font-size: 12px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.08em; color: #94a3b8;
    }
    .refresh-btn {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      font-size: 12px; font-weight: 600;
      padding: 4px 12px; border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .refresh-btn:hover {
      background: rgba(59, 130, 246, 0.28);
      border-color: #60a5fa;
      color: #93c5fd;
    }
    .refresh-btn:disabled {
      opacity: 0.5; cursor: not-allowed;
    }
    .chips-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 8px; padding: 4px 10px; font-size: 12px;
    }
    .chip .plat {
      font-weight: 700; color: #38bdf8; text-transform: uppercase; font-size: 10px;
      background: rgba(56, 189, 248, 0.12); padding: 2px 6px; border-radius: 4px;
    }
    .chip .ver { color: #cbd5e1; font-family: monospace; font-size: 11px; }
    .refresh-feedback {
      font-size: 11px; margin-top: 8px; min-height: 14px; transition: all 0.2s;
    }

    .footer {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 24px; padding-top: 18px;
      border-top: 1px solid rgba(148,163,184,0.12);
    }
    .uptime .k { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
    .uptime .v { font-size: 16px; font-weight: 650; margin-top: 2px; }
    .docs-btn {
      text-decoration: none; color: #fff;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 600;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.38);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .docs-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(37,99,235,0.5); }
    .foot-note { text-align: center; color: #475569; font-size: 11px; margin-top: 16px; }
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

    <div class="version-box">
      <div class="vbox-head">
        <span class="vbox-title">Allowed App Versions</span>
        <button id="refreshBtn" class="refresh-btn" onclick="triggerRefresh()">↻ Refresh Cache</button>
      </div>
      <div id="chipsContainer" class="chips-row">
        ${initialChips}
      </div>
      <div id="refreshFeedback" class="refresh-feedback"></div>
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

  <script>
    async function triggerRefresh() {
      const btn = document.getElementById('refreshBtn');
      const feedback = document.getElementById('refreshFeedback');
      const container = document.getElementById('chipsContainer');
      
      btn.disabled = true;
      btn.innerText = 'Refreshing...';
      feedback.style.color = '#94a3b8';
      feedback.innerText = 'Querying database...';

      try {
        const res = await fetch('/ping/refresh-versions', { method: 'POST' });
        const data = await res.json();
        
        if (res.ok && data.status === 'ok') {
          feedback.style.color = '#34d399';
          feedback.innerText = '✓ Cache refreshed successfully from ' + data.cache.source;
          
          if (data.cache.versions && data.cache.versions.length > 0) {
            container.innerHTML = data.cache.versions.map(v => 
              '<div class="chip"><span class="plat">' + v.platform + '</span><span class="ver">min v' + v.minVersion + '</span></div>'
            ).join('');
          }
        } else {
          feedback.style.color = '#fb7185';
          feedback.innerText = '✕ Failed to refresh cache: ' + (data.message || 'Unknown error');
        }
      } catch (err) {
        feedback.style.color = '#fb7185';
        feedback.innerText = '✕ Network error while contacting server';
      } finally {
        btn.disabled = false;
        btn.innerText = '↻ Refresh Cache';
        setTimeout(() => {
          if (feedback) feedback.innerText = '';
        }, 5000);
      }
    }
  </script>
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
