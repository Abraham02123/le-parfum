# Guía paso a paso — poner la tienda en internet

Cada paso dice **qué haces tú**, **qué hago yo (Claude)**, **cuánto tarda** y **qué me escribes al terminar**.
Los pasos 1 a 3 son los únicos necesarios para que cualquier persona pueda ver el catálogo y pedirte.
Hoy la tienda ya está hecha y probada: 500 perfumes con foto, 40 comprobaciones automáticas en verde.

## Dónde vamos (26-nov)

| paso | estado |
|---|---|
| 1 · datos | ✅ nombre **Le Parfum**, México, pesos mexicanos (precios ×19,64 pesos por dólar, redondeados a …99). ✅ WhatsApp 52 81 3590 5000 (26-nov, en línea). ⏳ **falta la transferencia** |
| 2 · GitHub | ✅ publicada en **https://abraham02123.github.io/le-parfum/** (cuenta Abraham02123) |
| 3 · prueba desde el móvil | ⏳ te toca: haz un pedido desde tu celular y mira que te llega a WhatsApp (Claude ya lo probó en la página pública: el pedido sale escrito hacia tu número y el aviso «Modo de prueba» ya no aparece) |
| quitar tu nombre del enlace | ⏸ por ahora se queda así (26-nov); más adelante harás otra cuenta de GitHub (opción A) |
| mejoras de diseño | ✅ 26-nov: favoritos ♥, prueba «¿No sabes cuál elegir?», franja de promesas, imagen para compartir con el nombre |
| páginas para Google | ✅ 26-nov: una página por perfume (500) y por marca (113), lista de marcas al pie, preguntas frecuentes, «Vistos hace poco», página de «no existe». Al compartir un perfume, la vista previa lleva SU foto. Opcional: Paso 7 |

Para cambiar algo después: lo editas (o me lo pides) en `D:\tienda-perfumes` y se corre `bash publicar.sh`
(1-2 minutos y la página se actualiza sola).

---

## Paso 1 · Tus datos de la tienda — 5 minutos tuyos (hecho en parte)

**Qué haces tú:** mandarme UN mensaje con esto (copia y rellena):

```
Nombre de la tienda: ...
País y moneda: ...                      (ej.: Colombia, pesos COP)
WhatsApp donde te llegan los pedidos: ... (con código de país, ej.: 57 300 123 4567)
Datos para transferencia (opcional): ...   (banco, tipo de cuenta, número, titular; o Nequi/Yape/Bizum…)
Frase corta bajo el nombre (opcional): ...
```

**Qué hago yo (10 minutos):** lo pongo en `config.js`; paso los 500 precios de dólares a tu moneda con
redondeo de tienda (ej. 459.900 en vez de 458.312); rehago la imagen que sale al compartir el enlace; corro
las pruebas y te mando una captura de cómo queda.

**Por qué hace falta:** sin número de WhatsApp la tienda sale en «Modo de prueba» y los pedidos no te llegan.

---

## Paso 2 · Entrar a GitHub una vez — 5 a 10 minutos tuyos

GitHub es un servicio gratuito que guarda la página y la publica en internet. Lo uso porque después puedo
subir cada cambio yo solo, sin pedirte nada.

**Qué haces tú:**
1. Si no tienes cuenta: entra a https://github.com/signup y créala (correo, contraseña, nombre de usuario).
   El nombre de usuario sale en la dirección de la tienda: `https://TU-USUARIO.github.io/tienda-perfumes/`.
2. En esta ventana de Claude escribe exactamente (con el signo `!` delante):
   ```
   ! gh auth login
   ```
3. Responde así a las preguntas (flechas y Enter):
   - *Where do you use GitHub?* → **GitHub.com**
   - *Preferred protocol* → **HTTPS**
   - *Authenticate Git with your GitHub credentials?* → **Yes**
   - *How would you like to authenticate?* → **Login with a web browser**
4. Te muestra un código de 8 letras (ej. `ABCD-1234`). Pulsa Enter: se abre el navegador. Pega el código,
   pulsa **Continue** y **Authorize github**. En la ventana negra debe salir `✓ Logged in as TU-USUARIO`.

**Qué me escribes:** «ya entré a GitHub».

**Qué hago yo (5 minutos):** corro `bash publicar.sh`: crea el sitio, lo publica, espera a que responda y
compruebo desde fuera que abre. Te mando el enlace para compartir.

