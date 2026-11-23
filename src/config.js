const path = require('node:path');

const HEALTH_TARGETS = [
  { id: 'vps-command-hub', name: 'VPS Command Hub', url: 'http://127.0.0.1:7777/health' },
  { id: 'aura-flow-tech', name: 'AuraFlow Tech Web', url: 'http://127.0.0.1:8000/api/health' },
  { id: 'aura-agent-framework', name: 'AuraAgent Framework', url: 'http://127.0.0.1:8095/health' },
  { id: 'reycom-cobertura', name: 'REYCOM Cobertura API', url: 'http://127.0.0.1:3018/health' },
  { id: 'auraflow-radio', name: 'AuraFlow Radio PTT', url: 'http://127.0.0.1:3002/health' },
  { id: 'auraflow-netscan-saas', name: 'NetScan Cloud SaaS', url: 'http://127.0.0.1:3081/health' },
  { id: 'netscan-pro-local', name: 'NetScan Pro Local', url: 'http://127.0.0.1:3080/health' },
  { id: 'sitio-evangelizacion', name: 'Sitio Evangelización', url: 'http://127.0.0.1:3020/api/health' },
  { id: 'wander-album', name: 'WanderAlbum', url: 'http://127.0.0.1:3000/api/health' },
  { id: 'auraflow-wabot', name: 'AuraFlow WhatsApp Bot', url: 'http://127.0.0.1:8001/health' }
];

const BACKUP_TARGETS = [
  { id: 'vps-command-hub-db', path: '/root/vps-command-hub/ops_audit.db' },
  { id: 'aura-agents-db', path: '/root/aura-agent-framework/aura_agents.db' },
  { id: 'reycom-naps-db', path: '/root/aura-agent-framework/reycom_naps_local.db' },
  { id: 'auraflow-radio-db', path: '/root/auraflow-radio/data/auraflow_radio.db' },
  { id: 'wander-album-db', path: '/root/wander-album/data/wanderalbum.db' },
  { id: 'sitio-evangelizacion-db', path: '/root/sitio-evangelizacion/data/evangelizacion.db' },
  { id: 'netscan-saas-db', path: '/root/auraflow-netscan-saas/data/saas_db.json' },
  { id: 'tiktok-bot-config', path: '/root/tiktok-comment-bot/config.json' }
];

const BACKUP_ROOT = process.env.BACKUP_ROOT || path.join('/root/backups', 'auraflow-watchdog');
const MAX_SNAPSHOTS = Number(process.env.MAX_SNAPSHOTS) || 10;

const ROUTER_TARGETS = [
  { id: 'vpn-peer', name: 'OpenVPN Tunnel Peer', host: '10.8.0.2' },
  { id: 'router-110-1', name: 'Router Principal Ruijie (192.168.110.1)', host: '192.168.110.1' },
  { id: 'router-110-22', name: 'Ruijie Range Extender .22', host: '192.168.110.22' },
  { id: 'router-110-160', name: 'Ruijie Range Extender .160', host: '192.168.110.160' }
];

module.exports = {
  HEALTH_TARGETS,
  ROUTER_TARGETS,
  BACKUP_TARGETS,
  BACKUP_ROOT,
  MAX_SNAPSHOTS
};
