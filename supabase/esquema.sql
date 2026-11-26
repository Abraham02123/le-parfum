-- ═══════════════════════════════════════════════════════════════════════════
--  Base de datos de la tienda (Supabase, plan gratis).
--  Cómo usarlo: Supabase → tu proyecto → SQL Editor → pegar TODO esto → Run.
--  Se puede correr varias veces sin romper nada.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists perfumes (
  id            bigint generated always as identity primary key,
  nombre        text not null,
  marca         text not null,
  genero        text check (genero in ('mujer','hombre','unisex')),
  tipo          text check (tipo in ('arabe','disenador','nicho')),
  familia       text,
  concentracion text,
  ml            int,
  precio        numeric(12,2) not null check (precio >= 0),
  precio_antes  numeric(12,2),
  stock         int not null default 0 check (stock >= 0),
  descripcion   text,
  notas_salida  text, notas_corazon text, notas_fondo text,
  imagen_url    text,
  destacado     boolean not null default false,
  visible       boolean not null default true,   -- los agotados SIGUEN visibles; esto es solo para ocultar a mano
  creado        timestamptz not null default now()
);

create table if not exists pedidos (
  id          bigint generated always as identity (start with 1001) primary key,
  creado      timestamptz not null default now(),
  nombre      text not null, telefono text not null, direccion text not null, ciudad text, notas text,
  metodo_pago text not null default 'contra_entrega' check (metodo_pago in ('contra_entrega','en_linea')),
  estado      text not null default 'pendiente' check (estado in ('pendiente','confirmado','enviado','entregado','cancelado')),
  total       numeric(12,2) not null,
  pagado      boolean not null default false
);

create table if not exists pedido_items (
  id          bigint generated always as identity primary key,
  pedido_id   bigint not null references pedidos on delete cascade,
  perfume_id  bigint references perfumes on delete set null,
  nombre      text not null,
  precio      numeric(12,2) not null,
  cantidad    int not null check (cantidad > 0),
  en_stock    int not null default 0,     -- unidades que se descontaron del inventario
  por_encargo int not null default 0      -- unidades que hay que conseguir
);

-- Quién puede entrar al panel: se añade a mano (ver LEEME.md, paso 4).
create table if not exists admins (user_id uuid primary key references auth.users on delete cascade);

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ── Reglas de acceso ─────────────────────────────────────────────────────
alter table perfumes     enable row level security;
alter table pedidos      enable row level security;
alter table pedido_items enable row level security;
alter table admins       enable row level security;

drop policy if exists "ver catalogo" on perfumes;
create policy "ver catalogo" on perfumes for select using (visible or es_admin());
drop policy if exists "admin perfumes" on perfumes;
create policy "admin perfumes" on perfumes for all using (es_admin()) with check (es_admin());
drop policy if exists "admin pedidos" on pedidos;
create policy "admin pedidos" on pedidos for all using (es_admin()) with check (es_admin());
drop policy if exists "admin items" on pedido_items;
create policy "admin items" on pedido_items for all using (es_admin()) with check (es_admin());
-- Los clientes NO leen ni escriben pedidos directamente: solo a través de crear_pedido().

-- ── Crear un pedido (lo llama la tienda) ─────────────────────────────────
-- El precio sale de la base, no del navegador. Lo que hay en existencias se descuenta;
-- lo que falta queda «por encargo». Todo en una sola operación: o entra completo o no entra.
create or replace function crear_pedido(datos jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id bigint; v_total numeric := 0; it jsonb; p perfumes%rowtype;
  v_cant int; v_en int; v_items jsonb := '[]'::jsonb;
begin
  if coalesce(trim(datos->>'nombre'),'') = '' or coalesce(trim(datos->>'telefono'),'') = ''
     or coalesce(trim(datos->>'direccion'),'') = '' then
    raise exception 'Faltan nombre, teléfono o dirección';
  end if;
  if jsonb_typeof(datos->'items') <> 'array' or jsonb_array_length(datos->'items') = 0 then
    raise exception 'El pedido está vacío';
  end if;
  if jsonb_array_length(datos->'items') > 30 then raise exception 'Demasiadas líneas'; end if;

  insert into pedidos (nombre, telefono, direccion, ciudad, notas, metodo_pago, total)
  values (left(datos->>'nombre',120), left(datos->>'telefono',40), left(datos->>'direccion',300),
          left(datos->>'ciudad',80), left(datos->>'notas',500),
          coalesce(nullif(datos->>'metodo_pago',''),'contra_entrega'), 0)
  returning id into v_id;

  for it in select * from jsonb_array_elements(datos->'items') loop
    select * into p from perfumes where id = (it->>'perfume_id')::bigint and visible for update;
    if not found then raise exception 'Un perfume del carrito ya no existe'; end if;
    v_cant := floor((it->>'cantidad')::numeric);
    if v_cant is null or v_cant < 1 or v_cant > 50 then raise exception 'Cantidad no válida'; end if;
    v_en := least(greatest(p.stock,0), v_cant);
    update perfumes set stock = stock - v_en where id = p.id;
    insert into pedido_items (pedido_id, perfume_id, nombre, precio, cantidad, en_stock, por_encargo)
    values (v_id, p.id, p.marca || ' · ' || p.nombre, p.precio, v_cant, v_en, v_cant - v_en);
    v_total := v_total + p.precio * v_cant;
    v_items := v_items || jsonb_build_object('perfume_id', p.id, 'nombre', p.marca || ' · ' || p.nombre,
      'precio', p.precio, 'cantidad', v_cant, 'en_stock', v_en, 'por_encargo', v_cant - v_en);
  end loop;

  update pedidos set total = v_total where id = v_id;
  return jsonb_build_object('id', v_id, 'total', v_total, 'items', v_items);
end $$;

-- ── Cambiar el estado (lo llama el panel) ────────────────────────────────
-- Cancelar devuelve al inventario lo que se había descontado. Un cancelado no se reabre.
create or replace function cambiar_estado_pedido(p_id bigint, p_estado text) returns void
language plpgsql security definer set search_path = public as $$
declare v_actual text;
begin
  if not es_admin() then raise exception 'Solo administradores'; end if;
  select estado into v_actual from pedidos where id = p_id for update;
  if not found then raise exception 'Pedido inexistente'; end if;
  if v_actual = 'cancelado' then raise exception 'Un pedido cancelado no se puede reabrir'; end if;
  if p_estado = 'cancelado' then
    update perfumes f set stock = f.stock + i.en_stock
      from pedido_items i where i.pedido_id = p_id and i.perfume_id = f.id and i.en_stock > 0;
  end if;
  update pedidos set estado = p_estado where id = p_id;
end $$;

revoke all on function crear_pedido(jsonb) from public;
grant execute on function crear_pedido(jsonb) to anon, authenticated;
revoke all on function cambiar_estado_pedido(bigint, text) from public;
grant execute on function cambiar_estado_pedido(bigint, text) to authenticated;
grant execute on function es_admin() to anon, authenticated;
