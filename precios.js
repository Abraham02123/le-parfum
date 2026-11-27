// Editor de precios.csv desde el celular (27-nov). Por qué: el dueño no tiene espacio en Google Sheets; precios.csv
// vive en el mismo repositorio de la tienda y este editor lo guarda directo en GitHub (API de contenidos), sin
// computadora. La tienda y las páginas de cada perfume lo leen en vivo (datos.js, ficha.js).
// Desde el 27-nov también AGREGA (de los 24.063 perfumes de buscador_perfumes.json), QUITA (borra la fila; el historial
// de GitHub la guarda) y ARCHIVA (visible = no: deja de verse pero conserva sus precios para restaurarlo). Un perfume
// agregado sale con precio y épocas sugeridos; su foto, notas y página los arma la computadora sola (reconstruir.sh,
// cada 5 minutos) a partir de la fuente.
// La clave de GitHub NUNCA va en el código: el dueño la pega una vez y queda solo en el navegador de su teléfono.
(function () {
  'use strict';
  const C = window.TIENDA_CONFIG || {}, L = window.Logica;
  const REPO = C.repoGithub || '', ARCHIVO = L.urlHoja(C.hojaCatalogo) || 'precios.csv';
  const API = `https://api.github.com/repos/${REPO}/contents/${ARCHIVO}`;
  const CLAVE = 'leparfum_github_token';
  // Firma de los cambios: el repositorio es público, así que nunca el correo personal (mismo criterio que publicar.sh).
  const FIRMA = { name: 'Le Parfum', email: 'tienda@localhost' };
  const DISP = [['con_caja', 'con caja'], ['sin_caja', 'sin caja'], ['ambas', 'con y sin caja'], ['no', 'no disponible']];
  const POR_PAGINA = 40;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let doc = null;            // { cab, filas, fin, bom } del archivo tal como está en GitHub
  let items = [];            // un objeto por perfume, con lo original y lo editado
  const cambios = new Map(); // id → item editado
  let mostrar = POR_PAGINA, permiso = false, pestana = 'tienda';
  let indice = null;         // buscador_perfumes.json, se baja solo al abrir «Agregar»
  const EPOCA = { P: 'Primavera', V: 'Verano', O: 'Otoño', I: 'Invierno' };
  const GENERO = { m: 'mujer', h: 'hombre', u: 'unisex' };
  const huella = (o) => JSON.stringify([o.sin, o.con, o.disp, o.temp, o.vis]);

  // ── CSV crudo: se conserva cada celda y el orden de columnas; solo se reescriben las filas que cambian ──
  function partirCsv(t) {
    const bom = t.charCodeAt(0) === 0xFEFF; if (bom) t = t.slice(1);
    const fin = t.includes('\r\n') ? '\r\n' : '\n';
    const filas = []; let fila = [], campo = '', dentro = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (dentro) { if (c !== '"') campo += c; else if (t[i + 1] === '"') { campo += '"'; i++; } else dentro = false; }
      else if (c === '"') dentro = true;
      else if (c === ',') { fila.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; fila.push(campo); filas.push(fila); fila = []; campo = ''; }
      else campo += c;
    }
    if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
    const cab = filas.shift() || [];
    return { cab, filas: filas.filter((f) => f.some((x) => x.trim() !== '')), fin, bom };
  }
  const celda = (v) => (/[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
  const unirCsv = (d) => (d.bom ? String.fromCharCode(0xFEFF) : '') + [d.cab, ...d.filas].map((f) => f.map((x) => celda(String(x ?? ''))).join(',')).join(d.fin) + d.fin;
  const col = (d, ...nombres) => d.cab.findIndex((h) => nombres.includes(L.norm(h).trim().replace(/\s+/g, '_')));
  function columnas(d) {
    const k = { id: col(d, 'id'), marca: col(d, 'marca'), nombre: col(d, 'nombre'), sin: col(d, 'sin_caja', 'precio_sin_caja'),
      con: col(d, 'con_caja', 'precio_con_caja'), disp: col(d, 'disponible', 'disponibilidad'), temp: col(d, 'temporadas', 'temporada', 'epoca'),
      vis: col(d, 'visible', 'mostrar') };
    for (const [c, nombre] of [['sin', 'sin caja'], ['con', 'con caja'], ['disp', 'disponible'], ['temp', 'temporadas'], ['vis', 'visible']]) {
      if (k[c] < 0) { d.cab.push(nombre); k[c] = d.cab.length - 1; }
    }
    if (k.id < 0) throw new Error('el archivo no tiene la columna «id»');
    return k;
  }

  // ── Base64 en UTF-8 (la API de GitHub manda y recibe el archivo así; btoa solo no sabe de acentos) ──
  function aBase64(s) {
    const b = new TextEncoder().encode(s); let r = '';
    for (let i = 0; i < b.length; i += 0x8000) r += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(r);
  }
  const deBase64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(String(s).replace(/\s/g, '')), (c) => c.charCodeAt(0)));

  const token = () => localStorage.getItem(CLAVE) || '';
  const cabeceras = () => ({ Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token(), 'X-GitHub-Api-Version': '2022-11-28' });
  async function leerDeGithub() {
    const r = await fetch(API + '?ref=' + encodeURIComponent(C.ramaGithub || 'master') + '&t=' + Date.now(), { headers: cabeceras(), cache: 'no-store' });
    if (r.status === 404) {
      // Puede ser otra rama principal: se prueba sin indicar la rama.
      const r2 = await fetch(API + '?t=' + Date.now(), { headers: cabeceras(), cache: 'no-store' });
      if (!r2.ok) throw new Error(errorGithub(r2.status));
      const j2 = await r2.json(); return { texto: deBase64(j2.content), sha: j2.sha, rama: null };
    }
    if (!r.ok) throw new Error(errorGithub(r.status));
    const j = await r.json(); return { texto: deBase64(j.content), sha: j.sha, rama: C.ramaGithub || 'master' };
  }
  function errorGithub(s) {
    return { 401: 'la clave no es válida o caducó: crea una nueva y pégala arriba',
      403: 'la clave no tiene permiso para guardar (al crearla, «Contents» debe estar en «Read and write»)',
      404: 'la clave no tiene acceso al repositorio de la tienda (al crearla, elige el repositorio ' + REPO + ')',
      409: 'otra persona guardó al mismo tiempo', 422: 'el archivo cambió mientras editabas' }[s] || 'GitHub respondió ' + s;
  }

  // ── Cargar: con clave, directo de GitHub (lo más reciente); sin clave, el archivo publicado (solo para ver) ──
  async function cargar() {
    let texto;
    if (token()) {
      try { texto = (await leerDeGithub()).texto; permiso = true; marcarClave(true); }
      catch (e) { permiso = false; marcarClave(false, e.message); }
    } else marcarClave(null);
    if (texto == null) {
      const r = await fetch(ARCHIVO + '?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('no se pudo leer ' + ARCHIVO + ' (' + r.status + ')');
      texto = await r.text();
    }
    doc = partirCsv(texto);
    const k = columnas(doc);
    items = doc.filas.map((f) => {
      const o = { id: String(f[k.id]).trim(), marca: f[k.marca] || '', nombre: f[k.nombre] || '',
        sin: String(L.pesos(f[k.sin]) || ''), con: String(L.pesos(f[k.con]) || ''),
        disp: L.leerDisponible(f[k.disp]) || 'no', temp: L.leerTemporadas(f[k.temp]) || [],
        vis: !['no', '0', 'false', 'oculto', 'ocultar'].includes(L.norm(f[k.vis] || '').trim()) };
      o.orig = huella(o); o.estado = 'normal';   // estado: normal · nuevo (agregado, aún sin guardar) · quitar
      return o;
    }).filter((o) => o.id);
    cambios.clear(); pintar();
  }

  function marcarClave(ok, motivo) {
    const e = $('#estado-clave');
    e.className = 'estado-clave' + (ok === true ? ' ok' : ok === false ? ' mal' : '');
    e.textContent = ok === true ? '✓ Clave guardada en este teléfono: puedes guardar cambios.'
      : ok === false ? 'No se puede guardar: ' + motivo + '.' : 'Sin clave: puedes ver los precios, pero para guardar pega tu clave arriba.';
    $('#titulo-clave').textContent = ok === true ? 'Clave para guardar (ya puesta)' : 'Clave para guardar';
    $('#caja-clave').open = ok !== true;
  }

  // ── Lista ──
  const valido = (v) => { const n = L.pesos(v); return n >= 50 && n <= 500000; };
  const enPestana = (o) => (pestana === 'archivo' ? !o.vis && o.estado !== 'quitar' : o.vis || o.estado === 'quitar');
  const coincideTexto = (q, texto) => !q || q.split(/\s+/).every((w) => texto.includes(w));
  function visibles() {
    const q = L.norm($('#buscar').value).trim(), solo = $('#solo-cambios').checked;
    // Los recién agregados van primero: es lo que el dueño está mirando.
    return items.filter((o) => enPestana(o) && (!solo || cambios.has(o.id)) && coincideTexto(q, L.norm(o.marca + ' ' + o.nombre)))
      .sort((a, b) => (b.estado === 'nuevo') - (a.estado === 'nuevo'));
  }
  function pintar() {
    const enTienda = items.filter((o) => o.vis && o.estado !== 'quitar').length, archivados = items.filter((o) => !o.vis && o.estado !== 'quitar').length;
    $('#tab-tienda').textContent = `En la tienda (${enTienda})`; $('#tab-archivo').textContent = `Archivados (${archivados})`;
    document.querySelectorAll('.pestanas button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.p === pestana)));
    const agregar = pestana === 'agregar';
    $('#vista-lista').hidden = agregar; $('#vista-agregar').hidden = !agregar;
    if (agregar) pintarAgregar();
    else {
      const lista = visibles();
      const nq = lista.filter((o) => o.estado === 'quitar').length, n = lista.length - nq;
      $('#cuenta').textContent = `${n} perfume${n === 1 ? '' : 's'}` + (nq ? ` · ${nq} más se quitará${nq === 1 ? '' : 'n'} al guardar` : '') + (pestana === 'archivo' ? ' archivados: no se ven en la tienda y guardan sus precios' : '') + (permiso ? '' : ' · solo lectura');
      $('#lista').innerHTML = lista.slice(0, mostrar).map(fila).join('') || `<p class="vacio">${pestana === 'archivo' ? 'No hay perfumes archivados. Para archivar uno, búscalo en «En la tienda» y pulsa «Archivar».' : 'Ningún perfume coincide con la búsqueda.'}</p>`;
      $('#ver-mas').hidden = lista.length <= mostrar;
    }
    botonGuardar();
  }
  function fila(o) {
    const dis = permiso ? '' : ' disabled';
    if (o.estado === 'quitar') {
      return `<article class="item quitado cambiado" data-id="${esc(o.id)}"><h2>${esc(o.nombre)}<small>${esc(o.marca)}</small></h2>
        <p class="nota-item">Se quitará de la tienda al guardar.</p>
        <div class="acciones"><button type="button" class="btn btn-borde" data-a="no-quitar">No quitar</button></div></article>`;
    }
    return `<article class="item${cambios.has(o.id) ? ' cambiado' : ''}${o.vis ? '' : ' oculto-tienda'}" data-id="${esc(o.id)}">
      <h2>${esc(o.nombre)}<small>${esc(o.marca)}</small></h2>
      ${o.estado === 'nuevo' ? '<p class="nota-item">Nuevo: revisa el precio y las épocas sugeridas. Al guardar, la foto, las notas y su página se agregan solas (unos 10 minutos).</p>' : ''}
      <div class="campos">
        <label>Sin caja ($)<input data-c="sin" inputmode="numeric" value="${esc(o.sin)}" class="${valido(o.sin) ? '' : 'mal'}"${dis}></label>
        <label>Con caja ($)<input data-c="con" inputmode="numeric" value="${esc(o.con)}" class="${valido(o.con) ? '' : 'mal'}"${dis}></label>
        <label class="ancho2">Disponible<select data-c="disp"${dis}>${DISP.map(([v, t]) => `<option value="${v}"${o.disp === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <div class="ancho2"><span class="oculto">Épocas del año</span><div class="epocas" role="group" aria-label="Épocas del año">${L.TEMPORADAS.map((t) =>
          `<button type="button" data-t="${t}" aria-pressed="${o.temp.includes(t)}"${dis}>${L.EMOJI_TEMPORADA[t]} ${t}</button>`).join('')}</div></div>
      </div>
      <div class="acciones">${o.estado === 'nuevo'
        ? `<button type="button" class="btn btn-borde" data-a="no-agregar"${dis}>No agregar</button>`
        : `<button type="button" class="btn btn-borde" data-a="${o.vis ? 'archivar' : 'restaurar'}"${dis}>${o.vis ? 'Archivar' : 'Restaurar a la tienda'}</button>
           <button type="button" class="btn btn-borde peligro" data-a="quitar"${dis}>Quitar</button>`}</div>
    </article>`;
  }
  function anotar(o, art) {
    if (o.estado !== 'normal' || huella(o) !== o.orig) cambios.set(o.id, o); else cambios.delete(o.id);
    if (art) { art.classList.toggle('cambiado', cambios.has(o.id)); art.classList.toggle('oculto-tienda', !o.vis); }
    botonGuardar();
  }
  function botonGuardar() {
    const b = $('#guardar'), n = cambios.size, malos = [...cambios.values()].filter((o) => o.estado !== 'quitar' && (!valido(o.sin) || !valido(o.con))).length;
    b.disabled = !n || !permiso || malos > 0;
    b.textContent = !n ? 'No hay cambios' : malos ? `Revisa ${malos} precio${malos > 1 ? 's' : ''} en rojo` : `Guardar ${n} cambio${n > 1 ? 's' : ''}`;
  }
  // ── Agregar: buscar entre los 24.063 perfumes de la fuente ──
  async function cargarIndice() {
    if (indice) return indice;
    $('#cuenta-agregar').textContent = 'Cargando la lista de perfumes…';
    const r = await fetch('buscador_perfumes.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('no se pudo leer la lista de perfumes (' + r.status + ')');
    indice = (await r.json()).map((x) => ({ id: String(x[0]), marca: x[1], nombre: x[2], genero: x[3], anio: x[4], sin: x[5], con: x[6], ep: x[7],
      texto: L.norm(x[1] + ' ' + x[2]) }));
    return indice;
  }
  function pintarAgregar() {
    if (!indice) { cargarIndice().then(pintarAgregar).catch((e) => aviso(e.message, 'mal')); return; }
    const q = L.norm($('#buscar-nuevo').value).trim();
    if (q.length < 2) { $('#cuenta-agregar').textContent = `Escribe la marca o el nombre: hay ${indice.length.toLocaleString('es-MX')} perfumes para elegir, de los más conocidos a los menos.`; $('#resultados').innerHTML = ''; return; }
    const porId = new Map(items.map((o) => [o.id, o]));
    const hall = indice.filter((x) => coincideTexto(q, x.texto)), lista = hall.slice(0, 30);
    $('#cuenta-agregar').textContent = hall.length ? `${hall.length} encontrado${hall.length === 1 ? '' : 's'}` + (hall.length > 30 ? ' · se ven los 30 más conocidos; escribe más para afinar' : '') : 'Ninguno coincide. Prueba solo con la marca o con una palabra del nombre.';
    $('#resultados').innerHTML = lista.map((x) => {
      const ya = porId.get(x.id);
      const estado = !ya ? `<button type="button" class="btn btn-tinta" data-agregar="${x.id}"${permiso ? '' : ' disabled'}>Agregar</button>`
        : ya.estado === 'quitar' ? '<span class="ya">Marcado para quitar</span>'
        : ya.vis ? `<span class="ya">${ya.estado === 'nuevo' ? 'Agregado (falta guardar)' : 'Ya está en la tienda'}</span>`
        : `<button type="button" class="btn btn-borde" data-restaurar="${x.id}"${permiso ? '' : ' disabled'}>Está archivado: restaurar</button>`;
      return `<article class="item resultado"><h2>${esc(x.nombre)}<small>${esc(x.marca)} · ${GENERO[x.genero] || 'unisex'}${x.anio ? ' · ' + x.anio : ''}</small></h2>
        <p class="nota-item">Sugerido: ${esc(L.dinero(x.sin, C))} sin caja · ${esc(L.dinero(x.con, C))} con caja · ${[...x.ep].map((e) => EPOCA[e]).filter(Boolean).join(', ') || 'sin época'}</p>${estado}</article>`;
    }).join('');
  }
  function agregar(id) {
    const x = indice.find((y) => y.id === id); if (!x || items.some((o) => o.id === id)) return;
    const o = { id, marca: x.marca, nombre: x.nombre, sin: String(x.sin), con: String(x.con), disp: 'no',
      temp: [...x.ep].map((e) => EPOCA[e]).filter(Boolean), vis: true, estado: 'nuevo', orig: '' };
    if (!o.temp.length) o.temp = L.TEMPORADAS.slice();
    items.push(o); anotar(o);
    aviso(`«${x.nombre}» agregado. Revísalo en «En la tienda» y pulsa Guardar.`, 'ok');
    pintarAgregar();
  }
  $('#resultados').addEventListener('click', (e) => {
    const a = e.target.closest('[data-agregar]'), r = e.target.closest('[data-restaurar]');
    if (a) agregar(a.dataset.agregar);
    if (r) { const o = items.find((x) => x.id === r.dataset.restaurar); if (o) { o.vis = true; anotar(o); aviso(`«${o.nombre}» vuelve a la tienda al guardar.`, 'ok'); pintarAgregar(); } }
  });
  $('#buscar-nuevo').addEventListener('input', () => pintarAgregar());
  document.querySelector('.pestanas').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-p]'); if (!b) return;
    pestana = b.dataset.p; mostrar = POR_PAGINA; aviso(''); pintar();
  });

  function aviso(texto, tipo) { const m = $('#mensaje'); m.hidden = !texto; m.className = 'mensaje ' + (tipo || 'info'); m.textContent = texto || ''; if (texto) m.scrollIntoView({ block: 'nearest' }); }

  $('#lista').addEventListener('input', (e) => {
    const art = e.target.closest('.item'), o = art && items.find((x) => x.id === art.dataset.id); if (!o) return;
    const c = e.target.dataset.c;
    if (c === 'sin' || c === 'con') { o[c] = e.target.value.trim(); e.target.classList.toggle('mal', !valido(o[c])); }
    if (c === 'disp') o.disp = e.target.value;
    anotar(o, art);
  });
  $('#lista').addEventListener('click', (e) => {
    const ac = e.target.closest('button[data-a]');
    if (ac) {
      const o = items.find((x) => x.id === ac.closest('.item').dataset.id); if (!o) return;
      const a = ac.dataset.a;
      if (a === 'archivar') { o.vis = false; aviso(`«${o.nombre}» se archivará al guardar: deja de verse en la tienda y queda en «Archivados» con sus precios.`, 'info'); }
      if (a === 'restaurar') { o.vis = true; aviso(`«${o.nombre}» vuelve a la tienda al guardar.`, 'info'); }
      if (a === 'quitar') {
        if (!confirm(`¿Quitar «${o.nombre}» de la tienda?\n\nSe borra de la lista (sus precios también). Si solo quieres esconderlo un tiempo, usa «Archivar». Siempre se puede volver a agregar desde «Agregar».`)) return;
        o.estado = 'quitar';
      }
      if (a === 'no-quitar') o.estado = 'normal';
      if (a === 'no-agregar') { items = items.filter((x) => x !== o); cambios.delete(o.id); botonGuardar(); }
      else anotar(o);
      pintar(); return;
    }
    const b = e.target.closest('button[data-t]'); if (!b) return;
    const art = b.closest('.item'), o = items.find((x) => x.id === art.dataset.id), t = b.dataset.t;
    const tiene = o.temp.includes(t);
    if (tiene && o.temp.length === 1) { aviso('Cada perfume necesita al menos una época del año.', 'info'); return; }
    o.temp = L.TEMPORADAS.filter((x) => (x === t ? !tiene : o.temp.includes(x)));
    b.setAttribute('aria-pressed', String(!tiene));
    anotar(o, art);
  });
  $('#buscar').addEventListener('input', () => { mostrar = POR_PAGINA; pintar(); });
  $('#solo-cambios').addEventListener('change', () => { mostrar = POR_PAGINA; pintar(); });
  $('#ver-mas').addEventListener('click', () => { mostrar += POR_PAGINA; pintar(); });

  // ── Guardar: se baja la versión más reciente, se le aplican SOLO las filas cambiadas y se sube ──
  // Así no se pisa lo que se haya publicado desde la computadora mientras tanto.
  async function guardar(intento = 1) {
    const n = cambios.size; if (!n) return;
    $('#guardar').disabled = true; $('#guardar').textContent = 'Guardando…';
    try {
      const { texto, sha, rama } = await leerDeGithub();
      const d = partirCsv(texto), k = columnas(d);
      const porId = new Map(d.filas.map((f) => [String(f[k.id]).trim(), f]));
      let aplicados = 0, agregados = 0, quitados = 0, archivados = 0;
      for (const o of cambios.values()) {
        let f = porId.get(o.id);
        if (o.estado === 'quitar') {
          if (f) { d.filas = d.filas.filter((x) => x !== f); quitados++; }
          continue;
        }
        if (!f) {
          if (o.estado !== 'nuevo') continue;   // lo quitaron desde otro lado mientras tanto: no se resucita
          f = d.cab.map(() => ''); f[k.id] = o.id;
          if (k.marca >= 0) f[k.marca] = o.marca;
          if (k.nombre >= 0) f[k.nombre] = o.nombre;
          d.filas.push(f); porId.set(o.id, f); agregados++;
        } else aplicados++;
        if (o.estado === 'normal' && !o.vis && JSON.parse(o.orig)[4]) archivados++;
        while (f.length < d.cab.length) f.push('');
        f[k.sin] = String(L.pesos(o.sin)); f[k.con] = String(L.pesos(o.con));
        // La disponibilidad se escribe con las mismas palabras que se leen; si no se tocó, queda el texto original.
        if (L.leerDisponible(f[k.disp]) !== o.disp) f[k.disp] = DISP.find(([v]) => v === o.disp)[1];
        f[k.temp] = o.temp.join(' / ');
        f[k.vis] = o.vis ? 'si' : 'no';
      }
      const partes = [aplicados && `${aplicados} cambio${aplicados === 1 ? '' : 's'}`, agregados && `${agregados} agregado${agregados === 1 ? '' : 's'}`,
        quitados && `${quitados} quitado${quitados === 1 ? '' : 's'}`].filter(Boolean);
      const total = aplicados + agregados + quitados;
      const cuerpo = { message: `Precios: ${partes.join(', ') || 'sin cambios'} desde el celular` + (archivados ? ` (${archivados} archivado${archivados === 1 ? '' : 's'})` : ''), content: aBase64(unirCsv(d)), sha,
        committer: FIRMA, author: FIRMA };
      if (rama) cuerpo.branch = rama;
      const r = await fetch(API, { method: 'PUT', headers: { ...cabeceras(), 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
      if ((r.status === 409 || r.status === 422) && intento < 3) return guardar(intento + 1); // alguien guardó justo antes: se reintenta encima
      if (!r.ok) throw new Error(errorGithub(r.status));
      items = items.filter((o) => o.estado !== 'quitar');
      for (const o of items) { if (cambios.has(o.id)) { o.orig = huella(o); o.estado = 'normal'; } }
      cambios.clear(); pintar();
      aviso(`✓ Guardado (${partes.join(', ')}). Precios, épocas, archivados y quitados se ven en la tienda en 1 o 2 minutos; si no lo ves, recarga la página.`
        + (agregados ? ' Los agregados aparecen con su foto y su ficha en unos 10 minutos: la computadora de la tienda los arma sola.' : '')
        + (total < n ? ` ${n - total} ya no estaban en el archivo y no se guardaron.` : ''), 'ok');
    } catch (e) {
      aviso('No se guardó: ' + e.message + '. Tus cambios siguen aquí; vuelve a intentar.', 'mal');
      botonGuardar();
    }
  }
  $('#guardar').addEventListener('click', () => guardar());

  // ── Clave ──
  $('#guardar-clave').addEventListener('click', async () => {
    const v = $('#token').value.trim();
    if (!v) { aviso('Pega primero tu clave de GitHub.', 'info'); return; }
    localStorage.setItem(CLAVE, v); $('#token').value = '';
    const pendientes = new Map(cambios);
    try { await cargar(); } catch (e) { aviso(e.message, 'mal'); }
    // lo que ya habías cambiado antes de poner la clave no se pierde
    for (const [id, o] of pendientes) {
      const x = items.find((i) => i.id === id);
      if (x) { Object.assign(x, { sin: o.sin, con: o.con, disp: o.disp, temp: o.temp, vis: o.vis, estado: o.estado }); cambios.set(id, x); }
      else if (o.estado === 'nuevo') { items.push(o); cambios.set(id, o); }
    }
    pintar();
  });
  $('#olvidar-clave').addEventListener('click', () => { localStorage.removeItem(CLAVE); permiso = false; marcarClave(null); pintar(); aviso('Clave borrada de este teléfono.', 'info'); });
  window.addEventListener('beforeunload', (e) => { if (cambios.size) { e.preventDefault(); e.returnValue = ''; } });

  if (!REPO) { aviso('Falta «repoGithub» en config.js: sin eso no se sabe dónde guardar.', 'mal'); }
  cargar().catch((e) => { $('#cuenta').textContent = ''; aviso(e.message, 'mal'); });
})();
