// Capa de datos. Tres modos con la MISMA interfaz (lo elige config.js):
//  · supabase → base de datos real en la nube (plan gratis): el inventario baja solo con cada venta.
//  · whatsapp → sin base de datos: el catálogo sale de catalogo.js y el pedido llega a tu WhatsApp ya escrito.
//               Sirve para publicar YA; el inventario no baja solo (lo cambias tú en el catálogo).
//  · demo     → ni base ni WhatsApp: todo queda en el navegador de quien la abre. Solo para mirar.
(function (g) {
  const C = g.TIENDA_CONFIG, L = g.Logica;
  const modo = C.supabaseUrl && C.supabaseKey ? 'supabase' : String(C.whatsapp || '').replace(/\D/g, '') ? 'whatsapp' : 'demo';
  const sb = modo === 'supabase' ? g.supabase.createClient(C.supabaseUrl, C.supabaseKey) : null;
  // La versión del catálogo va en la clave: al publicar un catalogo.js nuevo, el navegador no se queda con la copia vieja.
  const base = g.CATALOGO || g.DEMO_CATALOGO || [];
  const K = { p: 'tienda_perfumes_' + (g.CATALOGO_VERSION || 'demo'), o: 'tienda_pedidos', s: 'tienda_admin_sesion' };
  const ls = g.localStorage;
  const leer = (k, d) => { try { return JSON.parse(ls.getItem(k)) ?? d; } catch { return d; } };
  const guardar = (k, v) => { try { ls.setItem(k, JSON.stringify(v)); } catch (e) { throw new Error('El navegador no deja guardar más datos (' + e.message + ')'); } };
  const fallo = (error) => { if (error) throw new Error(error.message || String(error)); };
  const desdeArchivo = () => base.map((x, i) => ({ id: x.id ?? i + 1, visible: true, destacado: false, stock: 0,
    creado: new Date(Date.now() - i * 864e5).toISOString(), ...x }));

  // Copia local editable (panel en modo demo/whatsapp y tienda en modo demo).
  function demoPerfumes() {
    let p = leer(K.p, null);
    if (!p) { p = desdeArchivo(); guardar(K.p, p); }
    return p;
  }

  const Datos = {
    modo,

    // ── Tienda (cualquier visitante) ──────────────────────────────────────
    async perfumes() {
      if (modo === 'whatsapp') return desdeArchivo().filter((p) => p.visible);
      if (modo === 'demo') return demoPerfumes().filter((p) => p.visible);
      const { data, error } = await sb.from('perfumes').select('*').eq('visible', true); fallo(error);
      return data;
    },

    // ped = { nombre, telefono, direccion, ciudad, notas, metodo_pago, items:[{perfume_id, cantidad}] }
    async crearPedido(ped) {
      for (const c of ['nombre', 'telefono', 'direccion']) if (!String(ped[c] || '').trim()) throw new Error('Falta ' + c);
      if (modo === 'whatsapp') {
        // Sin base de datos no hay número correlativo ni inventario compartido: el pedido se arma aquí
        // (con los precios del catálogo, no los del carrito) y se manda por WhatsApp.
        const r = L.repartirPedido(ped.items, desdeArchivo());
        const id = 'W' + Date.now().toString(36).slice(-5).toUpperCase();
        return { id, total: r.total, items: r.lineas };
      }
      if (modo === 'demo') {
        const ps = demoPerfumes();
        const r = L.repartirPedido(ped.items, ps);
        r.lineas.forEach((l) => { ps.find((x) => x.id === l.perfume_id).stock -= l.en_stock; });
        const os = leer(K.o, []);
        const id = os.reduce((m, o) => Math.max(m, o.id), 1000) + 1;
        const { items, ...campos } = ped;
        os.push({ id, creado: new Date().toISOString(), estado: 'pendiente', pagado: false, ...campos,
          total: r.total, items: r.lineas });
        guardar(K.p, ps); guardar(K.o, os);
        return { id, total: r.total, items: r.lineas };
      }
      const { data, error } = await sb.rpc('crear_pedido', { datos: ped }); fallo(error);
      return data;
    },

    // ── Panel privado ────────────────────────────────────────────────────
    async entrar(email, clave) {
      if (modo !== 'supabase') {
        if (clave !== C.claveDemoAdmin) throw new Error('Contraseña incorrecta');
        ls.setItem(K.s, '1'); return true;
      }
      const { error } = await sb.auth.signInWithPassword({ email, password: clave }); fallo(error);
      if (!(await Datos.esAdmin())) { await sb.auth.signOut(); throw new Error('Esa cuenta no es administradora'); }
      return true;
    },
    async salir() { if (modo !== 'supabase') ls.removeItem(K.s); else await sb.auth.signOut(); },
    async esAdmin() {
      if (modo !== 'supabase') return ls.getItem(K.s) === '1';
      const { data, error } = await sb.rpc('es_admin'); return !error && data === true;
    },

    async todosPerfumes() {
      if (modo !== 'supabase') return demoPerfumes();
      const { data, error } = await sb.from('perfumes').select('*').order('marca'); fallo(error); return data;
    },
    async guardarPerfume(p) {
      const limpio = { ...p, precio: +p.precio, precio_antes: p.precio_antes ? +p.precio_antes : null,
        stock: Math.max(0, Math.floor(+p.stock || 0)), ml: p.ml ? +p.ml : null };
      if (modo !== 'supabase') {
        const ps = demoPerfumes();
        if (limpio.id) Object.assign(ps.find((x) => x.id === limpio.id), limpio);
        else ps.push({ ...limpio, id: ps.reduce((m, x) => Math.max(m, x.id), 0) + 1, creado: new Date().toISOString() });
        guardar(K.p, ps); return;
      }
      const { id, creado, ...resto } = limpio;
      if (Array.isArray(resto.acordes) === false) delete resto.acordes;
      const q = id ? sb.from('perfumes').update(resto).eq('id', id) : sb.from('perfumes').insert(resto);
      const { error } = await q; fallo(error);
    },

    // Cambios en bloque (importar una hoja de precios y existencias): [{id, precio, stock, ...}]
    async guardarVarios(lista) {
      if (modo !== 'supabase') {
        const ps = demoPerfumes(), porId = new Map(ps.map((x) => [x.id, x]));
        for (const c of lista) if (porId.has(c.id)) Object.assign(porId.get(c.id), c);
        guardar(K.p, ps); return lista.length;
      }
      for (let i = 0; i < lista.length; i++) {
        const { id, ...resto } = lista[i];
        const { error } = await sb.from('perfumes').update(resto).eq('id', id); fallo(error);
      }
      return lista.length;
    },
    // Restaurar la copia local al catálogo publicado (descarta cambios locales del panel).
    reiniciarLocal() { ls.removeItem(K.p); },

    async pedidos() {
      if (modo !== 'supabase') return leer(K.o, []).slice().reverse();
      const { data, error } = await sb.from('pedidos').select('*, items:pedido_items(*)').order('creado', { ascending: false });
      fallo(error); return data;
    },
    // Cancelar devuelve al inventario lo que se había descontado (no lo que era «por encargo»).
    async cambiarEstado(id, estado) {
      if (modo !== 'supabase') {
        const os = leer(K.o, []), o = os.find((x) => x.id === id);
        if (!o || o.estado === 'cancelado') throw new Error('Un pedido cancelado no se puede reabrir');
        if (estado === 'cancelado') {
          const ps = demoPerfumes();
          o.items.forEach((l) => { const p = ps.find((x) => x.id === l.perfume_id); if (p) p.stock += l.en_stock; });
          guardar(K.p, ps);
        }
        o.estado = estado; guardar(K.o, os); return;
      }
      const { error } = await sb.rpc('cambiar_estado_pedido', { p_id: id, p_estado: estado }); fallo(error);
    },
    async marcarPagado(id, pagado) {
      if (modo !== 'supabase') { const os = leer(K.o, []); os.find((x) => x.id === id).pagado = pagado; guardar(K.o, os); return; }
      const { error } = await sb.from('pedidos').update({ pagado }).eq('id', id); fallo(error);
    },
  };

  g.Datos = Datos;
})(typeof window !== 'undefined' ? window : globalThis);
