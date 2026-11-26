// Panel privado: pedidos (cambiar estado, cancelar devuelve existencias) y perfumes (alta, edición, inventario).
(function () {
  const C = window.TIENDA_CONFIG, L = window.Logica, D = window.Datos;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dinero = (n) => L.dinero(n, C);
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
    const sinStock = perfumes.filter((p) => p.visible && p.stock <= 0).length;
    $('#resumen').innerHTML = [['Pedidos pendientes', pend], ['Unidades por conseguir (encargo)', encargo],
      ['Vendido (entregado)', dinero(ventas)], ['Perfumes sin existencias', sinStock]]
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
        <span style="margin-left:auto"><b>${dinero(o.total)}</b> · ${o.metodo_pago === 'contra_entrega' ? 'contra entrega' : 'en línea'}${o.pagado ? ' · <span style="color:var(--ok)">pagado</span>' : ''}</span></header>
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
      <td>${dinero(p.precio)}</td>
      <td><span class="stock"><button data-mas="${p.id}" data-c="-1">−</button><b>${p.stock}</b><button data-mas="${p.id}" data-c="1">+</button></span></td>
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
      if (el.type === 'checkbox') el.checked = !!p[el.name]; else el.value = p[el.name] ?? '';
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
      for (const k of ['imagen_url', 'descripcion', 'notas_salida', 'notas_corazon', 'notas_fondo', 'familia', 'precio_antes', 'ml']) if (p[k] === '') p[k] = null;
      intentar(async () => { await D.guardarPerfume(p); $('#capa-editar').hidden = true; }, 'Guardado');
    };
    $('#capa-editar').onclick = (e) => { if (e.target.id === 'capa-editar' || e.target.closest('[data-cerrar]')) $('#capa-editar').hidden = true; };
    $('#salir').onclick = async () => { await D.salir(); location.reload(); };
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
