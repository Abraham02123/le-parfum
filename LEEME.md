# Tienda de perfumes — cómo usarla

Catálogo con buscador que perdona errores de escritura, categorías, filtros, orden, carrito y pedido
**contra entrega** (el cliente paga cuando recibe). Al hacer un pedido el inventario baja solo; lo que no
hay en existencias se sigue mostrando y se puede pedir «por encargo». Panel privado para ver pedidos,
cambiar su estado y llevar el inventario.

Costo: **0**. Sin instalar nada: son archivos sueltos que se abren en el navegador.

## 1 · Probarla ya (modo demostración, 1 minuto)

- Abrir `index.html` con doble clic → la tienda con 18 perfumes de ejemplo (precios inventados).
- Abrir `admin.html` → contraseña `demo123` → el panel.
- En este modo los pedidos se guardan **solo en ese navegador**: sirve para mirar, no para vender.

## 2 · Ponerla a vender de verdad (unos 30 minutos, gratis)

1. **Base de datos gratuita**: crear cuenta en https://supabase.com → «New project» (plan Free).
2. En el proyecto: **SQL Editor** → pegar TODO `supabase/esquema.sql` → **Run**. Crea las tablas, las
   reglas de acceso y las dos funciones (crear pedido, cambiar estado). Se puede correr varias veces.
3. **Authentication → Users → Add user**: tu correo y una contraseña. Copiar el `UID` que aparece.
4. SQL Editor: `insert into admins values ('PEGAR-AQUI-EL-UID');` → así ese usuario entra al panel.
5. **Authentication → Sign In / Providers**: desactivar «Allow new users to sign up» (que nadie más se
   pueda registrar).
6. **Project Settings → API**: copiar «Project URL» y la clave «anon public».
7. Abrir `config.js` y rellenar: `supabaseUrl`, `supabaseKey`, `whatsapp` (código de país + número, sin
   `+` ni espacios), `moneda` (`COP`, `MXN`, `USD`…), `nombre`, `lema`. **Es el único archivo a tocar.**
8. Abrir `admin.html`, entrar con tu correo y cargar los perfumes (botón «+ Nuevo perfume»). Fotos: pegar
   el enlace de la imagen en el campo «Foto»; sin foto se dibuja un frasco de color.
9. **Publicarla gratis**: https://pages.cloudflare.com o https://app.netlify.com/drop → arrastrar la
   carpeta entera. Te da una dirección tipo `tu-tienda.pages.dev`. Dominio propio (opcional) ~10-15 USD/año.

## Qué hace cada cosa

| archivo | qué es |
|---|---|
| `config.js` | tus datos (nombre, moneda, WhatsApp, conexión a la base) |
| `index.html` · `tienda.js` | la tienda que ven los clientes |
| `admin.html` · `admin.js` | tu panel privado |
| `logica.js` | buscador, filtros, orden, reparto existencias / encargo |
| `datos.js` | guarda y lee: en el navegador (demo) o en Supabase (real) |
| `supabase/esquema.sql` | la base de datos y sus reglas de seguridad |
| `pruebas.js` | `node pruebas.js` → 31 comprobaciones automáticas |

## Reglas que ya trae

- El precio de un pedido sale **de la base**, nunca del navegador del cliente (no se puede trucar).
- Un pedido de 5 cuando hay 3: se descuentan 3 y quedan **2 por encargo**; el panel los cuenta aparte.
- Cancelar un pedido devuelve al inventario **solo** lo que se había descontado. Un cancelado no se reabre.
- Los agotados siguen visibles («Por encargo · lo conseguimos para ti»). Para ocultar uno: «Visible» en el panel.
- Con WhatsApp configurado, el cliente al confirmar te manda el pedido ya escrito (aviso instantáneo y gratis).

## Lo que todavía NO tiene

- **Pago en línea** (tarjeta): depende del país (Mercado Pago, Wompi, Stripe…); cobran ~3-4 % por venta.
  El botón aparece como «Próximamente».
- **Aviso por correo** al dueño (el aviso es por WhatsApp).
- El `esquema.sql` está revisado y su lógica probada en modo demo, pero **no se ha corrido todavía contra
  una base Supabase real**: la primera vez, hacer un pedido de prueba y cancelarlo.
