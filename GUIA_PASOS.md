# Guía paso a paso — poner la tienda en internet

Cada paso dice **qué haces tú**, **qué hago yo (Claude)**, **cuánto tarda** y **qué me escribes al terminar**.
Los pasos 1 a 3 son los únicos necesarios para que cualquier persona pueda ver el catálogo y pedirte.
Hoy la tienda ya está hecha y probada: 500 perfumes con foto, 40 comprobaciones automáticas en verde.

---

## Paso 1 · Tus datos de la tienda — 5 minutos tuyos

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

**Qué haces tú:** abre el enlace en el móvil, agrega un perfume al carrito, «Hacer pedido», rellena con tus
datos y confirma. Se abre WhatsApp con el pedido escrito: envíalo **a ti mismo** (o a otro número tuyo) y
mira que llega completo. Comparte el enlace por WhatsApp a alguien: debe salir la foto de vista previa.

**Qué me escribes:** «llegó bien», o lo que viste raro (una captura vale más que una descripción).

**Qué hago yo:** si algo falla, lo arreglo y lo vuelvo a publicar en 1-2 minutos.

👉 **Desde aquí cualquier persona puede ver el catálogo y pedirte.**

---

## Paso 4 · Tus precios y existencias reales — cuando quieras, 30 a 60 minutos tuyos

Hoy los precios son **de referencia por marca** y todo sale «Por encargo» (existencias en 0).

**Qué haces tú (elige una):**
- **A, la más fácil:** mándame tu lista como la tengas (Excel, foto de una libreta, texto, PDF): perfume,
  precio y cuántos tienes. Yo la cargo, aunque los nombres no coincidan exactos.
- **B, tú mismo:** abre `admin.html` (el enlace de la tienda + `admin.html`), contraseña `demo123`, pestaña
  «Perfumes e inventario» → «Descargar hoja de precios y existencias» → cambia en Excel → «Subir hoja
  corregida» → «Descargar catalogo.js para publicar» → mándame ese archivo.

**Qué hago yo (15 minutos):** cargo la lista, aviso de los perfumes que no encontré en los 500 (los agrego
con foto si existen), publico y te mando captura.

**Perfumes que no están en los 500:** dime cuáles y los agrego con su foto.

---

## Paso 5 (opcional, más adelante) · Que el inventario baje solo con cada venta — 20 minutos tuyos

Con el paso 3 los pedidos te llegan por WhatsApp, pero las existencias las ajustas tú (paso 4). Si vendes
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

## Paso 6 (opcional) · Dirección propia — 10 minutos tuyos y ~10-15 USD al año

Por ejemplo `www.maisonparfum.com` en vez de `usuario.github.io/tienda-perfumes`. Es lo único que cuesta
dinero y no hace falta para vender. Si lo quieres, dime y te guío.

---

## Lo que ya no te pide nada

- Fotos: ya están las 500. Si un perfume nuevo no tiene foto, se dibuja un frasco del color de su aroma.
- Pruebas: corren solas antes de cada publicación; si una falla, no se publica nada.
- Cambios de diseño, textos o secciones: pídemelos y los publico yo.
