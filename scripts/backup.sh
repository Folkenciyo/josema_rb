#!/usr/bin/env bash
#
# Copias de seguridad de JOSEMA RB, a demanda.
#
# Las copias automáticas las lanza Dokploy (una diaria y una semanal de cada
# cosa, guardando siempre solo la última). Este script sirve para lo que no
# cubre un cron: hacer una copia justo antes de tocar algo delicado, y bajarse
# los ficheros al ordenador.
#
#   ./scripts/backup.sh now        crea una copia de todo, ahora mismo
#   ./scripts/backup.sh list       muestra lo que hay guardado
#   ./scripts/backup.sh download   descarga las copias a ./backups/
#
# Necesita .env.dokploy y .env.minio (ninguno se sube al repositorio) y acceso
# por SSH al servidor como `fholk`.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

for file in .env.dokploy .env.minio; do
  if [[ ! -f "$file" ]]; then
    echo "Falta $file — sin él no se puede hablar con el servidor." >&2
    exit 1
  fi
done

set -a
# shellcheck disable=SC1091
source .env.dokploy
# shellcheck disable=SC1091
source .env.minio
set +a

SSH_HOST="${BACKUP_SSH_HOST:-fholk}"

# Copias registradas en Dokploy. Los identificadores salen de su API; si algún
# día se recrean, se actualizan aquí.
DB_BACKUPS=(
  "1KZogpJ8xcj7zsF52GYUl:base de datos (diaria)"
  "RJS5649El_adCpSviayiq:base de datos (semanal)"
)
VOLUME_BACKUPS=(
  "Ehj0CuNxYsotGUNhCBxSz:fotos de clientes (diaria)"
)

api() {
  curl -sS -m 300 -X POST \
    -H "x-api-key: $DOKPLOY_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$2" "$DOKPLOY_URL/api/$1"
}

# mc dentro del servidor: MinIO no está expuesto fuera de la red de Docker.
mc_run() {
  ssh -o BatchMode=yes "$SSH_HOST" \
    "sudo -n docker run --rm --network dokploy-network \
      -e MC_HOST_local='http://$MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD@josema-minio:9000' \
      $1 --entrypoint sh minio/mc:latest -c '$2'"
}

cmd_now() {
  for entry in "${DB_BACKUPS[@]}"; do
    printf '  %-32s ' "${entry#*:}"
    api backup.manualBackupCompose "{\"backupId\":\"${entry%%:*}\"}" >/dev/null && echo "hecha"
  done
  for entry in "${VOLUME_BACKUPS[@]}"; do
    printf '  %-32s ' "${entry#*:}"
    api volumeBackups.runManually "{\"volumeBackupId\":\"${entry%%:*}\"}" >/dev/null && echo "hecha"
  done
  echo
  cmd_list
}

cmd_list() {
  echo "Copias guardadas en el servidor:"
  mc_run "" "mc ls --recursive local/$MINIO_BUCKET"
}

cmd_download() {
  local dest="${1:-$ROOT/backups}"
  mkdir -p "$dest"

  echo "Descargando a $dest"
  # Primero al servidor, y de ahí al ordenador: MinIO solo es accesible desde
  # la red interna de Docker.
  ssh -o BatchMode=yes "$SSH_HOST" "sudo -n rm -rf /tmp/josema-backup-dl && sudo -n mkdir -p /tmp/josema-backup-dl && sudo -n chmod 777 /tmp/josema-backup-dl"
  mc_run "-v /tmp/josema-backup-dl:/out" "mc cp --recursive local/$MINIO_BUCKET/ /out/"
  ssh -o BatchMode=yes "$SSH_HOST" "sudo -n chmod -R a+r /tmp/josema-backup-dl"
  scp -q -r "$SSH_HOST:/tmp/josema-backup-dl/." "$dest/"
  ssh -o BatchMode=yes "$SSH_HOST" "sudo -n rm -rf /tmp/josema-backup-dl"

  echo
  echo "Descargado:"
  find "$dest" -type f -exec ls -lh {} \; | awk '{print "  " $5 "\t" $NF}'
  echo
  echo "Para restaurar la base de datos (el fichero es formato custom de"
  echo "pg_dump, aunque acabe en .sql.gz):"
  echo "  gunzip -c <fichero>.sql.gz > dump.pgc"
  echo "  pg_restore -U josema -d josema_rb --no-owner dump.pgc"
}

case "${1:-}" in
  now) cmd_now ;;
  list) cmd_list ;;
  download) cmd_download "${2:-}" ;;
  *)
    echo "Uso: $0 {now|list|download [carpeta]}" >&2
    exit 1
    ;;
esac
