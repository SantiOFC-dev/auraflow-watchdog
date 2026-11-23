const { execFile } = require('node:child_process');
const { HEALTH_TARGETS, ROUTER_TARGETS } = require('./config');

async function checkSingleTarget(target, timeoutMs = 3000) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(target.url, { signal: controller.signal });
    const latencyMs = Date.now() - start;
    return {
      id: target.id,
      name: target.name,
      url: target.url,
      ok: res.ok,
      statusCode: res.status,
      latencyMs,
      checkedAt: new Date().toISOString()
    };
  } catch (err) {
    return {
      id: target.id,
      name: target.name,
      url: target.url,
      ok: false,
      statusCode: 0,
      latencyMs: Date.now() - start,
      error: err.name === 'AbortError' ? 'Timeout' : err.message,
      checkedAt: new Date().toISOString()
    };
  } finally {
    clearTimeout(timer);
  }
}

function checkRouterHost(target, timeoutSec = 2) {
  return new Promise((resolve) => {
    const start = Date.now();
    execFile('ping', ['-c', '1', '-W', String(timeoutSec), target.host], { timeout: (timeoutSec + 1) * 1000 }, (err, stdout) => {
      const match = String(stdout || '').match(/time=([0-9.]+)\s*ms/);
      const latencyMs = match ? Math.round(Number(match[1])) : Date.now() - start;
      resolve({
        id: target.id,
        name: target.name,
        host: target.host,
        ok: !err,
        latencyMs,
        checkedAt: new Date().toISOString()
      });
    });
  });
}

async function checkAllRouters(routers = ROUTER_TARGETS) {
  return Promise.all(routers.map((r) => checkRouterHost(r)));
}

async function checkAllTargets(targets = HEALTH_TARGETS, timeoutMs = 3000) {
  const [results, routers] = await Promise.all([
    Promise.all(targets.map((t) => checkSingleTarget(t, timeoutMs))),
    checkAllRouters()
  ]);
  const onlineCount = results.filter((r) => r.ok).length;
  return {
    total: results.length,
    online: onlineCount,
    offline: results.length - onlineCount,
    checkedAt: new Date().toISOString(),
    results,
    routers
  };
}

module.exports = {
  checkSingleTarget,
  checkRouterHost,
  checkAllRouters,
  checkAllTargets
};
