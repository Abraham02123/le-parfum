// Pruebas sin navegador: node pruebas.js  → termina con «TODAS OK» o se detiene en la primera que falla.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const mem = {};
globalThis.window = globalThis;
globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)), removeItem: (k) => delete mem[k] };
vm.runInThisContext(fs.readFileSync(__dirname + '/config.js', 'utf8'), { filename: 'config.js' });
// El número real de la tienda: código de México (52) + 10 dígitos, que es lo que pide wa.me.
const NUM_REAL = String(globalThis.TIENDA_CONFIG.whatsapp || '').replace(/\D/g, '');
assert.ok(NUM_REAL === '' || /^52\d{10}$/.test(NUM_REAL), 'el WhatsApp de config.js debe ser 52 + 10 dígitos: ' + NUM_REAL);
// Las pruebas de abajo empiezan en modo demostración (sin número ni base de datos), sea cual sea config.js.
globalThis.TIENDA_CONFIG = Object.assign({}, globalThis.TIENDA_CONFIG, { whatsapp: '', supabaseUrl: '', supabaseKey: '' });
for (const f of ['logica.js', 'demo-catalogo.js', 'datos.js']) vm.runInThisContext(fs.readFileSync(__dirname + '/' + f, 'utf8'), { filename: f });
const { Logica: L, Datos: D } = globalThis;
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

