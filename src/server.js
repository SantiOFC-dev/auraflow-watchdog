const http = require('node:http');
const { checkAllTargets } = require('./healthChecker');
const { runBackup, listBackups } = require('./backupManager');

const PORT = Number(process.env.PORT) || 3090;

function renderDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AuraFlow Watchdog</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #090d16; color: #e2e8f0; margin: 0; padding: 24px; }
    .wrap { max-width: 960px; margin: 0 auto; }
    h1 { font-size: 1.4rem; margin-bottom: 4px; color: #38bdf8; }
    p.sub { color: #94a3b8; margin-top: 0; font-size: 0.9rem; }
    .actions { display: flex; gap: 10px; margin: 16px 0; }
    button { background: #0284c7; color: #fff; border: 0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    button:hover { background: #0369a1; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .card { background: #111827; border: 1px solid #1e293b; border-radius: 10px; padding: 12px; }
    .ok { color: #34d399; font-weight: 700; }
    .fail { color: #f87171; font-weight: 700; }
    pre { background: #111827; border: 1px solid #1e293b; padding: 12px; border-radius: 10px; overflow: auto; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>AuraFlow Backup & Health Watchdog</h1>
    <p class="sub">Monitoreo unificado de endpoints /health y respaldos de bases de datos</p>
    <div class="actions">
      <button onclick="loadStatus()">Actualizar Estado</button>
      <button onclick="triggerBackup()">Ejecutar Backup Ahora</button>
    </div>
    <div id="grid" class="grid">Cargando...</div>
    <h3>Routers &amp; VPN</h3>
    <div id="routers" class="grid">Cargando...</div>
    <h3>Últimos Backups</h3>
    <pre id="backups">Cargando...</pre>
  </div>
  <script>
    async function loadStatus() {
      const [sRes, bRes] = await Promise.all([fetch('/api/status'), fetch('/api/backups')]);
      const status = await sRes.json();
      const backups = await bRes.json();
      document.getElementById('grid').innerHTML = status.results.map(r => \`
        <div class="card">
          <div><strong>\${r.name}</strong></div>
          <div class="\${r.ok ? 'ok' : 'fail'}">\${r.ok ? 'ONLINE' : 'OFFLINE'} (\${r.statusCode || 'ERR'}) • \${r.latencyMs}ms</div>
          <div style="font-size:12px;color:#64748b">\${r.url}</div>
        </div>
      \`).join('');
      document.getElementById('routers').innerHTML = (status.routers || []).map(r => \`
        <div class="card">
          <div><strong>\${r.name}</strong></div>
          <div class="\${r.ok ? 'ok' : 'fail'}">\${r.ok ? 'ONLINE' : 'OFFLINE'} • \${r.latencyMs}ms</div>
          <div style="font-size:12px;color:#64748b">\${r.host}</div>
        </div>
      \`).join('');
      document.getElementById('backups').textContent = JSON.stringify(backups.backups.slice(0, 5), null, 2);
    }
    async function triggerBackup() {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      alert('Backup creado: ' + data.snapshot + ' (' + data.totalBytes + ' bytes)');
      loadStatus();
    }
    loadStatus();
  </script>
</body>
</html>`;
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function createWatchdogServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/health')) {
      return sendJson(res, 200, {
        ok: true,
        status: 'ONLINE',
        service: 'auraflow-watchdog',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/status') {
      const report = await checkAllTargets();
      return sendJson(res, 200, report);
    }

    if (req.method === 'GET' && url.pathname === '/api/backups') {
      return sendJson(res, 200, { ok: true, backups: listBackups() });
    }

    if (req.method === 'POST' && url.pathname === '/api/backup') {
      const result = runBackup();
      return sendJson(res, 200, { ok: true, ...result });
    }

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderDashboardHtml());
    }

    return sendJson(res, 404, { ok: false, error: 'Not found' });
  });
}

if (require.main === module) {
  const server = createWatchdogServer();
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`AuraFlow Watchdog listening on http://127.0.0.1:${PORT}`);
  });
}

module.exports = { createWatchdogServer };
