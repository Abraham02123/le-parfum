#!/usr/bin/env bash
# Reconstrucción automática de la tienda (27-nov). La lanza la tarea programada «LeParfum_Reconstruir» cada 5 minutos
# (reconstruir.vbs, sin ventana). Para qué: cuando el dueño agrega un perfume desde el celular (precios.html), solo cambia
# precios.csv en GitHub; la foto, las notas, la descripción y la página de ese perfume las arma ESTA computadora.
#
# Qué hace, en orden:
#   1. Si ya hay otra reconstrucción corriendo, sale (candado reconstruir.lock/; se libera solo a los 30 minutos).
#   2. Si esta carpeta tiene cambios sin publicar (alguien está trabajando en ella), sale SIN tocar nada.
#   3. Mira si en GitHub hay algo nuevo (un guardado desde el celular). Si no hay nada nuevo, sale: cuesta 1 segundo.
#   4. Si hay algo nuevo, corre publicar.sh, que trae los cambios, rearma el catálogo (baja fotos), regenera las
#      páginas, pasa las pruebas y publica. Si falla, deja reconstruir.pendiente y lo reintenta en la siguiente vuelta.
# Registro: datos/reconstruir.log (una línea por vuelta con algo que contar).
set -uo pipefail
cd "$(dirname "$0")"
LOG=datos/reconstruir.log
anotar() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$LOG"; }
# Que el registro no crezca sin fin: si pasa de 500 KB se queda con las últimas 2.000 líneas.
[ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 500000 ] && { tail -n 2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; }

if ! mkdir reconstruir.lock 2>/dev/null; then
  if [ -n "$(find reconstruir.lock -maxdepth 0 -mmin +30 2>/dev/null)" ]; then
    anotar "candado de más de 30 minutos: se libera (la vuelta anterior murió)"; rmdir reconstruir.lock; mkdir reconstruir.lock || exit 0
  else
    exit 0
  fi
fi
trap 'rmdir reconstruir.lock 2>/dev/null' EXIT

if [ -n "$(git status --porcelain)" ]; then
  # Sin anotar cada 5 minutos lo mismo: solo si cambió el motivo.
  grep -q "cambios sin publicar" <(tail -n 1 "$LOG" 2>/dev/null) || anotar "la carpeta tiene cambios sin publicar: no se toca hasta que se publiquen"
  exit 0
fi

RAMA=$(git branch --show-current)
if ! git fetch -q origin "$RAMA" 2>>"$LOG"; then anotar "sin conexión con GitHub: se reintenta en 5 minutos"; exit 0; fi
if [ "$(git rev-parse HEAD)" = "$(git rev-parse "origin/$RAMA")" ] && [ ! -f reconstruir.pendiente ]; then
  exit 0   # nada nuevo desde el celular
fi

anotar "hay cambios nuevos ($(git log --format=%s -1 "origin/$RAMA")): se reconstruye y se publica"
if bash publicar.sh >> "$LOG" 2>&1; then
  rm -f reconstruir.pendiente; anotar "✅ listo: $(git log --format='%h %s' -1)"
else
  touch reconstruir.pendiente; anotar "🔴 publicar.sh falló (detalle arriba); se reintenta en la siguiente vuelta"
fi
