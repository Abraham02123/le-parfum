// Genera una página fija por perfume (p/<id>.html) y por marca (p/marca-<nombre>.html), más sitemap.xml (el mapa de páginas que se le da a Google).
// Por qué: la tienda abre cada perfume con «#p=123», y Google no indexa lo que va después de «#»: sin estas páginas
// nadie que busque «Alien Mugler precio México» llega a la tienda. Además, al compartir un perfume por WhatsApp la
// vista previa muestra SU foto y su precio, no la imagen general.
// Uso: node generar_paginas.js https://usuario.github.io/le-parfum/    (publicar.sh lo corre solo antes de subir)
const fs = require('fs'), vm = require('vm'), path = require('path');
globalThis.window = globalThis;
for (const f of ['config.js', 'logica.js', 'catalogo.js']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), { filename: f });
const C = globalThis.TIENDA_CONFIG, L = globalThis.Logica;
const BASE = (process.argv[2] || 'https://abraham02123.github.io/le-parfum/').replace(/\/?$/, '/');
// Precios y disponibilidad: los de la hoja de Google si config.js la tiene (la misma que lee la tienda en vivo);
// si no responde, los de catalogo.js. Así las páginas de cada perfume dicen lo mismo que la tienda al publicar.
let base = globalThis.CATALOGO.map((p) => L.normalizar({ ...p }));
const urlHoja = L.urlHoja(C.hojaCatalogo);
if (urlHoja) {
  try {
    const texto = require('child_process').execFileSync(process.execPath, ['-e',
      'fetch(process.argv[1]).then(async (r) => { if (!r.ok) throw new Error("HTTP " + r.status); process.stdout.write(await r.text()); }).catch((e) => { console.error(e.message); process.exit(1); })', urlHoja],
      { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] });
    const r = L.aplicarHoja(base, texto);
    if (r.coinciden < base.length / 2) throw new Error(`la hoja solo trae ${r.coinciden} de ${base.length} perfumes`);
    base = r.lista;
    console.log(`hoja de Google: ${r.coinciden} perfumes, ${r.cambiados} con precio o disponibilidad distinta a catalogo.js`);
  } catch (e) { console.warn('⚠ hoja de Google no leída, uso catalogo.js:', String(e.message).split('\n')[0]); }
}
const cat = base.filter((p) => p.visible !== false);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dinero = (n) => L.dinero(n, C);
const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const PARA = { mujer: 'para mujer', hombre: 'para hombre', unisex: 'unisex' };
const porVotos = (a, b) => (b.votos || 0) - (a.votos || 0);
const recorta = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)) + '…');
const hoy = new Date().toISOString().slice(0, 10);

const cabeza = ({ titulo, desc, url, imagen, tipo, extra = '' }) => `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(url)}">
  <meta name="theme-color" content="#FBFAF8">
  <meta property="og:type" content="${tipo}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${esc(imagen)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='11' y='3' width='10' height='6' rx='1.5' fill='%234A2340'/%3E%3Crect x='6' y='10' width='20' height='19' rx='5' fill='%23B97A2B'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../estilos.css">
  <link rel="stylesheet" href="pagina.css">
${extra}</head>
<body class="tienda pagina-fija">
  <header class="cabecera"><a class="marca-tienda" href="../">${esc(C.nombre)}</a><a class="btn btn-borde volver" href="../#catalogo">Ver todo el catálogo</a></header>
`;
const pie = `  <footer class="pie"><div><p class="pie-marca">${esc(C.nombre)}</p><p>Perfumes originales. Con caja o sin caja. Pedidos por WhatsApp.</p></div>
    <p class="pie-legal">Las fotos y marcas pertenecen a sus dueños y se muestran solo para identificar cada producto.</p></footer>
</body>
</html>
`;
const tarjetaMini = (x) => `<a class="mini" href="${x.id}.html"><img src="../${esc(x.imagen_url)}" alt="Frasco de ${esc(x.nombre)} de ${esc(x.marca)}" loading="lazy" width="375" height="500"><span class="mini-marca">${esc(x.marca)}</span><span class="mini-nombre">${esc(x.nombre)}</span><span class="mini-precio">desde ${dinero(x.precio)}</span></a>`;

const carpeta = path.join(__dirname, 'p');
fs.mkdirSync(carpeta, { recursive: true });
// Solo se borran páginas generadas por este guion (de un perfume que ya no está), nunca otra cosa.
for (const f of fs.readdirSync(carpeta)) if (/^(\d+|marca-[a-z0-9-]+)\.html$/.test(f)) fs.unlinkSync(path.join(carpeta, f));

const marcas = new Map();
for (const p of cat) { if (!marcas.has(p.marca)) marcas.set(p.marca, []); marcas.get(p.marca).push(p); }
const urls = [BASE];

