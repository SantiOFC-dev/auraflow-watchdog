const fs = require('node:fs');
const path = require('node:path');
const { BACKUP_TARGETS, BACKUP_ROOT, MAX_SNAPSHOTS } = require('./config');

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function copyWithWalSidecars(srcFile, destDir) {
  const baseName = path.basename(srcFile);
  const copied = [];
  for (const suffix of ['', '-wal', '-shm']) {
    const candidate = `${srcFile}${suffix}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const destFile = path.join(destDir, `${baseName}${suffix}`);
      fs.copyFileSync(candidate, destFile);
      copied.push({
        file: `${baseName}${suffix}`,
        bytes: fs.statSync(destFile).size
      });
    }
  }
  return copied;
}

function pruneOldSnapshots(backupRoot = BACKUP_ROOT, maxKeep = MAX_SNAPSHOTS) {
  if (!fs.existsSync(backupRoot)) return [];
  const dirs = fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const removed = [];
  while (dirs.length > maxKeep) {
    const oldest = dirs.shift();
    fs.rmSync(path.join(backupRoot, oldest), { recursive: true, force: true });
    removed.push(oldest);
  }
  return removed;
}

function runBackup({
  targets = BACKUP_TARGETS,
  backupRoot = BACKUP_ROOT,
  maxKeep = MAX_SNAPSHOTS
} = {}) {
  const stamp = formatTimestamp();
  const snapshotDir = path.join(backupRoot, stamp);
  fs.mkdirSync(snapshotDir, { recursive: true });

  const items = [];
  let totalBytes = 0;

  for (const target of targets) {
    if (!fs.existsSync(target.path)) {
      items.push({ id: target.id, path: target.path, status: 'missing', files: [] });
      continue;
    }
    const targetDir = path.join(snapshotDir, target.id);
    fs.mkdirSync(targetDir, { recursive: true });
    const files = copyWithWalSidecars(target.path, targetDir);
    const bytes = files.reduce((acc, f) => acc + f.bytes, 0);
    totalBytes += bytes;
    items.push({ id: target.id, path: target.path, status: 'ok', bytes, files });
  }

  const manifest = {
    snapshot: stamp,
    createdAt: new Date().toISOString(),
    totalBytes,
    items
  };
  fs.writeFileSync(path.join(snapshotDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const pruned = pruneOldSnapshots(backupRoot, maxKeep);
  return { ...manifest, snapshotDir, pruned };
}

function listBackups(backupRoot = BACKUP_ROOT) {
  if (!fs.existsSync(backupRoot)) return [];
  return fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const manifestPath = path.join(backupRoot, d.name, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch {
          return { snapshot: d.name, error: 'Invalid manifest.json' };
        }
      }
      return { snapshot: d.name };
    })
    .sort((a, b) => b.snapshot.localeCompare(a.snapshot));
}

module.exports = {
  formatTimestamp,
  runBackup,
  listBackups,
  pruneOldSnapshots
};
