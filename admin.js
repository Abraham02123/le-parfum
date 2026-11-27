// Panel privado: pedidos (cambiar estado, cancelar devuelve existencias) y perfumes (alta, edición, inventario).
(function () {
  const C = window.TIENDA_CONFIG, L = window.Logica, D = window.Datos;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dinero = (n) => L.dinero(n, C);
  // Las mismas palabras que precios.csv (27-nov); la tienda las vuelve a leer igual.
  const DISP_TEXTO = { con_caja: 'con caja', sin_caja: 'sin caja', ambas: 'con y sin caja', no: 'no disponible' };
  const SIGUIENTE = { pendiente: ['confirmado', 'enviado', 'entregado', 'cancelado'], confirmado: ['enviado', 'entregado', 'cancelado'],
    enviado: ['entregado', 'cancelado'], entregado: ['cancelado'], cancelado: [] };
  let perfumes = [], pedidos = [];

  function aviso(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(aviso.t); aviso.t = setTimeout(() => (el.hidden = true), 2400); }
  const intentar = async (fn, ok) => { try { await fn(); if (ok) aviso(ok); await recargar(); } catch (e) { aviso('Error: ' + e.message); } };

  async function recargar() {
    [perfumes, pedidos] = await Promise.all([D.todosPerfumes(), D.pedidos()]);
    pintarResumen(); pintarPedidos(); pintarPerfumes();
  }

  function pintarResumen() {
    const activos = pedidos.filter((o) => o.estado !== 'cancelado');
    const pend = pedidos.filter((o) => o.estado === 'pendiente').length;
    const encargo = activos.filter((o) => !['entregado'].includes(o.estado)).reduce((s, o) => s + o.items.reduce((a, l) => a + (l.por_encargo || 0), 0), 0);
    const ventas = pedidos.filter((o) => o.estado === 'entregado').reduce((s, o) => s + +o.total, 0);
    const sinStock = perfumes.filter((p) => p.visible && !L.hayAlgo(p)).length;
    $('#resumen').innerHTML = [['Pedidos pendientes', pend], ['Unidades por conseguir (encargo)', encargo],
      ['Vendido (entregado)', dinero(ventas)], ['Perfumes no disponibles', sinStock]]
      .map(([t, v]) => `<div><small>${t}</small><b>${v}</b></div>`).join('');
  }

  function pintarPedidos() {
    const est = $('#filtro-estado').value, enc = $('#solo-encargo').checked;
    const lista = pedidos.filter((o) => (!est || o.estado === est) && (!enc || o.items.some((l) => l.por_encargo > 0)));
    $('#lista-pedidos').innerHTML = lista.length ? lista.map((o) => {
      const tel = String(o.telefono || '').replace(/\D/g, '');
      return `<article class="pedido"><header>
        <h3>#${o.id}</h3><span class="estado ${o.estado}">${o.estado}</span>
        <span style="color:var(--suave)">${new Date(o.creado).toLocaleString(C.idioma)}</span>
        <span style="margin-left:auto"><b>${dinero(o.total)}</b> · ${{ contra_entrega: 'contra entrega', transferencia: 'transferencia', en_linea: 'en línea' }[o.metodo_pago] || o.metodo_pago}${o.pagado ? ' · <span style="color:var(--ok)">pagado</span>' : ''}</span></header>
        <p style="margin:8px 0 0">${esc(o.nombre)} · ${esc(o.telefono)} · ${esc(o.direccion)}${o.ciudad ? ', ' + esc(o.ciudad) : ''}</p>
        ${o.notas ? `<p style="margin:4px 0;color:var(--suave)">Nota: ${esc(o.notas)}</p>` : ''}
        <ul>${o.items.map((l) => `<li>${l.cantidad} × ${esc(l.nombre)} · ${dinero(l.precio)}${l.por_encargo ? ` <b style="color:var(--encargo)">(${l.por_encargo} por encargo)</b>` : ''}</li>`).join('')}</ul>
        <div class="barra-admin" style="margin:0">
          ${SIGUIENTE[o.estado].length ? `<select data-estado="${o.id}"><option value="">Cambiar estado…</option>${SIGUIENTE[o.estado].map((e) => `<option>${e}</option>`).join('')}</select>` : ''}
          ${o.estado !== 'cancelado' ? `<label class="casilla" style="margin:0"><input type="checkbox" data-pagado="${o.id}" ${o.pagado ? 'checked' : ''}> Pagado</label>` : ''}
          ${tel ? `<a class="btn btn-borde" style="padding:6px 14px" target="_blank" rel="noopener" href="https://wa.me/${tel}">WhatsApp al cliente</a>` : ''}
        </div></article>`;
    }).join('') : '<p class="vacio">No hay pedidos con ese filtro.</p>';
  }

  function pintarPerfumes() {
    const q = $('#buscar-admin').value;
    const lista = perfumes.filter((p) => L.coincide(p, q)).sort((a, b) => a.marca.localeCompare(b.marca) || a.nombre.localeCompare(b.nombre));
    $('#tabla-perfumes').innerHTML = lista.map((p) => `<tr class="${p.visible ? '' : 'oculto'}">
      <td><b>${esc(p.marca)}</b> · ${esc(p.nombre)}<br><small style="color:var(--suave)">${esc([p.concentracion, p.ml && p.ml + ' ml'].filter(Boolean).join(' · '))}</small></td>
      <td class="opc">${esc(p.genero)} · ${esc({ arabe: 'árabe', disenador: 'diseñador', nicho: 'nicho' }[p.tipo] || p.tipo || '')}</td>
      <td>${dinero(L.precioDe(p, 'sin'))} sin caja<br>${dinero(L.precioDe(p, 'con'))} con caja</td>
      <td>${esc(DISP_TEXTO[L.normalizar({ ...p }).disponible])}</td>
      <td class="opc">${p.visible ? 'sí' : 'oculto'}</td>
      <td><button class="enlace" data-editar="${p.id}">Editar</button></td></tr>`).join('');
    $('#lista-marcas').innerHTML = [...new Set(perfumes.map((p) => p.marca))].map((m) => `<option value="${esc(m)}">`).join('');
    $('#lista-familias').innerHTML = [...new Set(perfumes.map((p) => p.familia).filter(Boolean))].map((m) => `<option value="${esc(m)}">`).join('');
  }

  function editar(p) {
    const fm = $('#form-perfume'); fm.reset();
    $('#titulo-editar').textContent = p ? `${p.marca} · ${p.nombre}` : 'Nuevo perfume';
    if (p) for (const el of fm.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') el.checked = !!p[el.name]; else el.value = Array.isArray(p[el.name]) ? p[el.name].join(' / ') : p[el.name] ?? '';
    }
    $('#error-perfume').hidden = true; $('#capa-editar').hidden = false;
  }

  function eventos() {
    document.querySelectorAll('[data-pestana]').forEach((b) => b.onclick = () => {
      document.querySelectorAll('[data-pestana]').forEach((x) => x.classList.toggle('activo', x === b));
      $('#pestana-pedidos').hidden = b.dataset.pestana !== 'pedidos'; $('#pestana-perfumes').hidden = b.dataset.pestana !== 'perfumes';
    });
    $('#filtro-estado').onchange = pintarPedidos; $('#solo-encargo').onchange = pintarPedidos;
    $('#buscar-admin').oninput = pintarPerfumes;
    $('#lista-pedidos').onchange = (e) => {
      const el = e.target;
      if (el.dataset.estado && el.value) {
        const id = +el.dataset.estado;
        if (el.value === 'cancelado' && !confirm('¿Cancelar el pedido? Las unidades que se habían descontado vuelven al inventario.')) { el.value = ''; return; }
        intentar(() => D.cambiarEstado(id, el.value), `Pedido #${id}: ${el.value}`);
      }
      if (el.dataset.pagado) intentar(() => D.marcarPagado(+el.dataset.pagado, el.checked));
    };
    $('#tabla-perfumes').onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const p = perfumes.find((x) => x.id === +(b.dataset.mas || b.dataset.editar));
      if (b.dataset.editar) editar(p);
      if (b.dataset.mas) intentar(() => D.guardarPerfume({ ...p, stock: Math.max(0, p.stock + +b.dataset.c) }));
    };
    $('#nuevo').onclick = () => editar(null);
    $('#form-perfume').onsubmit = (e) => {
      e.preventDefault();
      const fm = e.target, p = {};
      for (const el of fm.elements) if (el.name) p[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
      if (p.id) p.id = +p.id; else delete p.id;
      p.temporadas = L.leerTemporadas(p.temporadas) || [];
      for (const k of ['imagen_url', 'descripcion', 'notas_salida', 'notas_corazon', 'notas_fondo', 'familia', 'precio_antes', 'ml']) if (p[k] === '') p[k] = null;
      intentar(async () => { await D.guardarPerfume(p); $('#capa-editar').hidden = true; }, 'Guardado');
    };
    $('#capa-editar').onclick = (e) => { if (e.target.id === 'capa-editar' || e.target.closest('[data-cerrar]')) $('#capa-editar').hidden = true; };
    $('#salir').onclick = async () => { await D.salir(); location.reload(); };
    hoja();
  }

  // ── Hoja de precios y existencias (CSV con «;», como lo abre Excel en español) ──────────────────
  const bajar = (nombre, texto, tipo) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: tipo })); a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const celda = (v) => (/[;"\n]/.test(String(v ?? '')) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v ?? ''));
  function leerCsv(texto) {
    const lineas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
    const sep = (lineas[0].match(/;/g) || []).length >= (lineas[0].match(/,/g) || []).length ? ';' : ',';
    const partir = (l) => { const out = []; let cur = '', q = false;
      for (let i = 0; i < l.length; i++) { const c = l[i];
        if (q) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
        else if (c === '"') q = true; else if (c === sep) { out.push(cur); cur = ''; } else cur += c; }
      out.push(cur); return out.map((x) => x.trim()); };
    const cab = partir(lineas[0]).map((x) => x.toLowerCase());
    return lineas.slice(1).map((l) => Object.fromEntries(partir(l).map((v, i) => [cab[i], v])));
  }
  const numero = (v) => { const t = String(v ?? '').replace(/\s/g, '').replace(/[^\d.,-]/g, '');
    if (!t) return NaN; return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t); };
  function hoja() {
    const local = D.modo !== 'supabase';
    $('#bajar-catalogo').hidden = !local; $('#reiniciar-local').hidden = !local; $('#nota-modo').hidden = D.modo !== 'whatsapp';
    $('#bajar-hoja').onclick = () => {
      // Mismas columnas que precios.csv de la tienda.
      const filas = [['id', 'marca', 'nombre', 'sin caja', 'con caja', 'disponible', 'temporadas', 'visible']]
        .concat(perfumes.map((p) => { const n = L.normalizar({ ...p });
          return [n.id, n.marca, n.nombre, n.precio_sin_caja, n.precio_con_caja, DISP_TEXTO[n.disponible], n.temporadas.join(' / '), n.visible ? 'si' : 'no']; }));
      bajar('precios_y_disponibilidad.csv', '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
    };
    $('#subir-hoja').onchange = async (e) => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      // Se lee igual que precios.csv (L.aplicarHoja): sin caja · con caja · disponible · temporadas · visible.
      const r = L.aplicarHoja(perfumes, await f.text()), porId = new Map(perfumes.map((p) => [p.id, L.normalizar({ ...p })]));
      const malas = r.filas - r.coinciden > 0 ? [`${r.filas - r.coinciden} con un id que no existe`] : [], cambios = [];
      for (const n of r.lista) {
        const p = porId.get(n.id), c = { id: n.id };
        for (const k of ['precio_sin_caja', 'precio_con_caja', 'precio', 'disponible', 'temporadas', 'visible']) if (JSON.stringify(n[k]) !== JSON.stringify(p[k])) c[k] = n[k];
        if (Object.keys(c).length > 1) cambios.push(c);
      }
      if (!cambios.length) return aviso(malas.length ? `Nada cambiado. Filas con error: ${malas.slice(0, 8).join(', ')}` : 'La hoja no trae cambios');
      if (!confirm(`Se van a cambiar ${cambios.length} ${cambios.length === 1 ? 'perfume' : 'perfumes'}.` + (malas.length ? ` Se saltan ${malas.length} filas con error (filas ${malas.slice(0, 8).join(', ')}).` : '') + ' ¿Seguir?')) return;
      await intentar(() => D.guardarVarios(cambios), cambios.length === 1 ? '1 perfume actualizado' : `${cambios.length} perfumes actualizados`);
    };
    $('#bajar-catalogo').onclick = async () => {
      const todos = await D.todosPerfumes();
      bajar('catalogo.js', `// Catálogo exportado desde el panel el ${new Date().toLocaleString()}\nwindow.CATALOGO_VERSION = '${Date.now()}';\nwindow.CATALOGO = ${JSON.stringify(todos)};\n`, 'text/javascript;charset=utf-8');
    };
    $('#reiniciar-local').onclick = async () => {
      if (!confirm('Se borran los cambios hechos en este navegador y vuelve el catálogo publicado. ¿Seguir?')) return;
      D.reiniciarLocal(); await recargar(); aviso('Vuelto al catálogo publicado');
    };
  }

  async function iniciar() {
    $('#aviso-demo').hidden = D.modo !== 'demo';
    $('#nombre-tienda').textContent = C.nombre;
    if (D.modo === 'demo') $('#campo-email').hidden = true;
    if (!(await D.esAdmin())) {
      $('#capa-entrar').hidden = false;
      $('#form-entrar').onsubmit = async (e) => {
        e.preventDefault(); const fd = new FormData(e.target);
        try { await D.entrar(fd.get('email'), fd.get('clave')); location.reload(); }
        catch (err) { $('#error-entrar').textContent = err.message; $('#error-entrar').hidden = false; }
      };
      return;
    }
    $('#app').hidden = false; eventos(); await recargar();
  }
  iniciar();
})();