for (const p of cat) {
  const nombre = `${p.nombre} de ${p.marca}`;
  const url = `${BASE}p/${p.id}.html`, img = BASE + p.imagen_url;
  const d = L.disponibilidad(p);
  const desc = recorta(`${nombre}, perfume original ${PARA[p.genero] || ''} en México: sin caja ${dinero(p.precio_sin_caja)}, con caja ${dinero(p.precio_con_caja)}. ${p.descripcion || ''}`.replace(/\s+/g, ' '), 158);
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.nombre, brand: { '@type': 'Brand', name: p.marca },
    image: img, description: p.descripcion || nombre, category: 'Perfume',
    // Dos versiones (con caja y sin caja) → un rango de precios para Google.
    offers: { '@type': 'AggregateOffer', url, priceCurrency: C.moneda, offerCount: 2,
      lowPrice: Math.min(p.precio_sin_caja, p.precio_con_caja), highPrice: Math.max(p.precio_sin_caja, p.precio_con_caja),
      availability: L.hayAlgo(p) ? 'https://schema.org/InStock' : 'https://schema.org/BackOrder', itemCondition: 'https://schema.org/NewCondition' } };
  const detalles = [p.concentracion, p.ml && p.ml + ' ml', PARA[p.genero] && PARA[p.genero][0].toUpperCase() + PARA[p.genero].slice(1), p.familia && 'Familia ' + p.familia.toLowerCase(), p.anio && `Lanzado en ${p.anio}`].filter(Boolean);
  const piramide = (t, s) => (s ? `<div class="capa-nota"><h3>${t}</h3><p>${s.split(',').map((n) => `<span>${esc(n.trim())}</span>`).join('')}</p></div>` : '');
  const misma = marcas.get(p.marca).filter((x) => x.id !== p.id).sort(porVotos).slice(0, 4);
  const parecidos = cat.filter((x) => x.id !== p.id && x.marca !== p.marca && x.familia === p.familia && x.genero === p.genero).sort(porVotos).slice(0, 4);
  const html = cabeza({ titulo: `${nombre} · precio en México | ${C.nombre}`, desc, url, imagen: img, tipo: 'product',
    extra: `  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n` }) + `
  <main class="producto">
    <nav class="migas" aria-label="Estás en"><a href="../">Inicio</a> › <a href="marca-${slug(p.marca)}.html">${esc(p.marca)}</a> › <span>${esc(p.nombre)}</span></nav>
    <div class="producto-cuerpo">
      <div class="producto-foto"><img src="../${esc(p.imagen_url)}" alt="Frasco de ${esc(nombre)}" width="375" height="500"></div>
      <div class="producto-texto">
        <p class="f-marca"><a href="marca-${slug(p.marca)}.html">${esc(p.marca)}</a></p>
        <h1>${esc(p.nombre)}</h1>
        <ul class="f-detalles">${detalles.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <div class="f-opciones">${[['con', 'Con caja'], ['sin', 'Sin caja']].map(([k, t]) => `<a class="opcion-ficha${L.hay(p, k) ? ' hay' : ''}" href="../#p=${p.id}"><span class="op-caja">${t}</span><b class="op-precio">${dinero(L.precioDe(p, k))}</b><small>${L.hay(p, k) ? 'Disponible ahora' : 'Te lo conseguimos en 2 días a 1 semana'}</small></a>`).join('')}</div>
        ${C.preciosReferencia ? '<p class="f-nota-precio">Precio de referencia. Te confirmamos el precio final y la presentación por WhatsApp antes de enviar.</p>' : ''}
        <p class="disp ${d.clase}">${esc(d.texto)}</p>
        <div class="f-comprar"><a class="btn btn-tinta" href="../#p=${p.id}">Pedir este perfume</a></div>
        ${(p.acordes || []).length ? `<section class="f-acordes"><h2>Cómo huele</h2>${p.acordes.slice(0, 5).map((a, i) => `<div class="acorde"><span>${esc(a)}</span><b style="--ancho:${100 - i * 16}%"></b></div>`).join('')}</section>` : ''}
        ${(p.notas_salida || p.notas_corazon || p.notas_fondo) ? `<section class="f-piramide"><h2>Sus notas</h2>${piramide('Salida', p.notas_salida)}${piramide('Corazón', p.notas_corazon)}${piramide('Fondo', p.notas_fondo)}</section>` : ''}
        ${p.descripcion ? `<p class="f-desc">${esc(p.descripcion)}</p>` : ''}
      </div>
    </div>
    ${misma.length ? `<section class="parecidos"><h2>Más de ${esc(p.marca)}</h2><div class="mini-rejilla">${misma.map(tarjetaMini).join('')}</div></section>` : ''}
    ${parecidos.length ? `<section class="parecidos"><h2>Si te gusta, prueba también</h2><div class="mini-rejilla">${parecidos.map(tarjetaMini).join('')}</div></section>` : ''}
  </main>
` + pie;
  fs.writeFileSync(path.join(carpeta, `${p.id}.html`), html);
  urls.push(url);
}