---

## Paso 3 · Probarla desde tu móvil — 5 minutos tuyos

**Qué haces tú:** abre el enlace en el móvil, agrega un perfume al carrito, «Hacer el pedido». Prueba las dos formas: una con nombre y forma de pago, y otra con «Omitir esto y hacer mi
pedido» (todo es opcional; la dirección la pides tú por WhatsApp). Se abre WhatsApp con el pedido escrito: envíalo **a ti mismo** (o a otro número tuyo) y
mira que llega completo. Comparte el enlace por WhatsApp a alguien: debe salir la foto de vista previa.

**Qué me escribes:** «llegó bien», o lo que viste raro (una captura vale más que una descripción).

**Qué hago yo:** si algo falla, lo arreglo y lo vuelvo a publicar en 1-2 minutos.

👉 **Desde aquí cualquier persona puede ver el catálogo y pedirte.**

---

## Paso 4 · Tus precios, disponibilidad y épocas, desde el celular — 10 minutos una vez

Hoy cada perfume tiene precio sin caja y con caja por escalones (750/850/950 y 1.750/1.850/1.950/2.500) y
**todos dicen «no disponible: te lo conseguimos en 2 días a 1 semana»** hasta que lo cambies.

Ya no hace falta Google: la tienda trae su propia página para editar precios, **`precios.html`**.

**Qué haces tú (una sola vez): crear tu clave de GitHub** — es como una llave que solo abre la tienda.
1. En el celular, entra a **github.com** con tu cuenta (la de la tienda) → toca tu foto → **Settings**.
2. Baja hasta **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
3. Nombre: `precios tienda`. Expiración: la más larga que te deje (o «No expiration»).
4. **Repository access** → **Only select repositories** → elige **le-parfum**.
5. **Permissions** → **Repository permissions** → **Contents** → **Read and write**. Nada más.
6. **Generate token** y **copia** el texto que empieza con `github_pat_` (GitHub no lo vuelve a mostrar).
7. Abre `https://abraham02123.github.io/le-parfum/precios.html` → «Clave para guardar» → pégalo →
   **Guardar en este teléfono**. Debe decir «✓ Clave guardada». Agrega la página a tu pantalla de inicio.

Si la clave se pierde o caduca: creas otra igual y la pegas. Nunca la mandes por chat ni a nadie (ni a mí):
con ella se puede cambiar la tienda.

**Después, cada día:** abres `precios.html`, buscas el perfume y cambias:
- precio **sin caja** y **con caja**;
- **disponible**: con caja · sin caja · con y sin caja · no disponible;
- **épocas del año**: toca 🌸 Primavera, ☀️ Verano, 🍂 Otoño o ❄️ Invierno (puede ser más de una);
Y arriba tienes tres pestañas:
- **En la tienda**: los que se ven. En cada uno, **Archivar** (lo escondes un tiempo, guarda sus precios) o
  **Quitar** (lo borras de la lista; siempre se puede volver a agregar).
- **Archivados**: los escondidos. **Restaurar a la tienda** los vuelve a mostrar con sus precios de antes.
- **+ Agregar**: escribe marca o nombre; salen los perfumes que existen (24.063), de los más conocidos a los
  menos, con precio y épocas sugeridos. Pulsas **Agregar**, revisas precio y disponibilidad, y **Guardar**.
  La foto, las notas, la descripción y su página las arma la computadora sola en unos 10 minutos
  (tiene que estar prendida; si está apagada, aparece cuando la prendas).

Pulsas **Guardar** y la tienda lo muestra en 1-2 minutos (la página de cada perfume también). Las épocas
iniciales las calculé yo con los olores de cada perfume: revísalas cuando quieras, tú mandas.

**Otras formas (si prefieres):**
- **A, la más fácil:** mándame tu lista como la tengas (Excel, foto de una libreta, texto, PDF): perfume,
  precio y cuántos tienes. Yo la cargo, aunque los nombres no coincidan exactos.
- **B, tú mismo:** abre `admin.html` (el enlace de la tienda + `admin.html`), contraseña `demo123`, pestaña
  «Perfumes e inventario» → «Descargar hoja de precios y disponibilidad» → cambia en Excel → «Subir hoja
  corregida» → «Descargar catalogo.js para publicar» → mándame ese archivo.

