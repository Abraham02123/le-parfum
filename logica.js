// Lógica pura (sin pantalla): búsqueda con errores de escritura, filtros, orden,
// disponibilidad y reparto de un pedido entre stock y «por encargo».
// Se usa en el navegador y en las pruebas (node pruebas.js).
(function (g) {
  const norm = (s) => (s ?? '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Distancia entre dos palabras: cuántas letras hay que cambiar, quitar, poner o intercambiar.
  function distancia(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const m = a.length, n = b.length;
    let pp = null, p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const c = [i];
      for (let j = 1; j <= n; j++) {
        c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) c[j] = Math.min(c[j], pp[j - 2] + 1);
      }
      pp = p; p = c;
    }
    return p[n];
  }

  // El texto en el que se busca se calcula una vez por perfume (con 500 perfumes, recalcularlo en cada tecla se nota).
  const cache = new WeakMap();
  const texto = (p) => {
    let t = cache.get(p);
    if (!t) {
      t = norm([p.nombre, p.marca, p.familia, p.genero, p.tipo === 'arabe' ? 'arabe' : p.tipo, p.concentracion,
        p.notas_salida, p.notas_corazon, p.notas_fondo, (p.acordes || []).join(' '), (p.temporadas || []).join(' ')].join(' '));
      cache.set(p, t);
    }
    return t;
  };

  // Cada palabra buscada tiene que aparecer, tal cual o con 1-2 letras de error.
  function coincide(p, q) {
    const toks = norm(q).split(/\s+/).filter(Boolean);
    if (!toks.length) return true;
    const t = texto(p);
    const palabras = t.split(/[^a-z0-9]+/).filter(Boolean);
    return toks.every((tok) => {
      if (t.includes(tok)) return true;
      const tol = tok.length >= 7 ? 2 : tok.length >= 4 ? 1 : 0;
      if (!tol) return false;
      return palabras.some((w) => distancia(tok, w) <= tol ||
        (w.length > tok.length && distancia(tok, w.slice(0, tok.length)) <= tol));
    });
  }

  // ── Dos versiones de cada perfume (27-nov): saldo CON caja y saldo SIN caja, cada una con su precio. ──
  // disponible: 'con_caja' | 'sin_caja' | 'ambas' | 'no'. Lo que no está disponible se consigue en 2 días a 1 semana.
  const ESTADOS = ['con_caja', 'sin_caja', 'ambas', 'no'];
  const estado = (p) => (ESTADOS.includes(p.disponible) ? p.disponible : p.stock > 0 ? 'ambas' : 'no');
  const hayAlgo = (p) => estado(p) !== 'no';
  // ¿Esa versión se entrega ya? caja = 'con' | 'sin'
  const hay = (p, caja) => { const e = estado(p); return e === 'ambas' || e === (caja === 'con' ? 'con_caja' : 'sin_caja'); };
  const precioDe = (p, caja) => +(caja === 'con' ? p.precio_con_caja : p.precio_sin_caja) || +p.precio || 0;
  // Completa los campos nuevos si faltan (datos viejos o de demostración). «precio» = el más barato de los dos:
  // es el que usan los filtros y el orden por precio.
  function normalizar(p) {
    const sin = +p.precio_sin_caja > 0 ? +p.precio_sin_caja : +p.precio || 0;
    const con = +p.precio_con_caja > 0 ? +p.precio_con_caja : sin;
    const temporadas = Array.isArray(p.temporadas) ? p.temporadas : leerTemporadas(p.temporadas) || [];
    return Object.assign(p, { precio_sin_caja: sin, precio_con_caja: con, precio: Math.min(sin, con), disponible: estado(p), temporadas });
  }
  const PLAZO = 'te lo conseguimos en 2 días a 1 semana';

  const ORDENES = {
    // «Destacados»: primero los marcados a mano, después los disponibles ya y después los más votados.
    destacados: (a, b) => (b.destacado - a.destacado) || (hayAlgo(b) - hayAlgo(a)) || ((b.votos || 0) - (a.votos || 0)) || a.nombre.localeCompare(b.nombre),
    populares: (a, b) => ((b.votos || 0) - (a.votos || 0)) || a.nombre.localeCompare(b.nombre),
    precio_asc: (a, b) => a.precio - b.precio,
    precio_desc: (a, b) => b.precio - a.precio,
    nombre: (a, b) => a.nombre.localeCompare(b.nombre),
    nuevos: (a, b) => ((b.anio || 0) - (a.anio || 0)) || String(b.creado).localeCompare(String(a.creado)),
    disponibles: (a, b) => (hayAlgo(b) - hayAlgo(a)) || a.nombre.localeCompare(b.nombre),
  };

  // f = { q, categoria, marcas:[], familias:[], temporadas:[], concentraciones:[], tamanos:[], min, max, soloDisponibles, orden }
  // temporadas: sale el perfume si va con ALGUNA de las épocas marcadas (marcar Verano e Invierno = los de una o la otra).
  function filtrar(lista, f = {}) {
    const en = (arr, v) => !arr || !arr.length || arr.includes(v);
    const r = lista.filter((p) =>
      coincide(p, f.q) &&
      (!f.categoria || f.categoria === 'todos' || p.genero === f.categoria || p.tipo === f.categoria ||
        (f.categoria === 'ofertas' && p.precio_antes > p.precio)) &&
      en(f.marcas, p.marca) && en(f.familias, p.familia) && en(f.concentraciones, p.concentracion) &&
      en(f.tamanos, String(p.ml)) &&
      (!f.temporadas || !f.temporadas.length || (p.temporadas || []).some((t) => f.temporadas.includes(t))) &&
      (f.min == null || f.min === '' || p.precio >= +f.min) &&
      (f.max == null || f.max === '' || p.precio <= +f.max) &&
      (!f.soloDisponibles || hayAlgo(p)));
    return r.sort(ORDENES[f.orden] || ORDENES.destacados);
  }

  // Las tres opciones con las palabras del dueño (27-nov); «ambas» es por si tiene las dos versiones.
  function disponibilidad(p) {
    const e = estado(p);
    if (e === 'ambas') return { texto: 'Disponible: saldo con caja y sin caja', clase: 'ok' };
    if (e === 'con_caja') return { texto: 'Disponible: saldo con caja', clase: 'ok' };
    if (e === 'sin_caja') return { texto: 'Disponible: saldo sin caja', clase: 'ok' };
    return { texto: 'No disponible: ' + PLAZO, clase: 'encargo' };
  }

  function dinero(n, cfg) {
    const sinDec = ['COP', 'CLP', 'PYG', 'ARS', 'MXN'].includes(cfg.moneda);
    return new Intl.NumberFormat(cfg.idioma || 'es', { style: 'currency', currency: cfg.moneda || 'USD',
      maximumFractionDigits: sinDec ? 0 : 2, minimumFractionDigits: sinDec ? 0 : 2 }).format(n);
  }

  // Arma un pedido: cada línea es un perfume en una versión (con caja o sin caja), con el precio de esa versión.
  // Si esa versión no está disponible, la línea va «por encargo» (se consigue en 2 días a 1 semana).
  // El precio sale del catálogo, nunca del navegador del cliente.
  // (El modo con base de datos, crear_pedido del esquema SQL, todavía no conoce las dos versiones.)
  function repartirPedido(items, perfumes) {
    if (!Array.isArray(items) || !items.length) throw new Error('El pedido está vacío');
    const lineas = []; let total = 0;
    for (const it of items) {
      const p = perfumes.find((x) => x.id === it.perfume_id && x.visible !== false);
      const cant = Math.floor(+it.cantidad);
      if (!p) throw new Error('Un perfume del carrito ya no existe');
      if (!(cant > 0) || cant > 50) throw new Error('Cantidad no válida');
      const caja = it.caja === 'con' ? 'con' : 'sin', precio = precioDe(p, caja);
      const enStock = hay(p, caja) ? cant : 0;
      lineas.push({ perfume_id: p.id, caja, nombre: `${p.marca} · ${p.nombre}, ${caja} caja`, precio, cantidad: cant,
        en_stock: enStock, por_encargo: cant - enStock });
      total += precio * cant;
    }
    return { lineas, total: Math.round(total * 100) / 100 };
  }

  // ── Hoja de cálculo (Google Sheets) para cambiar precios y disponibilidad desde el celular (27-nov) ──────
  // Lee un CSV (coma o punto y coma, con comillas) → filas con las cabeceras sin acentos: «Sin caja» → sin_caja.
  function leerCsv(t) {
    t = String(t || '').replace(/^\uFEFF/, '');
    const cab0 = t.split(/\r?\n/, 1)[0] || '';
    const sep = (cab0.match(/;/g) || []).length > (cab0.match(/,/g) || []).length ? ';' : ',';
    const filas = []; let fila = [], campo = '', dentro = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (dentro) { if (c !== '"') campo += c; else if (t[i + 1] === '"') { campo += '"'; i++; } else dentro = false; }
      else if (c === '"') dentro = true;
      else if (c === sep) { fila.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; fila.push(campo); filas.push(fila); fila = []; campo = ''; }
      else campo += c;
    }
    if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
    const cab = (filas.shift() || []).map((h) => norm(h).trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''));
    return filas.filter((f) => f.some((x) => String(x).trim()))
      .map((f) => Object.fromEntries(cab.map((h, i) => [h, String(f[i] ?? '').trim()])));
  }
  // «$1,950.00», «1.950,00», «1950» → 1950. Los centavos se ignoran (precios en pesos enteros).
  const pesos = (v) => { const d = String(v ?? '').replace(/[.,]\d{1,2}\s*$/, '').replace(/\D/g, ''); return d ? +d : NaN; };
  function leerDisponible(v) {
    const t = norm(v).trim();
    if (!t) return null;
    if (/^no\b/.test(t) || t.includes('agotad') || t.includes('encargo')) return 'no';
    if (t.includes('ambas') || t.includes('las dos') || (t.includes('con') && t.includes('sin'))) return 'ambas';
    if (t.includes('sin')) return 'sin_caja';
    if (t.includes('con')) return 'con_caja';
    return null;
  }
  // Épocas del año (27-nov). Se leen de palabras: «Primavera / Verano», «otoño, invierno», «todo el año».
  const TEMPORADAS = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
  const EMOJI_TEMPORADA = { Primavera: '🌸', Verano: '☀️', Otoño: '🍂', Invierno: '❄️' };
  function leerTemporadas(v) {
    const t = norm(Array.isArray(v) ? v.join(' ') : v);
    if (!t.trim()) return null;
    if (/todo el ano|todas/.test(t)) return TEMPORADAS.slice();
    const r = TEMPORADAS.filter((n) => t.includes(norm(n)));
    return r.length ? r : null;
  }
  // «Ideal para primavera y verano» · «Para todo el año» (ficha de la tienda y páginas de cada perfume).
  function textoTemporadas(p) {
    const t = (p.temporadas || []).map((x) => x.toLowerCase());
    if (!t.length) return '';
    if (t.length === 4) return 'Para todo el año';
    return 'Ideal para ' + (t.length > 1 ? t.slice(0, -1).join(', ') + ' y ' + t[t.length - 1] : t[0]);
  }
  // Aplica la hoja sobre el catálogo, perfume por perfume (por su número «id»). Lo que la hoja no trae o trae mal
  // (precio vacío o absurdo) se queda como estaba: una celda mal escrita no rompe la tienda.
  // Con { soloHoja: true } (27-nov, el dueño agrega y QUITA perfumes en precios.html): un perfume que ya no está en la
  // hoja se esconde (visible = false) en vez de quedarse como estaba; así lo quitado desaparece de la tienda en cuanto se
  // guarda, sin esperar a que se reconstruya el catálogo. Quien llama comprueba antes que la hoja es de verdad la lista
  // (que trae al menos la mitad de los perfumes): una hoja vacía o rota no puede esconder la tienda entera.
  function aplicarHoja(lista, texto, opciones = {}) {
    const porId = new Map(leerCsv(texto).map((r) => [String(r.id || '').trim(), r]));
    let coinciden = 0, cambiados = 0;
    const nueva = lista.map((p0) => {
      const p = normalizar({ ...p0 }), r = porId.get(String(p.id));
      if (!r) { if (opciones.soloHoja && p.visible !== false) { p.visible = false; cambiados++; } return p; }
      coinciden++;
      const antes = JSON.stringify([p.precio_sin_caja, p.precio_con_caja, p.disponible, p.visible, p.temporadas]);
      const sin = pesos(r.sin_caja ?? r.precio_sin_caja), con = pesos(r.con_caja ?? r.precio_con_caja);
      if (sin >= 50 && sin <= 500000) p.precio_sin_caja = sin;
      if (con >= 50 && con <= 500000) p.precio_con_caja = con;
      const d = leerDisponible(r.disponible ?? r.disponibilidad); if (d) p.disponible = d;
      const te = leerTemporadas(r.temporadas ?? r.temporada ?? r.epoca); if (te) p.temporadas = te;
      const vi = norm(r.visible ?? r.mostrar).trim();
      if (['no', '0', 'false', 'oculto', 'ocultar'].includes(vi)) p.visible = false;
      else if (['si', '1', 'true', 'x', 'mostrar'].includes(vi)) p.visible = true;
      normalizar(p);
      if (JSON.stringify([p.precio_sin_caja, p.precio_con_caja, p.disponible, p.visible, p.temporadas]) !== antes) cambiados++;
      return p;
    });
    return { lista: nueva, coinciden, cambiados, filas: porId.size };
  }
  // De dónde se leen precios, disponibilidad y épocas. Desde el 27-nov es «precios.csv», un archivo de la propia
  // tienda (el dueño no tiene espacio en Google): se devuelve tal cual. Sigue aceptando el enlace de una hoja de
  // Google (→ la dirección que devuelve sus datos como CSV) por si algún día se vuelve a usar.
  function urlHoja(s) {
    s = String(s || '').trim();
    if (!s) return '';
    if (!/^https?:/i.test(s) && /[.]csv$/i.test(s)) return s;
    if (/output=csv|tqx=out:csv/.test(s)) return s;
    const pub = s.match(/\/spreadsheets\/d\/e\/([\w-]+)/);
    if (pub) return `https://docs.google.com/spreadsheets/d/e/${pub[1]}/pub?output=csv`;
    const id = s.match(/\/spreadsheets\/d\/([\w-]+)/);
    return id ? `https://docs.google.com/spreadsheets/d/${id[1]}/gviz/tq?tqx=out:csv&headers=1` : '';
  }

  g.Logica = { norm, distancia, coincide, filtrar, disponibilidad, dinero, repartirPedido, ORDENES,
    normalizar, hay, hayAlgo, precioDe, PLAZO, leerCsv, aplicarHoja, urlHoja, pesos, leerDisponible,
    TEMPORADAS, EMOJI_TEMPORADA, leerTemporadas, textoTemporadas };
})(typeof window !== 'undefined' ? window : globalThis);
