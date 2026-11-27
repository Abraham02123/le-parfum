// Páginas fijas de cada perfume y de cada marca (p/*.html): pone al día precios, disponibilidad y épocas del año
// leyendo precios.csv en el momento, igual que la tienda. Por qué (27-nov): el dueño cambia precios desde el
// celular (precios.html) y esas páginas se arman al publicar; sin esto mostrarían el precio viejo hasta la
// siguiente publicación. Si precios.csv no responde, la página se queda con lo que traía (que ya es correcto).
(function () {
  'use strict';
  const C = window.TIENDA_CONFIG || {}, L = window.Logica;
  if (!L) return;
  const url = L.urlHoja(C.hojaCatalogo);
  if (!url) return;
  const destino = /^https?:/i.test(url) ? url : '../' + url;
  const dinero = (n) => L.dinero(n, C);
  // Cada perfume de la página lleva sus datos de cuando se publicó (data-sin, data-con, data-disp, data-temporadas).
  const nodos = [...document.querySelectorAll('[data-id][data-sin]')];
  if (!nodos.length) return;
  const desdeNodo = (el) => L.normalizar({ id: +el.dataset.id, precio_sin_caja: +el.dataset.sin, precio_con_caja: +el.dataset.con,
    disponible: el.dataset.disp, temporadas: (el.dataset.temporadas || '').split('/').filter(Boolean) });

  fetch(destino + (destino.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' })
    .then((r) => { if (!r.ok) throw new Error('respondió ' + r.status); return r.text(); })
    .then((texto) => {
      // soloHoja: si el dueño quitó o archivó el perfume, la página lo dice en vez de seguir vendiéndolo (27-nov).
      // Solo si la hoja trae algún perfume de esta página: una hoja vacía o rota no esconde nada.
      const h = L.aplicarHoja(nodos.map(desdeNodo), texto, { soloHoja: true }), lista = h.coinciden ? h.lista : nodos.map(desdeNodo);
      lista.forEach((p, i) => {
        const el = nodos[i];
        if (!(p.precio > 0)) return; // nunca pintar un precio en cero
        if (el.matches('main.producto')) pintarProducto(el, p); else pintarMini(el, p);
      });
    })
    .catch((e) => console.warn('No se pudo leer ' + destino + '; la página muestra los precios de su publicación. Motivo:', e.message));

  function pintarProducto(el, p) {
    if (p.visible === false) {   // quitado o archivado por el dueño después de publicar esta página
      el.querySelectorAll('.f-opciones, .f-comprar, .f-nota-precio').forEach((x) => { x.hidden = true; });
      const disp = el.querySelector('.disp');
      if (disp) { disp.className = 'disp encargo'; disp.innerHTML = 'Este perfume ya no está en el catálogo. <a href="../">Ver los perfumes disponibles</a>'; }
      return;
    }
    el.querySelectorAll('.opcion-ficha[data-caja]').forEach((a) => {
      const k = a.dataset.caja, hay = L.hay(p, k);
      a.classList.toggle('hay', hay);
      const b = a.querySelector('.op-precio'); if (b) b.textContent = dinero(L.precioDe(p, k));
      const s = a.querySelector('small'); if (s) s.textContent = hay ? 'Disponible ahora' : 'Te lo conseguimos en 2 días a 1 semana';
    });
    const d = L.disponibilidad(p), disp = el.querySelector('.disp');
    if (disp) { disp.className = 'disp ' + d.clase; disp.textContent = d.texto; }
    const t = el.querySelector('.f-temporadas'); if (t && p.temporadas.length) t.textContent = L.textoTemporadas(p);
  }
  function pintarMini(el, p) {
    if (p.visible === false) { el.hidden = true; return; }
    const s = el.querySelector('.mini-precio'); if (s) s.textContent = 'desde ' + dinero(p.precio);
  }
})();
