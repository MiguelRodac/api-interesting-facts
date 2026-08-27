/**
 * Ping page HTML — rendered when a browser hits /ping
 * Visual status page + Secure Admin Modal for Version Management.
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
<html lang="es">
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
      background: rgba(17, 25, 40, 0.75);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 28px;
      padding: 36px;
      overflow: hidden;
      backdrop-filter: blur(16px);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
    }
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

    /* Admin Action Button */
    .admin-bar {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
    .btn-admin-open {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.2);
      color: #94a3b8;
      font-size: 12px; font-weight: 600;
      padding: 8px 16px; border-radius: 12px;
      cursor: pointer;
      display: inline-flex; align-items: center; gap: 8px;
      transition: all 0.2s ease;
    }
    .btn-admin-open:hover {
      background: rgba(59, 130, 246, 0.15);
      border-color: #3b82f6;
      color: #60a5fa;
      transform: translateY(-1px);
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

    /* Modal Backdrop & Container */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(11, 15, 26, 0.85);
      backdrop-filter: blur(12px);
      display: none; align-items: center; justify-content: center;
      padding: 20px; z-index: 1000;
      animation: fadeIn 0.2s ease-out forwards;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-card {
      width: 100%; max-width: 520px;
      background: #0f172a;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.8);
      position: relative;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; padding-bottom: 12px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }
    .modal-header h3 { font-size: 16px; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 8px; }
    .btn-close {
      background: transparent; border: none; color: #94a3b8;
      font-size: 22px; cursor: pointer; line-height: 1;
      padding: 4px 8px; border-radius: 6px;
    }
    .btn-close:hover { color: #f8fafc; background: rgba(255,255,255,0.08); }

    /* Login Form in Modal */
    .auth-box { text-align: center; padding: 10px 0; }
    .auth-box p { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
    .auth-input-group { display: flex; gap: 8px; margin-bottom: 12px; }
    .auth-input {
      flex: 1; background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px; padding: 10px 14px;
      color: #fff; font-size: 14px; outline: none;
      transition: border-color 0.2s;
    }
    .auth-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
    .btn-primary {
      background: #3b82f6; color: #fff; border: none;
      border-radius: 10px; padding: 10px 18px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: background 0.15s;
    }
    .btn-primary:hover { background: #2563eb; }
    .auth-msg { font-size: 12px; min-height: 18px; }

    /* Dashboard Console in Modal */
    .console-box { display: none; }
    .session-bar {
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(30, 41, 59, 0.4);
      padding: 8px 12px; border-radius: 10px; margin-bottom: 18px;
      border: 1px solid rgba(148, 163, 184, 0.1);
    }
    .session-badge { font-size: 12px; color: #34d399; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .btn-logout {
      background: transparent; border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171; font-size: 11px; font-weight: 600;
      padding: 3px 8px; border-radius: 6px; cursor: pointer;
    }
    .btn-logout:hover { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }

    .actions-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px;
    }
    .action-btn {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.18);
      color: #e2e8f0; font-size: 12px; font-weight: 600;
      padding: 12px 14px; border-radius: 12px; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      transition: all 0.15s; text-align: center;
    }
    .action-btn:hover {
      background: rgba(59, 130, 246, 0.15); border-color: #3b82f6; color: #60a5fa;
    }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-btn .icon { font-size: 18px; }

    /* Results Viewer */
    .results-card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 14px; padding: 16px;
    }
    .results-meta {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px; font-size: 11px; color: #94a3b8;
    }
    .chips-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 8px; padding: 6px 12px; font-size: 12px;
    }
    .chip .plat {
      font-weight: 700; color: #38bdf8; text-transform: uppercase; font-size: 10px;
      background: rgba(56, 189, 248, 0.12); padding: 2px 6px; border-radius: 4px;
    }
    .chip .ver { color: #cbd5e1; font-family: monospace; font-size: 11px; }
    .console-feedback {
      font-size: 12px; margin-top: 10px; min-height: 16px; text-align: center;
    }
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

    <div class="admin-bar">
      <button class="btn-admin-open" onclick="openAdminModal()">
        <span>🔒</span> Consola de Versiones
      </button>
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

  <!-- Admin Modal -->
  <div id="adminModal" class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <h3>🔒 Consola de Versiones</h3>
        <button class="btn-close" onclick="closeAdminModal()">×</button>
      </div>

      <!-- View 1: Login Form -->
      <div id="authSection" class="auth-box">
        <p>Ingresá el <strong>ADMIN_API_KEY</strong> para ver o refrescar las versiones permitidas.</p>
        <form onsubmit="handleLogin(event)">
          <div class="auth-input-group">
            <input type="password" id="adminKeyInput" class="auth-input" placeholder="Admin API Key" autocomplete="off" required>
            <button type="submit" class="btn-primary">Ingresar</button>
          </div>
        </form>
        <div id="authMsg" class="auth-msg"></div>
      </div>

      <!-- View 2: Dashboard Console -->
      <div id="consoleSection" class="console-box">
        <div class="session-bar">
          <span class="session-badge">● Sesión Autorizada</span>
          <button class="btn-logout" onclick="handleLogout()">Cerrar Sesión</button>
        </div>

        <div class="actions-grid">
          <button id="btnViewVersions" class="action-btn" onclick="fetchVersionInfo()">
            <span class="icon">👁️</span>
            <span>Ver Versiones</span>
          </button>
          <button id="btnRefreshVersions" class="action-btn" onclick="triggerRefresh()">
            <span class="icon">↻</span>
            <span>Refrescar Caché</span>
          </button>
        </div>

        <div class="results-card">
          <div class="results-meta">
            <span id="resultsSource">Fuente: —</span>
            <span id="resultsTtl">TTL: —</span>
          </div>
          <div id="chipsContainer" class="chips-grid">
            <span style="color:#64748b; font-size:12px;">Hacé clic en una opción para consultar.</span>
          </div>
        </div>
        <div id="consoleFeedback" class="console-feedback"></div>
      </div>
    </div>
  </div>

  <script>
    const modal = document.getElementById('adminModal');
    const authSection = document.getElementById('authSection');
    const consoleSection = document.getElementById('consoleSection');
    const adminKeyInput = document.getElementById('adminKeyInput');
    const authMsg = document.getElementById('authMsg');
    const consoleFeedback = document.getElementById('consoleFeedback');
    const chipsContainer = document.getElementById('chipsContainer');
    const resultsSource = document.getElementById('resultsSource');
    const resultsTtl = document.getElementById('resultsTtl');

    // Strict volatile memory — NEVER saved to sessionStorage or localStorage
    let currentAdminKey = '';

    function openAdminModal() {
      modal.style.display = 'flex';
      showLogin();
    }

    function closeAdminModal() {
      modal.style.display = 'none';
      // Wipe key from memory immediately on close
      currentAdminKey = '';
      if (adminKeyInput) adminKeyInput.value = '';
      if (authMsg) authMsg.innerText = '';
      if (consoleFeedback) consoleFeedback.innerText = '';
      chipsContainer.innerHTML = '<span style="color:#64748b; font-size:12px;">Hacé clic en una opción para consultar.</span>';
      resultsSource.innerText = 'Fuente: —';
      resultsTtl.innerText = 'TTL: —';
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAdminModal();
    });

    function showLogin() {
      authSection.style.display = 'block';
      consoleSection.style.display = 'none';
      adminKeyInput.value = '';
      adminKeyInput.focus();
    }

    function showConsole() {
      authSection.style.display = 'none';
      consoleSection.style.display = 'block';
    }

    async function handleLogin(e) {
      if (e) e.preventDefault();
      const key = adminKeyInput.value.trim();
      if (!key) return;

      authMsg.style.color = '#94a3b8';
      authMsg.innerText = 'Verificando clave...';

      try {
        const res = await fetch('/ping/version-info', {
          headers: { 'x-admin-key': key }
        });
        const data = await res.json();

        if (res.ok && data.status === 'ok') {
          currentAdminKey = key;
          adminKeyInput.value = '';
          authMsg.innerText = '';
          showConsole();
          renderVersionsData(data.cache);
        } else {
          authMsg.style.color = '#fb7185';
          authMsg.innerText = '✕ ' + (data.message || 'Clave de administrador incorrecta');
        }
      } catch (err) {
        authMsg.style.color = '#fb7185';
        authMsg.innerText = '✕ Error de red al contactar al servidor';
      }
    }

    function handleLogout() {
      currentAdminKey = '';
      chipsContainer.innerHTML = '<span style="color:#64748b; font-size:12px;">Hacé clic en una opción para consultar.</span>';
      resultsSource.innerText = 'Fuente: —';
      resultsTtl.innerText = 'TTL: —';
      consoleFeedback.innerText = '';
      showLogin();
    }

    async function fetchVersionInfo() {
      if (!currentAdminKey) { showLogin(); return; }

      const btn = document.getElementById('btnViewVersions');
      btn.disabled = true;
      consoleFeedback.style.color = '#94a3b8';
      consoleFeedback.innerText = 'Consultando estado del caché...';

      try {
        const res = await fetch('/ping/version-info', {
          headers: { 'x-admin-key': currentAdminKey }
        });
        const data = await res.json();

        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }

        if (res.ok && data.status === 'ok') {
          renderVersionsData(data.cache);
          consoleFeedback.style.color = '#34d399';
          consoleFeedback.innerText = '✓ Información de versiones cargada';
        } else {
          consoleFeedback.style.color = '#fb7185';
          consoleFeedback.innerText = '✕ ' + (data.message || 'Error al obtener versiones');
        }
      } catch (err) {
        consoleFeedback.style.color = '#fb7185';
        consoleFeedback.innerText = '✕ Error de conexión';
      } finally {
        btn.disabled = false;
        setTimeout(() => { if (consoleFeedback) consoleFeedback.innerText = ''; }, 4000);
      }
    }

    async function triggerRefresh() {
      if (!currentAdminKey) { showLogin(); return; }

      const btn = document.getElementById('btnRefreshVersions');
      btn.disabled = true;
      consoleFeedback.style.color = '#94a3b8';
      consoleFeedback.innerText = 'Refrescando desde la base de datos...';

      try {
        const res = await fetch('/ping/refresh-versions', {
          method: 'POST',
          headers: { 'x-admin-key': currentAdminKey }
        });
        const data = await res.json();

        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }

        if (res.ok && data.status === 'ok') {
          renderVersionsData(data.cache);
          consoleFeedback.style.color = '#34d399';
          consoleFeedback.innerText = '✓ Caché refrescado exitosamente desde ' + data.cache.source;
        } else {
          consoleFeedback.style.color = '#fb7185';
          consoleFeedback.innerText = '✕ ' + (data.message || 'Error al refrescar caché');
        }
      } catch (err) {
        consoleFeedback.style.color = '#fb7185';
        consoleFeedback.innerText = '✕ Error de conexión';
      } finally {
        btn.disabled = false;
        setTimeout(() => { if (consoleFeedback) consoleFeedback.innerText = ''; }, 4000);
      }
    }


    function renderVersionsData(cache) {
      if (!cache) return;
      resultsSource.innerText = 'Fuente: ' + (cache.source === 'database' ? '🗄️ Base de Datos' : '⚙️ Env Fallback');
      resultsTtl.innerText = 'TTL: ' + cache.ttlHours + 'h';

      if (cache.versions && cache.versions.length > 0) {
        chipsContainer.innerHTML = cache.versions.map(v => 
          '<div class="chip">' +
            '<span class="plat">' + v.platform + '</span>' +
            '<span class="ver">min v' + v.minVersion + '</span>' +
            (v.recommendedVersion ? '<span class="ver" style="color:#94a3b8;">(rec v' + v.recommendedVersion + ')</span>' : '') +
          '</div>'
        ).join('');
      } else {
        chipsContainer.innerHTML = '<span style="color:#f87171; font-size:12px;">No hay versiones registradas.</span>';
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
