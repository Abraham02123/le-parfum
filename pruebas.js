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
globalThis.TIENDA_CONFIG = Object.assign({}, globalThis.TIENDA_CONFIG, { whatsapp: '', supabaseUrl: '', supabaseKey: '', hojaCatalogo: '' });
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
  ok(L.disponibilidad({ stock: 0 }).clase === 'encargo' && L.disponibilidad({ stock: 2 }).clase === 'ok' && L.disponibilidad({ disponible: 'sin_caja' }).texto === 'Disponible: saldo sin caja', 'etiquetas (27-nov: con caja / sin caja / no disponible)');

  // pedido: Bleu de Chanel tiene 3; pido 5 → 3 se descuentan, 2 por encargo; Asad (0) → todo por encargo
  const bleu = cat.find((p) => p.nombre === 'Bleu de Chanel'), asad = cat.find((p) => p.nombre === 'Asad');
  const r = await D.crearPedido({ nombre: 'Ana', telefono: '300', direccion: 'Calle 1', metodo_pago: 'contra_entrega',
    items: [{ perfume_id: bleu.id, cantidad: 5 }, { perfume_id: asad.id, cantidad: 1, precio: 0.01 }] });
  ok(r.total === bleu.precio * 5 + asad.precio, 'total con precios del catálogo (ignora precio del cliente)');
  ok(r.items[0].en_stock === 5 && r.items[0].por_encargo === 0 && r.items[1].por_encargo === 1, 'reparto disponible / te lo conseguimos (27-nov: la disponibilidad es sí o no por versión, no por unidades)');
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
  ok((await D.crearPedido({ items: [{ perfume_id: 1, cantidad: 1 }] })).items.length === 1, 'pedido sin ningún dato del cliente se acepta');
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
  // ── 27-nov: con caja / sin caja ──
  const escal = new Set(C5.map((p) => `${p.precio_sin_caja}/${p.precio_con_caja}`));
  ok([...escal].every((e) => ['750/1750', '850/1850', '950/1950', '950/2500'].includes(e)) && escal.size === 4, 'los 4 escalones de precio: ' + [...escal]);
  ok(C5.every((p) => p.precio === p.precio_sin_caja && p.disponible === 'no'), 'precio = sin caja y todo «no disponible» hasta que la hoja diga otra cosa');
  ok(C5.filter((p) => p.marca === 'Le Labo').every((p) => p.precio_con_caja === 2500), 'Le Labo con caja a 2500');
  const p0 = C5[0];
  const pc = await W.crearPedido({ items: [{ perfume_id: p0.id, caja: 'con', cantidad: 1 }, { perfume_id: p0.id, caja: 'sin', cantidad: 2 }] });
  ok(pc.total === p0.precio_con_caja + 2 * p0.precio_sin_caja, 'un perfume con caja y otro sin caja suman cada uno su precio');
  ok(pc.items[0].nombre.endsWith(', con caja') && pc.items[1].nombre.endsWith(', sin caja') && pc.items.every((l) => l.por_encargo === l.cantidad), 'cada línea dice su versión y va «te lo conseguimos»');
  const t = fs.readFileSync(__dirname + '/tienda.js', 'utf8');
  ok(!/este pedido \(\$\{r\.id\}\)/.test(t) && t.includes("'Hola, quiero hacer este pedido:'"), 'el mensaje de WhatsApp ya no lleva el código del pedido');
  ok(!/whatsapp-listo'\)\.addEventListener\('click'[^\n]*carrito = \[\]/.test(t), 'enviar por WhatsApp no vacía el carrito');
  ok(!t.includes('e.target.reset()'), 'el formulario conserva lo escrito');
  // hoja de Google: precios con formatos de México y de Excel en español, disponibilidad con palabras, filas mal escritas ignoradas
  ok(L.pesos('$1,950.00') === 1950 && L.pesos('1.950,00') === 1950 && L.pesos('950') === 950, 'precios escritos de varias formas');
  ok(['con caja', 'sin caja', 'con y sin caja', 'no disponible'].map(L.leerDisponible).join() === 'con_caja,sin_caja,ambas,no', 'las 4 palabras de disponibilidad');
  const csv = 'id,marca,nombre,Sin caja,Con caja,Disponible,Visible\n' + `${p0.id},x,x,"$800","2,100",con y sin caja,si\n${C5[1].id},x,x,abc,5,,no\n`;
  const h = L.aplicarHoja(C5, csv), a0 = h.lista.find((p) => p.id === p0.id), a1 = h.lista.find((p) => p.id === C5[1].id);
  ok(a0.precio_sin_caja === 800 && a0.precio_con_caja === 2100 && a0.disponible === 'ambas' && a0.precio === 800, 'la hoja cambia precios y disponibilidad');
  ok(a1.precio_sin_caja === C5[1].precio_sin_caja && a1.precio_con_caja === C5[1].precio_con_caja && a1.visible === false, 'una celda mal escrita deja el precio como estaba');
  ok(h.coinciden === 2 && C5[0].precio_sin_caja !== 800, 'la hoja no modifica el catálogo original');
  ok(L.urlHoja('https://docs.google.com/spreadsheets/d/ABC_123/edit?usp=sharing') === 'https://docs.google.com/spreadsheets/d/ABC_123/gviz/tq?tqx=out:csv&headers=1', 'enlace de la hoja → CSV');
  // Épocas del año (27-nov): se escriben a mano en precios.csv, varias a la vez, con o sin acento.
  ok(L.leerTemporadas('primavera / VERANO').join() === 'Primavera,Verano' && L.leerTemporadas('otono, invierno').join() === 'Otoño,Invierno', 'épocas escritas de varias formas');
  ok(L.leerTemporadas('todo el año').length === 4 && L.leerTemporadas('xyz') === null && L.leerTemporadas('') === null, 'todo el año / texto inválido');
  const est = [{ id: 1, nombre: 'a', marca: 'm', temporadas: ['Verano'] }, { id: 2, nombre: 'b', marca: 'm', temporadas: ['Invierno', 'Otoño'] }, { id: 3, nombre: 'c', marca: 'm' }].map((p) => L.normalizar(p));
  ok(L.filtrar(est, { temporadas: ['Otoño'] }).map((p) => p.id).join() === '2' && L.filtrar(est, { temporadas: ['Verano', 'Otoño'] }).length === 2 && L.filtrar(est, { temporadas: [] }).length === 3, 'filtro por época (cualquiera de las elegidas)');
  ok(/primavera y verano/i.test(L.textoTemporadas({ temporadas: ['Primavera', 'Verano'] })) && /todo el año/i.test(L.textoTemporadas({ temporadas: L.TEMPORADAS })), 'texto de las épocas');
  const ht = L.aplicarHoja(C5, `id,temporadas\n${p0.id},Invierno\n${C5[1].id},zzz\n`);
  ok(ht.lista.find((p) => p.id === p0.id).temporadas.join() === 'Invierno' && JSON.stringify(ht.lista.find((p) => p.id === C5[1].id).temporadas) === JSON.stringify(L.normalizar({ ...C5[1] }).temporadas), 'precios.csv cambia la época; una mal escrita deja la que había');
  ok(L.urlHoja('precios.csv') === 'precios.csv' && globalThis.TIENDA_CONFIG && fs.readFileSync(__dirname + '/config.js', 'utf8').includes("hojaCatalogo: 'precios.csv'"), 'la tienda lee precios.csv');
  // El catálogo real: cada perfume con al menos una época válida, y precios.csv con exactamente los mismos perfumes.
  const sb = { window: {} }; sb.globalThis = sb.window; vm.createContext(sb);
  vm.runInContext(fs.readFileSync(__dirname + '/catalogo.js', 'utf8'), sb);
  const real = sb.window.CATALOGO || sb.CATALOGO;
  ok(real.length > 100 && real.every((p) => (p.temporadas || []).length >= 1 && p.temporadas.every((t) => L.TEMPORADAS.includes(t))), 'cada perfume del catálogo tiene su época');
  const filasCsv = L.leerCsv(fs.readFileSync(__dirname + '/precios.csv', 'utf8'));
  ok(filasCsv.map((r) => +r.id).sort((a, b) => a - b).join() === real.map((p) => p.id).sort((a, b) => a - b).join(), 'precios.csv trae los mismos perfumes que el catálogo');
  const hr = L.aplicarHoja(real, fs.readFileSync(__dirname + '/precios.csv', 'utf8'));
  ok(hr.coinciden === real.length && hr.lista.every((p) => p.precio_sin_caja >= 50 && p.temporadas.length), 'precios.csv se lee entero y sin precios rotos');
  ok(fs.readFileSync(__dirname + '/index.html', 'utf8').includes('id="f-temporadas"'), 'la tienda tiene el filtro de época');
  ok(fs.existsSync(__dirname + '/precios.html') && fs.existsSync(__dirname + '/precios.js') && fs.existsSync(__dirname + '/ficha.js'), 'editor del celular y refresco de páginas presentes');
  const pj = fs.readFileSync(__dirname + '/precios.js', 'utf8');
  ok(pj.includes("email: 'tienda@localhost'") && !/ghp_|github_pat_/.test(pj), 'el editor firma sin correo personal y no lleva ninguna clave dentro');
  console.log(`TODAS OK (${n} comprobaciones)`);
})().catch((e) => { console.error('FALLA:', e.message); process.exit(1); });