for (const [marca, lista] of marcas) {
  lista.sort(porVotos);
  const url = `${BASE}p/marca-${slug(marca)}.html`;
  const desde = Math.min(...lista.map((x) => x.precio));
  const desc = `${lista.length} perfume${lista.length > 1 ? 's' : ''} originales de ${marca} en México, desde ${dinero(desde)}: ${lista.slice(0, 4).map((x) => x.nombre).join(', ')}. Con caja o sin caja; pide por WhatsApp.`;
  const html = cabeza({ titulo: `Perfumes ${marca} originales en México | ${C.nombre}`, desc: recorta(desc, 158), url, imagen: BASE + lista[0].imagen_url, tipo: 'website' }) + `
  <main class="producto">
    <nav class="migas" aria-label="Estás en"><a href="../">Inicio</a> › <span>${esc(marca)}</span></nav>
    <h1 class="titulo-marca">Perfumes ${esc(marca)}</h1>
    <p class="sub-marca">${lista.length} perfume${lista.length > 1 ? 's' : ''}, desde ${dinero(desde)} sin caja. Ordenados del más al menos conocido.</p>
    <div class="mini-rejilla rejilla-marca">${lista.map(tarjetaMini).join('')}</div>
  </main>
` + pie;
  fs.writeFileSync(path.join(carpeta, `marca-${slug(marca)}.html`), html);
  urls.push(url);
}

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${hoy}</lastmod></url>`).join('\n')}\n</urlset>\n`);
// Sin robots.txt: los buscadores solo lo leen en la raíz del dominio (usuario.github.io/robots.txt), no en /le-parfum/; el panel ya lleva <meta name="robots" content="noindex">.

// Lista de todas las marcas al pie de la portada: además de servir al cliente, es por donde Google llega a las páginas
// (un mapa de páginas sin enviar a Google no basta, y robots.txt no sirve en una subcarpeta).
const ordenMarcas = [...marcas.keys()].sort((a, b) => a.localeCompare(b, 'es'));
const bloque = `<!--MARCAS-INICIO-->
    <section class="marcas-todas" aria-labelledby="titulo-marcas">
      <h2 id="titulo-marcas">Todas las marcas</h2>
      <ul>${ordenMarcas.map((m) => `<li><a href="p/marca-${slug(m)}.html">${esc(m)}</a> <small>${marcas.get(m).length}</small></li>`).join('')}</ul>
    </section>
    <!--MARCAS-FIN-->`;
const rutaIndex = path.join(__dirname, 'index.html');
const indice = fs.readFileSync(rutaIndex, 'utf8');
if (!/<!--MARCAS-INICIO-->[\s\S]*?<!--MARCAS-FIN-->/.test(indice)) throw new Error('index.html no tiene las marcas <!--MARCAS-INICIO--><!--MARCAS-FIN-->');
fs.writeFileSync(rutaIndex, indice.replace(/<!--MARCAS-INICIO-->[\s\S]*?<!--MARCAS-FIN-->/, bloque));

// Página «no existe»: GitHub la muestra en cualquier dirección que no esté. Si era un perfume (p/123.html) que todavía no
// tiene página fija (por ejemplo, agregado desde el panel), lleva a su ficha dentro de la tienda.
fs.writeFileSync(path.join(__dirname, '404.html'), `<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Esta página no existe | ${esc(C.nombre)}</title><meta name="robots" content="noindex">
<script>var m = location.pathname.match(/[/]p[/]([0-9]+)[.]html$/); if (m) location.replace(${JSON.stringify(BASE)} + '#p=' + m[1]);</script>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,400&family=Jost:wght@400;500&display=swap" rel="stylesheet">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#FBFAF8;color:#1E1A1D;font:400 17px/1.5 Jost,system-ui,sans-serif;text-align:center;padding:24px}
h1{font:italic 400 44px/1.1 'Bodoni Moda',Georgia,serif;color:#4A2340;margin:0 0 12px}p{color:#6B6369;margin:0 0 26px}
a{display:inline-block;background:#1E1A1D;color:#fff;text-decoration:none;padding:13px 24px;border-radius:6px}a:hover{background:#4A2340}</style></head>
<body><main><h1>${esc(C.nombre)}</h1><p>Esta página no existe o el perfume ya no está en el catálogo.</p><a href="${esc(BASE)}">Ver todos los perfumes</a></main></body></html>
`);

// Comprobación propia: si algo no cuadra, no se publica (publicar.sh se detiene con el error).
const hechas = fs.readdirSync(carpeta).filter((f) => f.endsWith('.html'));
if (hechas.length !== cat.length + marcas.size) throw new Error(`páginas: ${hechas.length} hechas, se esperaban ${cat.length + marcas.size}`);
for (const p of cat) {
  const h = fs.readFileSync(path.join(carpeta, `${p.id}.html`), 'utf8');
  JSON.parse(h.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
  if (!fs.existsSync(path.join(__dirname, p.imagen_url))) throw new Error(`falta la foto ${p.imagen_url} de ${p.nombre}`);
}
console.log(`Páginas: ${cat.length} perfumes + ${marcas.size} marcas · sitemap con ${urls.length} direcciones · base ${BASE}`);
