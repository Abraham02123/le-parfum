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

  // Precios, disponibilidad y épocas del año que cambias desde el celular (27-nov): el archivo precios.csv de la
  // tienda, que editas en precios.html (instrucciones en GUIA_PASOS.md). La tienda lo lee cada vez que alguien la abre.
  // Columnas: id · marca · nombre · sin caja · con caja · disponible · temporadas · visible.
  // Vacío = la tienda usa los precios de catalogo.js. (También acepta el enlace de una hoja de Google.)
  hojaCatalogo: 'precios.csv',
  // Dónde guarda precios.html los cambios: tu repositorio de GitHub (usuario/nombre). Si mueves la tienda a otra
  // cuenta, cambia esto y crea una clave nueva para esa cuenta.
  repoGithub: 'Abraham02123/le-parfum',
};
