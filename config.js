// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE LA TIENDA — lo único que hay que tocar para personalizarla.
// ─────────────────────────────────────────────────────────────────────────────
window.TIENDA_CONFIG = {
  nombre: 'Le Parfum',                           // nombre de tu tienda
  lema: 'Fragancias originales · Árabes, de diseñador y de nicho',
  moneda: 'MXN',                                 // COP, MXN, PEN, CLP, ARS, USD, EUR…
  idioma: 'es-MX',                               // es-CO, es-MX… cambia el formato del precio

  // Número de WhatsApp donde recibes los pedidos: código de país + número, sin «+» ni espacios.
  // Ejemplo Colombia: '573001234567'. Vacío = no se muestra el botón de WhatsApp.
  whatsapp: '528135905000',                        // 52 81 3590 5000 (26-nov)

  // Base de datos en la nube (Supabase, plan gratis). VACÍO = MODO DEMOSTRACIÓN:
  // todo se guarda solo en el navegador donde abres la página (sirve para probar, no para vender).
  supabaseUrl: '',
  supabaseKey: '',          // la clave «anon / public» (es pública a propósito; la seguridad la ponen las reglas del esquema)

  // Contraseña del panel SOLO en modo demostración. Con Supabase se entra con correo y contraseña reales.
  claveDemoAdmin: 'demo123',

  // Pago en línea: queda apagado hasta saber el país (Mercado Pago, Wompi, Stripe…).
  // Mientras sea null, el pago es contra entrega.
  pagoEnLinea: null,

  // Pago por transferencia: escribe cómo te pagan (p. ej. 'Nequi o Bancolombia, te enviamos los datos').
  // Vacío = no se ofrece; el cliente solo ve «contra entrega».
  transferencia: '',

  // true = junto a cada precio se avisa que es de referencia y que se confirma por WhatsApp.
  // Ponlo en false cuando hayas cargado tus precios reales.
  preciosReferencia: false,                      // 27-nov: los precios ya son los tuyos (con caja / sin caja)

  // Hoja de Google con precios y disponibilidad, para cambiarlos desde el celular (27-nov).
  // Pega aquí el enlace de la hoja (Compartir → «Cualquier persona con el enlace» → Lector).
  // Vacío = la tienda usa los precios de catalogo.js. Columnas: id · marca · nombre · sin caja · con caja · disponible · visible
  hojaCatalogo: '',
};
