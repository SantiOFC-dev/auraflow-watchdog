const { checkAllTargets } = require('./healthChecker');
const { runBackup } = require('./backupManager');

async function main() {
  const cmd = process.argv[2] || 'check';

  if (cmd === 'check') {
    const report = await checkAllTargets();
    for (const item of report.results) {
      const tag = item.ok ? 'OK  ' : 'FAIL';
      console.log(`[${tag}] ${item.id} (${item.statusCode}) ${item.latencyMs}ms - ${item.url}`);
    }
    console.log(`Summary: ${report.online}/${report.total} online`);
    if (Array.isArray(report.routers) && report.routers.length > 0) {
      console.log('--- Routers & VPN ---');
      for (const r of report.routers) {
        const tag = r.ok ? 'OK  ' : 'DOWN';
        console.log(`[${tag}] ${r.name} (${r.host}) ${r.latencyMs}ms`);
      }
    }
    process.exit(report.offline > 0 ? 1 : 0);
  }

  if (cmd === 'backup') {
    const res = runBackup();
    console.log(`Snapshot ${res.snapshot} created (${res.totalBytes} bytes) at ${res.snapshotDir}`);
    if (res.pruned.length > 0) {
      console.log(`Pruned old snapshots: ${res.pruned.join(', ')}`);
    }
    process.exit(0);
  }

  console.error('Usage: node src/cli.js [check|backup]');
  process.exit(1);
}

main();
