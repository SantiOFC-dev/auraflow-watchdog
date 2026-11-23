const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const { runBackup, listBackups } = require('../src/backupManager');
const { checkSingleTarget, checkRouterHost } = require('../src/healthChecker');
const { createWatchdogServer } = require('../src/server');

test('runBackup copies file + WAL sidecars and prunes old snapshots', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watchdog-test-'));
  const srcDb = path.join(tmpDir, 'sample.db');
  fs.writeFileSync(srcDb, 'sqlite-main');
  fs.writeFileSync(`${srcDb}-wal`, 'sqlite-wal');

  const backupRoot = path.join(tmpDir, 'backups');
  // Create two pre-existing snapshots to verify pruning with maxKeep=2
  fs.mkdirSync(path.join(backupRoot, '2026-01-01_00-00-00'), { recursive: true });
  fs.mkdirSync(path.join(backupRoot, '2026-01-02_00-00-00'), { recursive: true });

  const result = runBackup({
    targets: [
      { id: 'sample', path: srcDb },
      { id: 'missing', path: path.join(tmpDir, 'nope.db') }
    ],
    backupRoot,
    maxKeep: 2
  });

  assert.equal(result.items[0].status, 'ok');
  assert.equal(result.items[0].files.length, 2);
  assert.equal(result.items[1].status, 'missing');
  assert.equal(result.pruned.length, 1);
  assert.equal(listBackups(backupRoot).length, 2);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('createWatchdogServer serves /health and checkSingleTarget works', async () => {
  const server = createWatchdogServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const res = await checkSingleTarget({
      id: 'self',
      name: 'Self',
      url: `http://127.0.0.1:${port}/health`
    });
    assert.equal(res.ok, true);
    assert.equal(res.statusCode, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('checkRouterHost pings localhost successfully', async () => {
  const res = await checkRouterHost({ id: 'lo', name: 'Loopback', host: '127.0.0.1' }, 1);
  assert.equal(res.ok, true);
  assert.equal(res.host, '127.0.0.1');
});
