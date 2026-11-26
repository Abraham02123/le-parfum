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
        p.notas_salida, p.notas_corazon, p.notas_fondo, (p.acordes || []).join(' ')].join(' '));
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

  const ORDENES = {
    // «Destacados»: primero los marcados a mano, después los que tienes en existencias y después los más votados.
    destacados: (a, b) => (b.destacado - a.destacado) || ((b.stock > 0) - (a.stock > 0)) || ((b.votos || 0) - (a.votos || 0)) || a.nombre.localeCompare(b.nombre),
    populares: (a, b) => ((b.votos || 0) - (a.votos || 0)) || a.nombre.localeCompare(b.nombre),
    precio_asc: (a, b) => a.precio - b.precio,
    precio_desc: (a, b) => b.precio - a.precio,
    nombre: (a, b) => a.nombre.localeCompare(b.nombre),
    nuevos: (a, b) => ((b.anio || 0) - (a.anio || 0)) || String(b.creado).localeCompare(String(a.creado)),
    disponibles: (a, b) => (b.stock - a.stock) || a.nombre.localeCompare(b.nombre),
  };

  // f = { q, categoria, marcas:[], familias:[], concentraciones:[], tamanos:[], min, max, soloDisponibles, orden }
  function filtrar(lista, f = {}) {
    const en = (arr, v) => !arr || !arr.length || arr.includes(v);
    const r = lista.filter((p) =>
      coincide(p, f.q) &&
      (!f.categoria || f.categoria === 'todos' || p.genero === f.categoria || p.tipo === f.categoria ||
        (f.categoria === 'ofertas' && p.precio_antes > p.precio)) &&
      en(f.marcas, p.marca) && en(f.familias, p.familia) && en(f.concentraciones, p.concentracion) &&
      en(f.tamanos, String(p.ml)) &&
      (f.min == null || f.min === '' || p.precio >= +f.min) &&
      (f.max == null || f.max === '' || p.precio <= +f.max) &&
      (!f.soloDisponibles || p.stock > 0));
    return r.sort(ORDENES[f.orden] || ORDENES.destacados);
  }

  function disponibilidad(p) {
    if (p.stock > 5) return { texto: 'Disponible', clase: 'ok' };
    if (p.stock > 0) return { texto: p.stock === 1 ? 'Última unidad' : `Últimas ${p.stock} unidades`, clase: 'pocas' };
    return { texto: 'Por encargo: lo conseguimos para ti', clase: 'encargo' };
  }

  function dinero(n, cfg) {
    const sinDec = ['COP', 'CLP', 'PYG', 'ARS'].includes(cfg.moneda);
    return new Intl.NumberFormat(cfg.idioma || 'es', { style: 'currency', currency: cfg.moneda || 'USD',
      maximumFractionDigits: sinDec ? 0 : 2, minimumFractionDigits: sinDec ? 0 : 2 }).format(n);
  }

  // Reparte un pedido: lo que hay en stock se descuenta, el resto queda «por encargo».
  // El precio sale del catálogo, nunca del navegador del cliente. Misma regla que crear_pedido en el esquema SQL.
  function repartirPedido(items, perfumes) {
    if (!Array.isArray(items) || !items.length) throw new Error('El pedido está vacío');
    const lineas = []; let total = 0;
    for (const it of items) {
      const p = perfumes.find((x) => x.id === it.perfume_id && x.visible !== false);
      const cant = Math.floor(+it.cantidad);
      if (!p) throw new Error('Un perfume del carrito ya no existe');
      if (!(cant > 0) || cant > 50) throw new Error('Cantidad no válida');
      const enStock = Math.min(Math.max(p.stock, 0), cant);
      lineas.push({ perfume_id: p.id, nombre: `${p.marca} · ${p.nombre}`, precio: +p.precio, cantidad: cant,
        en_stock: enStock, por_encargo: cant - enStock });
      total += +p.precio * cant;
    }
    return { lineas, total: Math.round(total * 100) / 100 };
  }

  g.Logica = { norm, distancia, coincide, filtrar, disponibilidad, dinero, repartirPedido, ORDENES };
})(typeof window !== 'undefined' ? window : globalThis);
