// Pantalla de la tienda: portada por familias, catálogo con filtros, ficha, carrito y pedido.
(function () {
  const C = window.TIENDA_CONFIG, L = window.Logica, D = window.Datos;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dinero = (n) => L.dinero(n, C);
  const WA = String(C.whatsapp || '').replace(/\D/g, '');
  const POR_PAGINA = 48;
  // Color de cada familia de aroma: tiñe la punta de las tiras de la portada y el frasco dibujado cuando falta foto.
  const TONOS = { Floral: '#C9879A', Dulce: '#C08A4E', Amaderada: '#7A5B3E', Oriental: '#9A4433', Fresca: '#6E9DA6',
    'Cítrica': '#D2AE3C', Frutal: '#C9625A', 'Aromática': '#6F8A5C', 'Cuero y oud': '#4A2340',
    Especiada: '#A8553C', 'Ámbar': '#B97A2B', 'Acuática': '#6AA3C4', Oud: '#5A3A2E' };
  const PARA = { mujer: 'Para ella', hombre: 'Para él', unisex: 'Para todos' };
  const CATEGORIAS = [['todos', 'Todos'], ['mujer', 'Mujer'], ['hombre', 'Hombre'], ['unisex', 'Unisex'],
    ['arabe', 'Árabes'], ['disenador', 'Diseñador'], ['nicho', 'Nicho'], ['ofertas', 'Ofertas']];

  let catalogo = [], visibles = POR_PAGINA;
  const f = { q: '', categoria: 'todos', marcas: [], familias: [], concentraciones: [], tamanos: [], min: '', max: '', soloDisponibles: false, orden: 'destacados' };
  let carrito = [];
  try { carrito = JSON.parse(localStorage.getItem('tienda_carrito') || '[]'); } catch { carrito = []; }

  const nombreCompleto = (p) => `${p.marca} ${p.nombre}`;
  const waLink = (texto) => `https://wa.me/${WA}?text=${encodeURIComponent(texto)}`;

  // ── Imagen o frasco dibujado si todavía no hay foto ─────────────────────
  const imagen = (p, grande) => p.imagen_url
    ? `<img src="${esc(p.imagen_url)}" alt="Frasco de ${esc(nombreCompleto(p))}" ${grande ? '' : 'loading="lazy"'} decoding="async" width="375" height="500">`
    : `<div class="frasco" style="--tono:${TONOS[p.familia] || '#B97A2B'}"><span>${esc(p.marca)}</span></div>`;

  function aviso(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(aviso.t); aviso.t = setTimeout(() => (el.hidden = true), 2400); }

  // ── Portada: una tira de papel secante por familia de aroma ─────────────
  function armarTiras() {
    const cuenta = {};
    catalogo.forEach((p) => { if (p.familia) cuenta[p.familia] = (cuenta[p.familia] || 0) + 1; });
    const familias = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a]).slice(0, 9);
    $('#tiras').innerHTML = familias.map((fa, i) => `<button class="tira${f.familias.includes(fa) ? ' activa' : ''}" data-familia="${esc(fa)}"
      style="--tono:${TONOS[fa] || '#B97A2B'};--giro:${((i % 3) - 1) * 1.6}deg" aria-pressed="${f.familias.includes(fa)}">
      <span class="tira-nombre">${esc(fa)}</span><span class="tira-cuenta">${cuenta[fa]}</span></button>`).join('');
  }

  // ── Filtros ─────────────────────────────────────────────────────────────
  function casillas(id, campo, clave, valores, etiqueta = (v) => v) {
    const cuenta = (v) => catalogo.filter((p) => String(p[clave]) === String(v)).length;
    $(id).innerHTML = valores.map((v) => `<label class="casilla" data-texto="${esc(L.norm(etiqueta(v)))}"><input type="checkbox" value="${esc(v)}" data-campo="${campo}"
      ${f[campo].includes(String(v)) ? 'checked' : ''}><span>${esc(etiqueta(v))}</span><em>${cuenta(v)}</em></label>`).join('');
    $(id).closest('.grupo').hidden = valores.length < 2;
  }
  function armarFiltros() {
    const unicos = (k) => [...new Set(catalogo.map((p) => p[k]).filter((v) => v != null && v !== ''))];
    casillas('#f-marcas', 'marcas', 'marca', unicos('marca').sort((a, b) => a.localeCompare(b)));
    casillas('#f-familias', 'familias', 'familia', unicos('familia').sort());
    casillas('#f-concentraciones', 'concentraciones', 'concentracion', unicos('concentracion').sort());
    casillas('#f-tamanos', 'tamanos', 'ml', unicos('ml').sort((a, b) => a - b), (v) => v + ' ml');
    const hay = (c) => c === 'todos' || catalogo.some((p) => p.genero === c || p.tipo === c || (c === 'ofertas' && p.precio_antes > p.precio));
    $('#categorias').innerHTML = CATEGORIAS.filter(([v]) => hay(v)).map(([v, t]) =>
      `<button class="pestana${v === f.categoria ? ' activa' : ''}" data-cat="${v}" aria-pressed="${v === f.categoria}">${t}</button>`).join('');
  }

  function activos() {
    const chips = [];
    if (f.q) chips.push(['q', '', `«${f.q}»`]);
    for (const c of ['familias', 'marcas', 'concentraciones', 'tamanos']) f[c].forEach((v) => chips.push([c, v, c === 'tamanos' ? v + ' ml' : v]));
    if (f.min !== '' || f.max !== '') chips.push(['precio', '', `${f.min !== '' ? dinero(+f.min) : '0'} a ${f.max !== '' ? dinero(+f.max) : 'más'}`]);
    if (f.soloDisponibles) chips.push(['disp', '', 'Solo con existencias']);
    $('#activos').innerHTML = chips.map(([c, v, t]) => `<button class="quitar" data-quitar="${c}" data-valor="${esc(v)}" aria-label="Quitar filtro ${esc(t)}">${esc(t)}<span aria-hidden="true">×</span></button>`).join('');
    const n = chips.length;
    $('#abrir-filtros').textContent = n ? `Filtros (${n})` : 'Filtros';
  }

  // ── Catálogo ────────────────────────────────────────────────────────────
  function tarjeta(p) {
    const d = L.disponibilidad(p);
    const oferta = p.precio_antes > p.precio;
    return `<article class="tarjeta" data-id="${p.id}">
      <button class="foto" data-ver="${p.id}" aria-label="Ver ${esc(nombreCompleto(p))}">${imagen(p)}
        ${oferta ? `<span class="sello">Oferta</span>` : ''}</button>
      <div class="datos-tarjeta">
        <p class="t-marca">${esc(p.marca)}</p>
        <h3><button class="enlace-ficha" data-ver="${p.id}">${esc(p.nombre)}</button></h3>
        <p class="t-familia">${p.familia ? `<i style="--tono:${TONOS[p.familia] || '#B97A2B'}"></i>${esc(p.familia)}` : ''}</p>
        <div class="t-pie">
          <p class="precio">${dinero(p.precio)}${oferta ? ` <s>${dinero(p.precio_antes)}</s>` : ''}</p>
          <button class="agregar" data-agregar="${p.id}" aria-label="Agregar ${esc(nombreCompleto(p))} al carrito">Agregar</button>
        </div>
        <p class="disp ${d.clase}">${esc(d.texto)}</p>
      </div></article>`;
  }

  function pintar() {
    const lista = L.filtrar(catalogo, f);
    $('#conteo').textContent = `${lista.length} ${lista.length === 1 ? 'perfume' : 'perfumes'}`;
    $('#ver-resultados').textContent = `Ver ${lista.length} ${lista.length === 1 ? 'perfume' : 'perfumes'}`;
    $('#rejilla').innerHTML = lista.slice(0, visibles).map(tarjeta).join('');
    const quedan = lista.length - visibles;
    $('#mas').hidden = quedan <= 0;
    $('#mas').textContent = `Mostrar más (${quedan > 0 ? quedan : 0} restantes)`;
    $('#vacio').hidden = lista.length > 0;
    $$('.pestana').forEach((b) => { const a = b.dataset.cat === f.categoria; b.classList.toggle('activa', a); b.setAttribute('aria-pressed', a); });
    $$('.tira').forEach((b) => { const a = f.familias.includes(b.dataset.familia); b.classList.toggle('activa', a); b.setAttribute('aria-pressed', a); });
    activos();
  }
  const repintar = () => { visibles = POR_PAGINA; pintar(); };

  // ── Ficha de un perfume ─────────────────────────────────────────────────
  const piramide = (t, notas) => notas ? `<div class="capa-nota"><h4>${t}</h4><p>${notas.split(',').map((n) => `<span>${esc(n.trim())}</span>`).join('')}</p></div>` : '';
  function abrirFicha(id) {
    const p = catalogo.find((x) => String(x.id) === String(id)); if (!p) return;
    const d = L.disponibilidad(p), oferta = p.precio_antes > p.precio;
    const acordes = (p.acordes || []).slice(0, 5);
    const parecidos = catalogo.filter((x) => x.id !== p.id && x.familia === p.familia && x.genero === p.genero)
      .sort(L.ORDENES.populares).slice(0, 4);
    const detalles = [p.concentracion, p.ml && p.ml + ' ml', PARA[p.genero], p.anio && `Lanzado en ${p.anio}`].filter(Boolean);
    $('#ficha-contenido').innerHTML = `
      <div class="ficha-foto">${imagen(p, true)}</div>
      <div class="ficha-texto">
        <p class="f-marca">${esc(p.marca)}</p>
        <h2 id="ficha-titulo">${esc(p.nombre)}</h2>
        <ul class="f-detalles">${detalles.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <p class="f-precio">${dinero(p.precio)}${oferta ? ` <s>${dinero(p.precio_antes)}</s>` : ''}</p>
        ${C.preciosReferencia ? `<p class="f-nota-precio">Precio de referencia. Te confirmamos el precio final y la presentación por WhatsApp antes de enviar.</p>` : ''}
        <p class="disp ${d.clase}">${esc(d.texto)}</p>
        <div class="f-comprar">
          <button class="btn btn-tinta" data-agregar="${p.id}">Agregar al carrito</button>
          ${WA ? `<a class="btn btn-borde" target="_blank" rel="noopener" href="${waLink(`Hola, me interesa ${nombreCompleto(p)}. ¿Está disponible?`)}">Preguntar por WhatsApp</a>` : ''}
        </div>
        ${acordes.length ? `<section class="f-acordes"><h3>Cómo huele</h3>${acordes.map((a, i) => `<div class="acorde"><span>${esc(a)}</span><b style="--ancho:${100 - i * 16}%"></b></div>`).join('')}</section>` : ''}
        ${(p.notas_salida || p.notas_corazon || p.notas_fondo) ? `<section class="f-piramide"><h3>Sus notas</h3>
          ${piramide('Salida', p.notas_salida)}${piramide('Corazón', p.notas_corazon)}${piramide('Fondo', p.notas_fondo)}</section>` : ''}
        ${p.descripcion ? `<p class="f-desc">${esc(p.descripcion)}</p>` : ''}
        <button class="enlace" data-compartir="${p.id}">Copiar enlace de este perfume</button>
      </div>
      ${parecidos.length ? `<section class="parecidos"><h3>Si te gusta, prueba también</h3><div class="mini-rejilla">${parecidos.map((x) =>
        `<button class="mini" data-ver="${x.id}">${imagen(x)}<span class="mini-marca">${esc(x.marca)}</span><span class="mini-nombre">${esc(x.nombre)}</span></button>`).join('')}</div></section>` : ''}`;
    abrir('#capa-ficha');
    $('#capa-ficha .panel').scrollTop = 0;
    history.replaceState(null, '', '#p=' + p.id);
    document.title = `${nombreCompleto(p)} | ${C.nombre}`;
  }

  // ── Carrito ─────────────────────────────────────────────────────────────
  const guardarCarrito = () => { try { localStorage.setItem('tienda_carrito', JSON.stringify(carrito)); } catch { /* navegador sin espacio: el carrito sigue en memoria */ } };
  function agregar(id) {
    const l = carrito.find((x) => String(x.perfume_id) === String(id));
    if (l) l.cantidad = Math.min(50, l.cantidad + 1); else carrito.push({ perfume_id: catalogo.find((p) => String(p.id) === String(id)).id, cantidad: 1 });
    guardarCarrito(); pintarCarrito();
    const p = catalogo.find((x) => String(x.id) === String(id));
    aviso(`${p.nombre} está en tu carrito`);
    const c = $('#abrir-carrito'); c.classList.remove('late'); void c.offsetWidth; c.classList.add('late');
  }
  const lineasValidas = () => carrito.map((l) => ({ ...l, p: catalogo.find((x) => x.id === l.perfume_id) })).filter((l) => l.p);
  function pintarCarrito() {
    const ls = lineasValidas();
    const n = ls.reduce((s, l) => s + l.cantidad, 0);
    $('#cuenta-carrito').textContent = n; $('#cuenta-carrito').hidden = !n;
    const total = ls.reduce((s, l) => s + l.cantidad * l.p.precio, 0);
    $('#lineas-carrito').innerHTML = ls.length ? ls.map((l) => {
      const enc = Math.max(0, l.cantidad - Math.max(0, l.p.stock));
      return `<li class="linea"><div class="linea-foto">${imagen(l.p)}</div><div class="linea-texto"><b>${esc(l.p.nombre)}</b><small>${esc(l.p.marca)}</small>
        ${enc ? `<small class="encargo-txt">${enc === l.cantidad ? 'Por encargo' : enc + ' por encargo'}</small>` : ''}</div>
        <div class="cant"><button data-c="-1" data-id="${l.p.id}" aria-label="Quitar uno">−</button><span>${l.cantidad}</span><button data-c="1" data-id="${l.p.id}" aria-label="Agregar uno">+</button></div>
        <b class="linea-precio">${dinero(l.cantidad * l.p.precio)}</b></li>`;
    }).join('') : '<li class="vacio-carrito">Tu carrito está vacío. Elige un perfume y pulsa «Agregar».</li>';
    $('#total-carrito').textContent = dinero(total);
    $('#total-pedido').textContent = dinero(total);
    const hayEncargo = ls.some((l) => l.cantidad > l.p.stock);
    $('#nota-encargo').hidden = !hayEncargo;
    $('#nota-precios').hidden = !(C.preciosReferencia && ls.length);
    $('#ir-pagar').disabled = !ls.length;
  }

  // ── Pedido ──────────────────────────────────────────────────────────────
  function textoWhatsApp(r, datos) {
    const lin = r.items.map((l) => `- ${l.cantidad} × ${l.nombre}: ${dinero(l.precio * l.cantidad)}${l.por_encargo ? ` (${l.por_encargo} por encargo)` : ''}`);
    return [`Hola, quiero hacer este pedido (${r.id}):`, ...lin, `Total: ${dinero(r.total)}`, '',
      `Nombre: ${datos.nombre}`, `Teléfono: ${datos.telefono}`, `Dirección: ${datos.direccion}${datos.ciudad ? ', ' + datos.ciudad : ''}`,
      `Pago: ${{ contra_entrega: 'contra entrega', transferencia: 'transferencia', en_linea: 'en línea' }[datos.metodo_pago] || datos.metodo_pago}`, datos.notas ? `Notas: ${datos.notas}` : ''].join('\n').trim();
  }
  async function confirmar(e) {
    e.preventDefault();
    const fd = new FormData(e.target), datos = Object.fromEntries(fd.entries());
    const btn = $('#confirmar'); btn.disabled = true; $('#error-pedido').hidden = true;
    try {
      const r = await D.crearPedido({ ...datos, items: lineasValidas().map((l) => ({ perfume_id: l.perfume_id, cantidad: l.cantidad })) });
      const enc = r.items.reduce((s, l) => s + (l.por_encargo || 0), 0);
      cerrar('#capa-pedido');
      if (D.modo === 'whatsapp') {
        $('#titulo-listo').textContent = 'Falta un paso: envíalo';
        $('#texto-listo').textContent = `Pulsa el botón y se abrirá WhatsApp con tu pedido ya escrito. Solo tienes que enviarlo. Total ${dinero(r.total)}, pagas al recibir.${enc ? ` ${enc} ${enc === 1 ? 'unidad va' : 'unidades van'} por encargo: te avisamos el plazo.` : ''}`;
      } else {
        $('#titulo-listo').textContent = '¡Pedido recibido!';
        $('#texto-listo').textContent = `Tu pedido #${r.id} por ${dinero(r.total)} quedó registrado. Te contactaremos para coordinar la entrega; pagas al recibir.${enc ? ` ${enc} ${enc === 1 ? 'unidad va' : 'unidades van'} por encargo: te avisamos el plazo.` : ''}`;
        carrito = []; guardarCarrito(); pintarCarrito();
        catalogo = await D.perfumes(); pintar();
      }
      const w = $('#whatsapp-listo');
      w.hidden = !WA;
      if (WA) w.href = waLink(textoWhatsApp(r, datos));
      w.textContent = D.modo === 'whatsapp' ? 'Enviar mi pedido por WhatsApp' : 'Avisar por WhatsApp (opcional)';
      abrir('#capa-listo');
      e.target.reset();
    } catch (err) {
      $('#error-pedido').textContent = err.message.startsWith('Falta') ? 'Completa nombre, teléfono y dirección.' : 'No se pudo registrar: ' + err.message;
      $('#error-pedido').hidden = false;
    } finally { btn.disabled = false; }
  }

  // ── Ventanas ────────────────────────────────────────────────────────────
  let antesDeAbrir = null;
  function abrir(sel) {
    if (!$$('.capa:not([hidden])').length) antesDeAbrir = document.activeElement;
    $(sel).hidden = false; document.body.classList.add('sin-scroll');
    const foco = $(sel).querySelector('[data-cerrar]'); if (foco) foco.focus({ preventScroll: true });
  }
  function cerrar(sel) {
    $(sel).hidden = true;
    if (sel === '#capa-ficha') { history.replaceState(null, '', location.pathname + location.search); document.title = C.nombre; }
    if (!$$('.capa:not([hidden])').length) { document.body.classList.remove('sin-scroll'); if (antesDeAbrir) antesDeAbrir.focus({ preventScroll: true }); }
  }
  const abrirFiltros = () => { $('#filtros').classList.add('abierto'); document.body.classList.add('sin-scroll'); };
  const cerrarFiltros = () => { $('#filtros').classList.remove('abierto'); if (!$$('.capa:not([hidden])').length) document.body.classList.remove('sin-scroll'); };

  function eventos() {
    let t;
    $('#buscar').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { f.q = e.target.value.trim(); repintar(); }, 140); });
    $('#form-buscar').addEventListener('submit', (e) => { e.preventDefault(); f.q = $('#buscar').value.trim(); repintar(); $('#catalogo').scrollIntoView({ behavior: 'smooth' }); });
    $('#orden').addEventListener('change', (e) => { f.orden = e.target.value; repintar(); });
    $('#categorias').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (b) { f.categoria = b.dataset.cat; repintar(); } });
    $('#tiras').addEventListener('click', (e) => {
      const b = e.target.closest('[data-familia]'); if (!b) return;
      const fa = b.dataset.familia;
      f.familias = f.familias.includes(fa) ? f.familias.filter((x) => x !== fa) : [...f.familias, fa];
      $$(`#f-familias input`).forEach((i) => (i.checked = f.familias.includes(i.value)));
      repintar(); $('#catalogo').scrollIntoView({ behavior: 'smooth' });
    });
    $('#filtros').addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset.campo) { const c = el.dataset.campo; f[c] = el.checked ? [...f[c], el.value] : f[c].filter((v) => v !== el.value); }
      if (el.id === 'solo-disponibles') f.soloDisponibles = el.checked;
      repintar();
    });
    $('#precio-min').addEventListener('input', (e) => { f.min = e.target.value; repintar(); });
    $('#precio-max').addEventListener('input', (e) => { f.max = e.target.value; repintar(); });
    $('#buscar-marca').addEventListener('input', (e) => {
      const q = L.norm(e.target.value);
      $$('#f-marcas .casilla').forEach((c) => (c.hidden = q && !c.dataset.texto.includes(q)));
    });
    const limpiar = () => {
      Object.assign(f, { q: '', categoria: 'todos', marcas: [], familias: [], concentraciones: [], tamanos: [], min: '', max: '', soloDisponibles: false });
      $('#buscar').value = ''; $('#precio-min').value = ''; $('#precio-max').value = ''; $('#solo-disponibles').checked = false;
      $$('#filtros input[type=checkbox]').forEach((i) => (i.checked = false));
      repintar();
    };
    $('#limpiar').addEventListener('click', limpiar);
    $('#limpiar-vacio').addEventListener('click', limpiar);
    $('#activos').addEventListener('click', (e) => {
      const b = e.target.closest('[data-quitar]'); if (!b) return;
      const c = b.dataset.quitar, v = b.dataset.valor;
      if (c === 'q') { f.q = ''; $('#buscar').value = ''; }
      else if (c === 'precio') { f.min = f.max = ''; $('#precio-min').value = $('#precio-max').value = ''; }
      else if (c === 'disp') { f.soloDisponibles = false; $('#solo-disponibles').checked = false; }
      else { f[c] = f[c].filter((x) => x !== v); $$(`#filtros input[data-campo="${c}"]`).forEach((i) => { if (i.value === v) i.checked = false; }); }
      repintar();
    });
    $('#abrir-filtros').addEventListener('click', abrirFiltros);
    $('#cerrar-filtros').addEventListener('click', cerrarFiltros);
    $('#ver-resultados').addEventListener('click', cerrarFiltros);
    $('#mas').addEventListener('click', () => { visibles += POR_PAGINA; pintar(); });

    // Clics dentro del catálogo, la ficha y el carrito (un solo escuchador por zona).
    document.addEventListener('click', (e) => {
      const ver = e.target.closest('[data-ver]'), ag = e.target.closest('[data-agregar]'), comp = e.target.closest('[data-compartir]');
      if (ag) { agregar(ag.dataset.agregar); return; }
      if (ver) { abrirFicha(ver.dataset.ver); return; }
      if (comp) {
        const url = location.origin + location.pathname + '#p=' + comp.dataset.compartir;
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => aviso('Enlace copiado'), () => prompt('Copia este enlace:', url));
      }
      const capa = e.target.closest('.capa');
      if (capa && (e.target === capa || e.target.closest('[data-cerrar]'))) cerrar('#' + capa.id);
    });
    $('#lineas-carrito').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-c]'); if (!b) return;
      const l = carrito.find((x) => String(x.perfume_id) === b.dataset.id);
      l.cantidad = Math.min(50, l.cantidad + +b.dataset.c);
      carrito = carrito.filter((x) => x.cantidad > 0); guardarCarrito(); pintarCarrito();
    });
    $('#abrir-carrito').addEventListener('click', () => abrir('#capa-carrito'));
    $('#ir-pagar').addEventListener('click', () => { cerrar('#capa-carrito'); abrir('#capa-pedido'); });
    $('#form-pedido').addEventListener('submit', confirmar);
    $('#whatsapp-listo').addEventListener('click', () => {
      if (D.modo === 'whatsapp') { carrito = []; guardarCarrito(); pintarCarrito(); setTimeout(() => cerrar('#capa-listo'), 400); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const abiertas = $$('.capa:not([hidden])');
      if (abiertas.length) cerrar('#' + abiertas[abiertas.length - 1].id); else cerrarFiltros();
    });
    window.addEventListener('hashchange', () => { const m = location.hash.match(/^#p=(\d+)/); if (m) abrirFicha(m[1]); });
  }

  async function iniciar() {
    $('#aviso-demo').hidden = D.modo !== 'demo';
    document.title = C.nombre;
    $$('[data-nombre]').forEach((el) => (el.textContent = C.nombre));
    $('#lema').textContent = C.lema || '';
    $('#anio').textContent = new Date().getFullYear();
    if (WA) {
      const consulta = waLink('Hola, tengo una consulta sobre un perfume.');
      $('#wa-flotante').href = consulta; $('#wa-flotante').hidden = false;
      $('#pie-whatsapp').href = consulta; $('#pie-whatsapp').hidden = false;
      $('#confirmar').textContent = D.modo === 'whatsapp' ? 'Continuar a WhatsApp' : 'Confirmar pedido';
    }
    if (C.transferencia) { $('#opcion-transferencia').hidden = false; $('#texto-transferencia').textContent = C.transferencia; }
    if (C.pagoEnLinea) { $('#opcion-en-linea').classList.remove('deshabilitada'); $('#opcion-en-linea input').disabled = false; }
    $('#pie-precios').hidden = !C.preciosReferencia;
    eventos();
    try { catalogo = await D.perfumes(); }
    catch (err) { $('#rejilla').innerHTML = `<p class="error">No se pudo cargar el catálogo (${esc(err.message)}). Recarga la página en un momento.</p>`; return; }
    $('#total-catalogo').textContent = catalogo.length;
    armarTiras(); armarFiltros(); pintar(); pintarCarrito();
    const m = location.hash.match(/^#p=(\d+)/); if (m) abrirFicha(m[1]);
  }
  iniciar();
})();
