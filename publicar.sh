#!/usr/bin/env bash
# Publica la tienda en GitHub Pages (gratis) y deja el enlace para compartir.
# Uso (desde Git Bash, en esta carpeta):   bash publicar.sh
# La primera vez hace falta haber entrado a GitHub UNA vez con:  gh auth login
# Las siguientes veces solo sube los cambios (precios, fotos, catálogo) y la tienda se actualiza en 1-2 minutos.
set -euo pipefail
cd "$(dirname "$0")"
REPO=le-parfum

if ! gh auth status >/dev/null 2>&1; then
  echo "🔴 Falta entrar a GitHub. Escribe:  gh auth login   (elige GitHub.com → HTTPS → Login with a web browser)"; exit 1
fi
DUENO=$(gh api user --jq .login)
URL="https://${DUENO}.github.io/${REPO}/"

# Sin número de WhatsApp la tienda sale en «modo de prueba» (los pedidos no te llegan): avisar, no impedir.
if ! grep -Eq "whatsapp: *'[^']*[0-9]" config.js; then
  echo "⚠️  config.js no tiene número de WhatsApp: los clientes verán «Modo de prueba» y sus pedidos NO te llegarán."
fi

# Una página fija por perfume y por marca (para que Google las encuentre y la vista previa al compartir lleve su foto).
node generar_paginas.js "$URL"
node pruebas.js            # si una comprobación falla, no se publica nada

# Cada estilo y programa se pide con una marca de su contenido («tienda.js?v=1a2b3c4d»), para que nadie vea
# una copia vieja guardada en su navegador (26-nov). Detalle en versionar.js.
node versionar.js

# La vista previa al compartir el enlace (WhatsApp, Instagram) necesita la dirección completa de la imagen.
sed -i -E "s#<meta property=\"og:image\" content=\"[^\"]*\">#<meta property=\"og:image\" content=\"${URL}img/compartir.jpg\">#" index.html
grep -q 'og:url' index.html || sed -i "s#<meta property=\"og:type\" content=\"website\">#&\n  <meta property=\"og:url\" content=\"${URL}\">#" index.html

# El repositorio es público: ningún commit puede llevar un correo personal (cualquiera lo leería en GitHub).
git config user.name >/dev/null || git config user.name "Tienda de perfumes"
git config user.email >/dev/null || git config user.email "tienda@localhost"

# Subir con la sesión de `gh`, no con el gestor de contraseñas de Windows: ese abre una ventana y el guion
# se queda esperando sin decir nada (pasó el 26-nov, 7 minutos colgado). Solo afecta a esta carpeta.
if [ "$(git config --local --get-all credential.https://github.com.helper | tail -1)" != '!gh auth git-credential' ]; then
  git config --local --replace-all credential.https://github.com.helper ""
  git config --local --add credential.https://github.com.helper '!gh auth git-credential'
fi

git add -A
git diff --cached --quiet || git commit -q -m "Publicar tienda $(date '+%Y-%m-%d %H:%M')"

if git log --format='%ae%n%ce' | grep -Eqv '(@localhost|noreply)'; then
  echo "🔴 Hay un commit firmado con un correo personal; no se publica para no exponerlo. Pídele a Claude que lo cambie."; exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create "$REPO" --public --source . --remote origin --push \
    --description "Le Parfum · catálogo de perfumes" >/dev/null
  gh api -X POST "repos/${DUENO}/${REPO}/pages" -f "source[branch]=$(git branch --show-current)" -f "source[path]=/" >/dev/null \
    || echo "(GitHub Pages ya estaba activado)"
else
  git push -q origin HEAD
fi

echo "Esperando a que GitHub publique (suele tardar 1-2 minutos)…"
# «Responde 200» no basta: la versión vieja también responde. Se espera a que GitHub diga que construyó
# EXACTAMENTE el último commit subido (26-nov).
ULTIMO=$(git rev-parse HEAD)
for i in $(seq 1 30); do
  BUILD=$(gh api "repos/${DUENO}/${REPO}/pages/builds/latest" --jq '.commit + " " + .status' 2>/dev/null || true)
  if [ "$BUILD" = "$ULTIMO built" ] && curl -s -o /dev/null -w '%{http_code}' "$URL" | grep -q 200; then
    echo "✅ Publicada la versión ${ULTIMO:0:7}: $URL"; exit 0
  fi
  sleep 10
done
echo "⏳ Todavía no responde. Mira el estado en: https://github.com/${DUENO}/${REPO}/actions  — la dirección será $URL"
