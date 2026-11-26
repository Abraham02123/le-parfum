# Tienda de perfumes — cómo usarla

Catálogo de **500 perfumes** con foto del frasco, buscador que perdona errores de escritura, categorías
(mujer, hombre, unisex, árabes, diseñador, nicho), filtros (familia de aroma, marca, precio;
concentración y tamaño aparecen solos cuando se cargan esos datos), orden (destacados, más populares, precio, novedades, nombre), ficha con «cómo huele», notas y
parecidos, carrito y pedido. Lo agotado se sigue mostrando y se puede pedir «por encargo».

Costo: **0**. No se instala nada: son archivos sueltos que abre cualquier navegador.

👉 **Los pasos para ponerla en internet, uno por uno, están en `GUIA_PASOS.md`.**

## Las tres maneras de funcionar (se elige sola según `config.js`)

| modo | cuándo se activa | qué pasa con un pedido | inventario |
|---|---|---|---|
| **demostración** | `config.js` sin WhatsApp ni base de datos | se guarda solo en el navegador de quien lo hizo; arriba sale «Modo de prueba» | baja solo en ese navegador |
| **WhatsApp** (recomendado para empezar) | `whatsapp` con tu número | al confirmar, al cliente se le abre WhatsApp con el pedido ya escrito y te lo manda | no baja solo: lo ajustas tú con la hoja de precios (abajo) |
| **base de datos** (Supabase, gratis) | `supabaseUrl` y `supabaseKey` rellenos | queda guardado en tu panel, con su estado | baja solo con cada venta; cancelar lo devuelve |

## Publicarla (GitHub Pages, gratis)

```
bash publicar.sh
```
La primera vez pide haber entrado a GitHub con `gh auth login`. Crea el sitio
`https://TU-USUARIO.github.io/tienda-perfumes/`, que abre cualquiera desde el móvil o el ordenador.
Cada vez que se vuelve a correr sube los cambios; la tienda se actualiza en 1-2 minutos.

## Cambiar precios y existencias sin tocar código

Panel (`admin.html`) → «Perfumes e inventario» → **Descargar hoja de precios y existencias** → abrirla en
Excel o Google Sheets → cambiar las columnas `precio`, `stock` (existencias) o `visible` (si/no) → guardar
como CSV → **Subir hoja corregida**. Antes de aplicar dice cuántos cambian y qué filas tienen error.

- En modo **base de datos** el cambio lo ven los clientes al instante.
- En modo **WhatsApp** el cambio queda en tu navegador: «Descargar catalogo.js para publicar», reemplazar ese
  archivo en esta carpeta y `bash publicar.sh` (o mandárselo a Claude y lo hace él).

## Qué hace cada cosa

| archivo | qué es |
|---|---|
| `config.js` | tus datos: nombre, lema, moneda, WhatsApp, datos de transferencia, conexión a la base. **El único archivo a tocar** |
| `catalogo.js` | los 500 perfumes (lo genera `datos/armar_catalogo.py`; no editar a mano) |
| `img/` | una foto por perfume (`<número>.webp`) y la imagen que sale al compartir el enlace |
| `index.html` · `tienda.js` · `estilos.css` | la tienda que ven los clientes |
| `admin.html` · `admin.js` · `admin.css` | tu panel privado |
| `logica.js` | buscador, filtros, orden, reparto existencias / encargo |
| `datos.js` | guarda y lee según el modo |
| `supabase/esquema.sql` | la base de datos y sus reglas de seguridad (probado contra Postgres de verdad el 26-nov) |
| `supabase/semilla.sql` | carga los 500 perfumes en la base (se puede correr dos veces sin duplicar) |
| `publicar.sh` | sube la tienda a internet |
| `pruebas.js` | `node pruebas.js` → 40 comprobaciones automáticas (también las corre `publicar.sh`) |

## De dónde salen los 500 y qué hay que saber

- **Lista**: los 460 perfumes con más votos de Fragrantica más 40 árabes populares (para que la sección
  árabe tenga 45 y no 5). Los votos son de una copia de 2024 y solo ordenan «Más populares»; no se muestran.
- **Notas y acordes** traducidos al español. **Licencia de esa copia de datos**: uso no comercial
  (CC BY-NC-SA 4.0). Las notas de un perfume son información pública que publican las propias marcas, pero
  si la tienda crece conviene reescribir las descripciones con texto propio.
- **Fotos**: las del frasco que publican las marcas (las mismas que muestra Fragrantica), guardadas aquí en
  formato liviano (6,5 MB las 500). Es práctica común en tiendas de perfumes; el pie de página lo aclara.
- **Precios**: de referencia, por marca (no por perfume). La ficha y el carrito avisan que el precio final
  se confirma por WhatsApp. Cambiarlos con la hoja de precios.
- **Existencias**: todas en 0 → todo sale «Por encargo». Al poner existencias sale «Disponible».

## Reglas que ya trae

- El precio de un pedido sale del catálogo o de la base, **nunca** del navegador del cliente (no se puede trucar).
- Un pedido de 5 cuando hay 3: se descuentan 3 y quedan **2 por encargo**; el panel los cuenta aparte.
- Cancelar un pedido devuelve al inventario **solo** lo que se había descontado. Un cancelado no se reabre.
- Pago: contra entrega siempre; **transferencia** si rellenas `transferencia` en `config.js` (banco, número, titular).

## Lo que todavía NO tiene

- **Pago con tarjeta en línea**: depende del país (Mercado Pago, Wompi, Stripe…); cobran ~3-4 % por venta.
  Sale como «Próximamente».
- **Aviso por correo** al dueño (el aviso es por WhatsApp).

## Si ya tenías creada la base de datos antes del 26-nov

Volver a correr `supabase/esquema.sql` entero: añade las columnas nuevas (acordes, votos, año) y permite el
pago por transferencia. No borra nada.
