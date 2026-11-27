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
| **WhatsApp** (recomendado para empezar) | `whatsapp` con tu número | al confirmar, al cliente se le abre WhatsApp con el pedido ya escrito y te lo manda | no baja solo: lo ajustas tú con el editor de precios (abajo) |
| **base de datos** (Supabase, gratis) | `supabaseUrl` y `supabaseKey` rellenos | queda guardado en tu panel, con su estado | baja solo con cada venta; cancelar lo devuelve |

## Publicarla (GitHub Pages, gratis)

```
bash publicar.sh
```
La primera vez pide haber entrado a GitHub con `gh auth login`. Crea el sitio
`https://TU-USUARIO.github.io/tienda-perfumes/`, que abre cualquiera desde el móvil o el ordenador.
Cada vez que se vuelve a correr sube los cambios; la tienda se actualiza en 1-2 minutos.

## Cambiar precios, disponibilidad y épocas desde el celular (`precios.html`)

Desde el 27-nov ya no hay hoja de Google (el dueño no tiene espacio en Google). Todo vive en **`precios.csv`**,
dentro de la propia tienda: `id, marca, nombre, sin caja, con caja, disponible, temporadas, visible`.

- **Disponibilidad**: `con caja`, `sin caja`, `con y sin caja` o `no disponible` (la tienda dice «te lo conseguimos
  en 2 días a 1 semana»).
- **Temporadas** (épocas del año): una o varias de `Primavera / Verano / Otoño / Invierno` (o `todo el año`).
  Las iniciales las calcula `datos/armar_catalogo.py` con los 5 olores principales de cada perfume: frescos y
  cítricos → primavera y verano; vainilla, ámbar, cuero, tabaco → otoño e invierno; en medio → primavera y otoño;
  floral → suma primavera. Es una estimación: lo que diga `precios.csv` manda.

**Cómo se edita:** la dirección de la tienda + `precios.html` (p. ej. `https://abraham02123.github.io/le-parfum/precios.html`).
Busca el perfume, cambia lo que quieras y pulsa «Guardar N cambios». La página guarda `precios.csv` directo en
GitHub (sin computadora) y la tienda lo muestra en 1-2 minutos. Necesita una **clave de GitHub** que se crea una
sola vez (pasos en `GUIA_PASOS.md`, Paso 4); la clave queda solo en el navegador del teléfono, nunca en el código.
Sin clave, la página deja ver pero no guardar.

Por dentro: la tienda (`datos.js`) y las páginas fijas de cada perfume (`ficha.js`) leen `precios.csv` cada vez
que alguien las abre (si no responde en 4 segundos o trae menos de la mitad de los perfumes, usan `catalogo.js`).
Al guardar, `precios.js` baja la versión más reciente y solo reescribe las filas cambiadas, firmando como
«Le Parfum <tienda@localhost>» (el repositorio es público: nunca un correo personal). `publicar.sh` trae esos
cambios (`git pull`) antes de armar nada. `datos/armar_catalogo.py` nunca pisa filas que ya están: solo agrega
perfumes nuevos. No cambiar la columna `id`; una fila con un id que no existe se ignora.

El panel (`admin.html`) descarga y sube la misma tabla en CSV, con las mismas columnas.

## Lo de antes: el panel

Panel (`admin.html`) → «Perfumes e inventario» → **Descargar hoja de precios y disponibilidad** → abrirla en
Excel → cambiar las columnas `sin caja`, `con caja`, `disponible`, `temporadas` o `visible` (si/no) → guardar
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
| `generar_paginas.js` | una página fija por perfume y por marca (`p/`), `sitemap.xml` y `404.html`; lo corre `publicar.sh` con la dirección pública. Por qué: Google no lee lo que va tras «#p=», y al compartir un perfume la vista previa lleva su foto |
| `pruebas.js` | `node pruebas.js` → 40 comprobaciones automáticas (también las corre `publicar.sh`) |
| `versionar.js` | pone a cada estilo y programa una marca de su contenido (`tienda.js?v=…`) para que nadie vea una copia vieja guardada en su navegador; lo corre `publicar.sh` |

## De dónde salen los 500 y qué hay que saber

- **Lista**: los 460 perfumes con más votos de Fragrantica más 40 árabes populares (para que la sección
  árabe tenga 45 y no 5). Los votos son de una copia de 2024 y solo ordenan «Más populares»; no se muestran.
- **Notas y acordes** traducidos al español. **Licencia de esa copia de datos**: uso no comercial
  (CC BY-NC-SA 4.0). Las notas de un perfume son información pública que publican las propias marcas, pero
  si la tienda crece conviene reescribir las descripciones con texto propio.
- **Fotos**: las del frasco que publican las marcas (las mismas que muestra Fragrantica), guardadas aquí en
  formato liviano (6,5 MB las 500). Es práctica común en tiendas de perfumes; el pie de página lo aclara.
- **Precios** (27-nov, pedido del dueño): por escalones según lo caro del perfume — sin caja 750 / 850 / 950,
  con caja 1.750 / 1.850 / 1.950, y 2.500 con caja para lo más fino (Tom Ford, Le Labo, Creed, Kilian…).
  Lo fija `escalon()` en `datos/armar_catalogo.py`; se cambian perfume por perfume en `precios.html`.
- **Disponibilidad**: todos en `no disponible` al empezar → la tienda dice «te lo conseguimos en 2 días a
  1 semana». Se cambia en `precios.html`.
- **Carrito**: no se vacía al pulsar «Abrir WhatsApp» (el cliente puede volver y corregir); se vacía con
  «Vaciar carrito». El mensaje ya no lleva código de pedido.
- Fotos en el pedido (27-nov): se probó y se QUITÓ a pedido del dueño («déjalo como estaba, sin imagen»). El pedido va solo como texto, con un solo botón. El código está en el historial de git (commit 477e091) por si se quiere volver.
- **Modo base de datos (Supabase)**: todavía no conoce los dos precios ni la disponibilidad; usar `whatsapp`.

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