**Qué hago yo (15 minutos):** cargo la lista, aviso de los perfumes que no encontré en los 500 (los agrego
con foto si existen), publico y te mando captura.

**Perfumes que no están en los 500:** dime cuáles y los agrego con su foto.

---

## Paso 5 (opcional, más adelante) · Que el inventario baje solo con cada venta — 20 minutos tuyos

Con el paso 3 los pedidos te llegan por WhatsApp, pero la disponibilidad la ajustas tú (paso 4). Si vendes
muchos y quieres que bajen solas y ver todos los pedidos en un panel, hace falta una base de datos gratuita.

**Qué haces tú:**
1. Cuenta en https://supabase.com (gratis) → **New project** → nombre `tienda`, una contraseña que guardes,
   región la más cercana → **Create**. Espera 2 minutos.
2. **SQL Editor** → **New query** → abre el archivo `supabase/esquema.sql`, copia TODO, pégalo → **Run**.
   Repite con `supabase/semilla.sql` (los 500 perfumes).
3. **Authentication → Users → Add user**: tu correo y una contraseña (la del panel). Copia el **UID**.
4. **SQL Editor**: `insert into admins values ('PEGA-AQUI-EL-UID');` → **Run**.
5. **Authentication → Sign In / Providers**: apaga «Allow new users to sign up».
6. **Project Settings → API**: copia **Project URL** y la clave **anon public**.

**Qué me escribes:** «Supabase listo» + la Project URL + la clave anon (es pública a propósito: la seguridad
la ponen las reglas de la base, no esa clave). **Nunca** me mandes la contraseña ni la clave `service_role`.

**Qué hago yo (10 minutos):** las pongo en `config.js`, publico, hago un pedido de prueba, compruebo que
aparece en tu panel y que la existencia bajó, y lo cancelo para dejarla como estaba.

---

## Paso 6 (opcional) · Quitar tu nombre del enlace

Hoy el enlace es `abraham02123.github.io/le-parfum`: GitHub siempre pone delante el nombre de la cuenta.
Tres formas de quitarlo:

| forma | enlace | cuesta | qué haces tú | qué hago yo |
|---|---|---|---|---|
| A · organización de GitHub | `leparfum-mx.github.io` | 0 | crear una «organización» gratis en github.com/organizations/plan (2 min, con tu misma cuenta) y decirme el nombre que elegiste | muevo la página ahí y compruebo que abre (5 min) |
| B · Cloudflare Pages | `leparfum.pages.dev` | 0 | crear cuenta en Cloudflare y darme permiso para instalar su herramienta y abrir sesión | publico ahí y dejo el enlace viejo redirigiendo (10 min) |
| C · dominio propio | `leparfum.mx` o `.com.mx` | ~300-700 pesos al año (estimación, sin comprobar precio de hoy) | comprarlo (te guío) | lo conecto (15 min + hasta 24 h que tarda en verse) |

Lo que el cliente ve en A sigue diciendo «github.io»; en B dice «pages.dev»; solo C queda como una tienda
con dirección propia.

---

## Paso 7 (opcional) · Avisarle a Google que la tienda existe — 10 minutos tuyos

Google acabará encontrando las 613 páginas solo, siguiendo los enlaces, pero puede tardar semanas. Si se las
avisas tú, suele tardar días.

**Qué haces tú:** entra a https://search.google.com/search-console con tu cuenta de Google → «Añadir propiedad» →
«Prefijo de la URL» → pega `https://abraham02123.github.io/le-parfum/` → te da un archivo o una etiqueta para
comprobar que la página es tuya: **mándamelo** (es público, no es una contraseña).

**Qué hago yo (5 minutos):** lo pongo en la tienda, publico, y tú pulsas «Verificar». Después, en «Sitemaps»,
escribes `sitemap.xml` y «Enviar».

**Mejor hacerlo después del cambio de cuenta** (opción A del Paso 6): con otra dirección habría que repetirlo.

---

## Lo que ya no te pide nada

- Fotos: ya están las 500. Si un perfume nuevo no tiene foto, se dibuja un frasco del color de su aroma.
- Pruebas: corren solas antes de cada publicación; si una falla, no se publica nada.
- Páginas de cada perfume y marca: se rehacen solas en cada publicación (`generar_paginas.js`), con los precios del momento.
- Cambios de diseño, textos o secciones: pídemelos y los publico yo.
