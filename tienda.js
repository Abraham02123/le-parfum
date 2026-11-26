// Pantalla de la tienda: catálogo, filtros, ficha, carrito y pedido.
(function () {
  const C = window.TIENDA_CONFIG, L = window.Logica, D = window.Datos;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dinero = (n) => L.dinero(n, C);
  const TONOS = { 'Dulce': '#d8a47f', 'Amaderada': '#8a6a4a', 'Aromática': '#7f9c8a', 'Especiada': '#a8553c', 'Oriental': '#9b4a5a',
    'Floral': '#d79ab0', 'Ámbar': '#c98d3e', 'Frutal': '#e07f6a', 'Acuática': '#6aa3c4', 'Cítrica': '#e3c35a', 'Oud': '#5a3a2e' };
  const CATEGORIAS = [['todos', 'Todos'], ['mujer', 'Mujer'], ['hombre', 'Hombre'], ['unisex', 'Unisex'],
    ['arabe', 'Árabes'], ['disenador', 'Diseñador'], ['nicho', 'Nicho']];

  let catalogo = [];
  const f = { q: '', categoria: 'todos', marcas: [], familias: [], concentraciones: [], tamanos: [], min: '', max: '', soloDisponibles: false, orden: 'destacados' };
  let carrito = JSON.parse(localStorage.getItem('tienda_carrito') || '[]');

  // ── Imagen o frasco dibujado si todavía no hay foto ─────────────────────
  const imagen = (p) => p.imagen_url
    ? `<img src="${esc(p.imagen_url)}" alt="${esc(p.marca + ' ' + p.nombre)}" loading="lazy">`
    : `<div class="frasco" style="--tono:${TONOS[p.familia] || '#c9a96e'}"><span>${esc(p.marca)}</span></div>`;

  function aviso(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(aviso.t); aviso.t = setTimeout(() => (el.hidden = true), 2200); }

  // ── Filtros ─────────────────────────────────────────────────────────────
  function casillas(id, campo, clave, valores, etiqueta = (v) => v) {
    const cuenta = (v) => catalogo.filter((p) => String(p[clave]) === String(v)).length;
    $(id).innerHTML = valores.map((v) => `<label class="casilla"><input type="checkbox" value="${esc(v)}" data-campo="${campo}"> ${esc(etiqueta(v))}<em>${cuenta(v)}</em></label>`).join('');
  }
  function armarFiltros() {
    const unicos = (k) => [...new Set(catalogo.map((p) => p[k]).filter((v) => v != null && v !== ''))];
    casillas('#f-marcas', 'marcas', 'marca', unicos('marca').sort());
    casillas('#f-familias', 'familias', 'familia', unicos('familia').sort());
    casillas('#f-concentraciones', 'concentraciones', 'concentracion', unicos('concentracion').sort());
    casillas('#f-tamanos', 'tamanos', 'ml', unicos('ml').sort((a, b) => a - b), (v) => v + ' ml');
    $('#categorias').innerHTML = CATEGORIAS.map(([v, t]) => `<button class="chip${v === f.categoria ? ' activo' : ''}" data-cat="${v}">${t}</button>`).join('');
  }

  // ── Catálogo ────────────────────────────────────────────────────────────
  function pintar() {
    const lista = L.filtrar(catalogo, f);
    $('#conteo').textContent = `${lista.length} ${lista.length === 1 ? 'perfume' : 'perfumes'}`;
    $('#vacio').hidden = lista.length > 0;
    $('#rejilla').innerHTML = lista.map((p, i) => {
      const d = L.disponibilidad(p);
      const rebaja = p.precio_antes && p.precio_antes > p.precio ? Math.round((1 - p.precio / p.precio_antes) * 100) : 0;
      return `<article class="tarjeta" data-id="${p.id}" style="animation-delay:${Math.min(i, 12) * 30}ms" tabindex="0">
        <div class="foto" style="background:radial-gradient(circle at 50% 40%, ${TONOS[p.familia] || '#c9a96e'}33, transparent 70%)">
          ${imagen(p)}<span class="etiqueta ${d.clase}">${d.clase === 'encargo' ? 'Por encargo' : esc(d.texto)}</span>
          ${rebaja ? `<span class="oferta">-${rebaja}%</span>` : ''}
        </div>
        <div class="datos-tarjeta"><span class="m">${esc(p.marca)}</span><h3>${esc(p.nombre)}</h3>
          <span class="d">${esc([p.concentracion, p.ml && p.ml + ' ml', p.familia].filter(Boolean).join(' · '))}</span>
          <div class="precio"><b>${dinero(p.precio)}</b>${rebaja ? `<s>${dinero(p.precio_antes)}</s>` : ''}</div></div>
      </article>`;
    }).join('');
  }

  // ── Ficha de un perfume ─────────────────────────────────────────────────
  function abrirFicha(id) {
    const p = catalogo.find((x) => x.id === id); if (!p) return;
    const d = L.disponibilidad(p); let cant = 1;
    $('#ficha-contenido').innerHTML = `<div class="ficha-rejilla">
      <div class="foto" style="background:radial-gradient(circle at 50% 40%, ${TONOS[p.familia] || '#c9a96e'}44, var(--panel2) 75%)">${imagen(p)}</div>
      <div><span class="m">${esc(p.marca)}</span><h2>${esc(p.nombre)}</h2>
        <div class="atributos">${[p.genero, { arabe: 'Árabe', disenador: 'Diseñador', nicho: 'Nicho' }[p.tipo], p.familia, p.concentracion, p.ml && p.ml + ' ml']
          .filter(Boolean).map((a) => `<span>${esc(a)}</span>`).join('')}</div>
        <p class="descripcion">${esc(p.descripcion || '')}</p>
        ${p.notas_salida || p.notas_corazon || p.notas_fondo ? `<div class="piramide">
          ${p.notas_salida ? `<div><small>Salida</small>${esc(p.notas_salida)}</div>` : ''}
          ${p.notas_corazon ? `<div><small>Corazón</small>${esc(p.notas_corazon)}</div>` : ''}
          ${p.notas_fondo ? `<div><small>Fondo</small>${esc(p.notas_fondo)}</div>` : ''}</div>` : ''}
        <div class="precio"><b style="font-size:26px">${dinero(p.precio)}</b>${p.precio_antes > p.precio ? `<s>${dinero(p.precio_antes)}</s>` : ''}</div>
        <p class="disp ${d.clase}">${esc(d.texto)}</p>
        <div class="comprar"><div class="cantidad"><button data-c="-1" aria-label="Menos">−</button><span id="cant">1</span><button data-c="1" aria-label="Más">+</button></div>
          <button class="btn btn-dorado" id="agregar">${p.stock > 0 ? 'Agregar al pedido' : 'Pedir por encargo'}</button></div>
      </div></div>`;
    $('#ficha-contenido').querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { cant = Math.max(1, Math.min(20, cant + +b.dataset.c)); $('#cant').textContent = cant; });
    $('#agregar').onclick = () => { agregar(p.id, cant); cerrar('#capa-ficha'); aviso('Agregado a tu pedido'); };
    abrir('#capa-ficha');
  }

  // ── Carrito ─────────────────────────────────────────────────────────────
  const guardarCarrito = () => { localStorage.setItem('tienda_carrito', JSON.stringify(carrito)); pintarCarrito(); };
  function agregar(id, cant) { const l = carrito.find((x) => x.id === id); if (l) l.cantidad += cant; else carrito.push({ id, cantidad: cant }); guardarCarrito(); }
  function lineasValidas() { return carrito.map((l) => ({ ...l, p: catalogo.find((x) => x.id === l.id) })).filter((l) => l.p); }
  const totalCarrito = () => lineasValidas().reduce((s, l) => s + l.p.precio * l.cantidad, 0);
  function pintarCarrito() {
    const ls = lineasValidas();
    $('#cuenta-carrito').textContent = ls.reduce((s, l) => s + l.cantidad, 0);
    $('#lineas-carrito').innerHTML = ls.length ? ls.map(({ p, cantidad }) => {
      const encargo = Math.max(0, cantidad - Math.max(p.stock, 0));
      return `<div class="linea"><div class="mini">${imagen(p)}</div>
        <div><h4>${esc(p.marca)} · ${esc(p.nombre)}</h4><small>${dinero(p.precio)} c/u</small>
          ${encargo ? `<small class="encargo">${encargo} por encargo</small>` : ''}
          <div class="cantidad" style="display:inline-flex;margin-top:6px"><button data-l="${p.id}" data-c="-1">−</button><span>${cantidad}</span><button data-l="${p.id}" data-c="1">+</button></div></div>
        <div style="text-align:right"><b>${dinero(p.precio * cantidad)}</b><br><button class="quitar" data-quitar="${p.id}">Quitar</button></div></div>`;
    }).join('') : '<p class="vacio">Tu pedido está vacío.</p>';
    $('#total-carrito').textContent = dinero(totalCarrito());
    $('#nota-encargo').hidden = !ls.some((l) => l.cantidad > l.p.stock);
    $('#ir-pagar').disabled = !ls.length;
  }

  // ── Pedido ──────────────────────────────────────────────────────────────
  async function confirmar(ev) {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(ev.target));
    const items = lineasValidas().map((l) => ({ perfume_id: l.id, cantidad: l.cantidad }));
    const btn = $('#confirmar'); btn.disabled = true; $('#error-pedido').hidden = true;
    try {
      const r = await D.crearPedido({ ...fd, items });
      carrito = []; guardarCarrito();
      catalogo = await D.perfumes(); pintar();
      cerrar('#capa-pedido');
      const encargo = r.items.some((l) => l.por_encargo > 0);
      $('#texto-listo').textContent = `Tu pedido #${r.id} por ${dinero(r.total)} quedó registrado. Te contactaremos al ${fd.telefono} para coordinar la entrega${encargo ? ' y el tiempo de llegada de lo que es por encargo' : ''}.`;
      const wa = $('#whatsapp-listo');
      if (C.whatsapp) {
        const texto = `Hola, acabo de hacer el pedido #${r.id}:\n` + r.items.map((l) => `• ${l.cantidad} × ${l.nombre}${l.por_encargo ? ` (${l.por_encargo} por encargo)` : ''}`).join('\n') +
          `\nTotal: ${dinero(r.total)}\nPago: contra entrega\nA nombre de ${fd.nombre}, ${fd.direccion}${fd.ciudad ? ', ' + fd.ciudad : ''}`;
        wa.href = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(texto)}`; wa.hidden = false;
      } else wa.hidden = true;
      abrir('#capa-listo');
    } catch (e) {
      $('#error-pedido').textContent = 'No se pudo registrar el pedido: ' + e.message; $('#error-pedido').hidden = false;
    } finally { btn.disabled = false; }
  }

  // ── Ventanas ────────────────────────────────────────────────────────────
  function abrir(s) { $(s).hidden = false; document.body.style.overflow = 'hidden'; }
  function cerrar(s) { $(s).hidden = true; if (![...document.querySelectorAll('.capa')].some((c) => !c.hidden)) document.body.style.overflow = ''; }

  // ── Eventos ─────────────────────────────────────────────────────────────
  function eventos() {
    let t; $('#buscar').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { f.q = e.target.value; pintar(); }, 120); });
    $('#orden').onchange = (e) => { f.orden = e.target.value; pintar(); };
    $('#categorias').onclick = (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; f.categoria = b.dataset.cat;
      document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('activo', c === b)); pintar(); };
    $('#filtros').addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset.campo) f[el.dataset.campo] = [...document.querySelectorAll(`[data-campo="${el.dataset.campo}"]:checked`)].map((x) => x.value);
      if (el.id === 'solo-disponibles') f.soloDisponibles = el.checked;
      pintar();
    });
    $('#precio-min').oninput = (e) => { f.min = e.target.value; pintar(); };
    $('#precio-max').oninput = (e) => { f.max = e.target.value; pintar(); };
    $('#limpiar').onclick = () => {
      Object.assign(f, { marcas: [], familias: [], concentraciones: [], tamanos: [], min: '', max: '', soloDisponibles: false });
      document.querySelectorAll('#filtros input').forEach((i) => (i.type === 'checkbox' ? (i.checked = false) : (i.value = '')));
      pintar();
    };
    $('#abrir-filtros').onclick = () => $('#filtros').classList.add('abierto');
    $('#cerrar-filtros').onclick = () => $('#filtros').classList.remove('abierto');
    $('#rejilla').onclick = (e) => { const t = e.target.closest('.tarjeta'); if (t) abrirFicha(+t.dataset.id); };
    $('#rejilla').onkeydown = (e) => { if (e.key === 'Enter' && e.target.classList.contains('tarjeta')) abrirFicha(+e.target.dataset.id); };
    $('#abrir-carrito').onclick = () => { pintarCarrito(); abrir('#capa-carrito'); };
    $('#lineas-carrito').onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.quitar) carrito = carrito.filter((l) => l.id !== +b.dataset.quitar);
      if (b.dataset.l) { const l = carrito.find((x) => x.id === +b.dataset.l); l.cantidad += +b.dataset.c; if (l.cantidad < 1) carrito = carrito.filter((x) => x !== l); }
      guardarCarrito();
    };
    $('#ir-pagar').onclick = () => { cerrar('#capa-carrito'); $('#total-pedido').textContent = dinero(totalCarrito()); abrir('#capa-pedido'); };
    $('#form-pedido').onsubmit = confirmar;
    document.querySelectorAll('.capa').forEach((c) => c.addEventListener('click', (e) => {
      if (e.target === c || e.target.closest('[data-cerrar]')) cerrar('#' + c.id);
    }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.capa:not([hidden])').forEach((c) => cerrar('#' + c.id)); });
  }

  async function iniciar() {
    document.title = `${C.nombre} · Perfumes`;
    ['#nombre-tienda', '#titulo-portada', '#pie-nombre'].forEach((s) => ($(s).textContent = C.nombre));
    $('#lema').textContent = C.lema;
    $('#aviso-demo').hidden = D.modo !== 'demo';
    if (C.pagoEnLinea) { const r = $('#opcion-en-linea input'); r.disabled = false; $('#opcion-en-linea small').textContent = 'Tarjeta, transferencia'; }
    eventos();
    try { catalogo = await D.perfumes(); }
    catch (e) { $('#conteo').textContent = 'No se pudo cargar el catálogo: ' + e.message; return; }
    armarFiltros(); pintar(); pintarCarrito();
  }
  iniciar();
})();
