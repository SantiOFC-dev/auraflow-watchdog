# AuraFlow Watchdog

Servicio ligero sin dependencias externas para monitorear todos los endpoints `/health` del ecosistema AuraFlow y realizar respaldos incrementales (incluyendo sidecars SQLite `-wal`/`-shm`) en `/root/backups/auraflow-watchdog`.

## Uso

```bash
# Ejecutar pruebas
npm test

# Verificar todos los /health en CLI
npm run check

# Ejecutar backup de todas las bases de datos y configs
npm run backup

# Iniciar dashboard y API en http://127.0.0.1:3090
npm start
```
