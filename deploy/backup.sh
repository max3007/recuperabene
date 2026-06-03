#!/usr/bin/env bash
# Snapshot consistente del database SQLite (sicuro anche con l'app attiva,
# perché usa il comando .backup di sqlite, non una copia grezza del file).
# Pianificalo con cron, es. ogni notte alle 3:
#   crontab -e
#   0 3 * * * /home/ubuntu/recuperabene/deploy/backup.sh
set -euo pipefail

DB="/home/ubuntu/recuperabene/prisma/prod.db"
DEST="/home/ubuntu/backups"
KEEP=14 # quanti backup conservare

mkdir -p "$DEST"
sqlite3 "$DB" ".backup '$DEST/prod-$(date +%F-%H%M).db'"

# Rimuovi i backup più vecchi oltre gli ultimi $KEEP.
ls -1t "$DEST"/prod-*.db 2>/dev/null | tail -n "+$((KEEP + 1))" | xargs -r rm --

# (Opzionale) sincronizza su S3 se hai configurato la AWS CLI:
#   aws s3 sync "$DEST" s3://TUO-BUCKET/recuperabene-backups/ --delete