(async () => {
  assert.strictEqual(D.modo, 'demo');
  const cat = await D.perfumes();
  ok(cat.length === 18, 'catálogo demo 18');
  const busca = (q) => L.filtrar(cat, { q }).map((p) => p.nombre);
  // búsqueda con errores de escritura y sin acentos
  ok(busca('chanle bleu').includes('Bleu de Chanel'), 'chanle → Chanel (letras cambiadas)');
  ok(busca('sauvaje').includes('Sauvage'), 'sauvaje → Sauvage');
  ok(busca('lancome').includes('La Vie Est Belle'), 'sin acento → Lancôme');
  ok(busca('vainilla').length >= 5, 'busca por nota');
  ok(busca('kurkdjan').includes('Baccarat Rouge 540'), 'kurkdjan → Kurkdjian');
  ok(busca('xyzw').length === 0, 'nada absurdo');
  // filtros y orden
  const muj = L.filtrar(cat, { categoria: 'mujer' }); ok(muj.length > 0 && muj.every((p) => p.genero === 'mujer'), 'categoría mujer');
  const ara = L.filtrar(cat, { categoria: 'arabe' }); ok(ara.every((p) => p.tipo === 'arabe'), 'categoría árabes');
  const rango = L.filtrar(cat, { min: 40, max: 130 }); ok(rango.every((p) => p.precio >= 40 && p.precio <= 130), 'rango de precio');
  const asc = L.filtrar(cat, { orden: 'precio_asc' }).map((p) => p.precio); ok(asc.every((v, i) => !i || asc[i - 1] <= v), 'orden precio ascendente');
  ok(L.filtrar(cat, { soloDisponibles: true }).every((p) => p.stock > 0), 'solo disponibles');
  ok(L.filtrar(cat, {}).length === cat.length, 'los agotados siguen visibles');
  ok(L.filtrar(cat, { marcas: ['Lattafa'], familias: ['Dulce'] }).every((p) => p.marca === 'Lattafa' && p.familia === 'Dulce'), 'marca+familia');
  ok(L.disponibilidad({ stock: 0 }).clase === 'encargo' && L.disponibilidad({ stock: 2 }).clase === 'pocas', 'etiquetas');

  // pedido: Bleu de Chanel tiene 3; pido 5 → 3 se descuentan, 2 por encargo; Asad (0) → todo por encargo
  const bleu = cat.find((p) => p.nombre === 'Bleu de Chanel'), asad = cat.find((p) => p.nombre === 'Asad');
  const r = await D.crearPedido({ nombre: 'Ana', telefono: '300', direccion: 'Calle 1', metodo_pago: 'contra_entrega',
    items: [{ perfume_id: bleu.id, cantidad: 5 }, { perfume_id: asad.id, cantidad: 1, precio: 0.01 }] });
  ok(r.total === bleu.precio * 5 + asad.precio, 'total con precios del catálogo (ignora precio del cliente)');
  ok(r.items[0].en_stock === 3 && r.items[0].por_encargo === 2 && r.items[1].por_encargo === 1, 'reparto stock/encargo');
  let ahora = await D.perfumes();
  ok(ahora.find((p) => p.id === bleu.id).stock === 0, 'inventario descontado');
  ok(ahora.some((p) => p.id === bleu.id), 'agotado sigue en el catálogo');
  // panel
  await assert.rejects(D.entrar('', 'mala')); ok(true, 'contraseña mala rechazada');
  await D.entrar('', 'demo123'); ok(await D.esAdmin(), 'entra con la clave demo');
  ok((await D.pedidos()).length === 1, 'pedido guardado');
  await D.cambiarEstado(r.id, 'enviado');
  await D.cambiarEstado(r.id, 'cancelado');
  ahora = await D.perfumes();
  ok(ahora.find((p) => p.id === bleu.id).stock === 3 && ahora.find((p) => p.id === asad.id).stock === 0, 'cancelar devuelve solo lo descontado');
  await assert.rejects(D.cambiarEstado(r.id, 'pendiente')); ok(true, 'cancelado no se reabre');
  // validaciones
  await assert.rejects(D.crearPedido({ nombre: 'x', telefono: '', direccion: 'y', items: [{ perfume_id: 1, cantidad: 1 }] })); ok(true, 'falta teléfono');
  await assert.rejects(D.crearPedido({ nombre: 'x', telefono: '1', direccion: 'y', items: [] })); ok(true, 'pedido vacío');
  await assert.rejects(D.crearPedido({ nombre: 'x', telefono: '1', direccion: 'y', items: [{ perfume_id: 999, cantidad: 1 }] })); ok(true, 'perfume inexistente');
  await assert.rejects(D.crearPedido({ nombre: 'x', telefono: '1', direccion: 'y', items: [{ perfume_id: 1, cantidad: -3 }] })); ok(true, 'cantidad negativa');
  // alta de perfume desde el panel
  await D.guardarPerfume({ nombre: 'Prueba', marca: 'Casa', genero: 'unisex', tipo: 'nicho', precio: '10', stock: '2', visible: true });
  ok((await D.perfumes()).some((p) => p.nombre === 'Prueba' && p.stock === 2 && p.precio === 10), 'alta de perfume');

  // cada #id que usa el código existe en su página
  for (const [js, html] of [['tienda.js', 'index.html'], ['admin.js', 'admin.html']]) {
    const codigo = fs.readFileSync(__dirname + '/' + js, 'utf8'), pagina = fs.readFileSync(__dirname + '/' + html, 'utf8');
    const ids = [...codigo.matchAll(/\$\('#([\w-]+)/g)].map((m) => m[1]);
    const faltan = [...new Set(ids)].filter((id) => !pagina.includes(`id="${id}"`) && !codigo.includes(`id="${id}"`));
    ok(!faltan.length, `${html}: faltan ids ${faltan}`);
  }
  // el catálogo de 500 (catalogo.js): forma, fotos y modo WhatsApp, en un contexto aparte para no mezclar con el demo
  const ctx = { console };
  ctx.window = ctx; ctx.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  vm.createContext(ctx);
  for (const f of ['logica.js', 'catalogo.js']) vm.runInContext(fs.readFileSync(__dirname + '/' + f, 'utf8'), ctx, { filename: f });
  ctx.TIENDA_CONFIG = Object.assign({}, globalThis.TIENDA_CONFIG, { whatsapp: '57 300 123 4567' });
  vm.runInContext(fs.readFileSync(__dirname + '/datos.js', 'utf8'), ctx, { filename: 'datos.js' });
  const C5 = ctx.CATALOGO;
  ok(C5.length === 500, 'catálogo de 500');
  ok(new Set(C5.map((p) => p.id)).size === 500, 'ids únicos');
  const sinFoto = C5.filter((p) => !p.imagen_url || !fs.existsSync(__dirname + '/' + p.imagen_url));
  ok(!sinFoto.length, `fotos que faltan: ${sinFoto.slice(0, 5).map((p) => p.imagen_url)}`);
  ok(C5.every((p) => p.precio > 0 && p.nombre && p.marca), 'precio, nombre y marca en todos');
  const FAM = ['Floral', 'Dulce', 'Cítrica', 'Amaderada', 'Oriental', 'Frutal', 'Aromática', 'Fresca', 'Cuero y oud'];
  ok(C5.every((p) => FAM.includes(p.familia)), 'familias válidas');
  ok(C5.every((p) => ['hombre', 'mujer', 'unisex'].includes(p.genero) && ['disenador', 'nicho', 'arabe'].includes(p.tipo)), 'género y tipo válidos');
  const W = ctx.Datos; ok(W.modo === 'whatsapp', 'con número de WhatsApp entra en modo whatsapp');
  ok((await W.perfumes()).length === 500, 'modo whatsapp muestra los 500');
  const pw = await W.crearPedido({ nombre: 'Ana', telefono: '300', direccion: 'Calle 1', metodo_pago: 'transferencia', items: [{ perfume_id: C5[0].id, cantidad: 2 }] });
  ok(pw.total === C5[0].precio * 2, 'modo whatsapp calcula el total');
  console.log(`TODAS OK (${n} comprobaciones)`);
})().catch((e) => { console.error('FALLA:', e.message); process.exit(1); });
