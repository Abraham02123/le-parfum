// Pone a cada estilo y programa una marca de su contenido: «tienda.js?v=1a2b3c4d».
// Por qué: GitHub deja que el navegador guarde su copia hasta 10 minutos, y quien ya visitó la tienda podía seguir
// viendo la versión vieja o mezclar piezas viejas con nuevas (26-nov: el usuario no veía la versión publicada).
// Con la marca, el navegador pide el archivo nuevo en cuanto cambia; si el archivo no cambió, la marca tampoco.
// Lo corre publicar.sh. Uso a mano:  node versionar.js
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const R = __dirname;

const piezas = ['estilos.css', 'admin.css', 'p/pagina.css', 'config.js', 'logica.js', 'datos.js',
  'demo-catalogo.js', 'catalogo.js', 'tienda.js', 'admin.js', 'ficha.js', 'precios.js'].filter((f) => fs.existsSync(path.join(R, f)));
const marca = {};
for (const f of piezas) {
  marca[path.basename(f)] = crypto.createHash('md5').update(fs.readFileSync(path.join(R, f))).digest('hex').slice(0, 8);
}
const nombres = Object.keys(marca).map((b) => b.replace(/[.]/g, '[.]')).join('|');
// Solo referencias dentro de href="…" o src="…": la pieza va justo después de la comilla o de una barra.
const patron = new RegExp(`(["/])(${nombres})(?:[?]v=[0-9a-f]+)?"`, 'g');

const paginas = ['index.html', 'admin.html', '404.html', 'precios.html',
  ...fs.readdirSync(path.join(R, 'p')).filter((f) => f.endsWith('.html')).map((f) => 'p/' + f)]
  .filter((f) => fs.existsSync(path.join(R, f)));
let cambiadas = 0, referencias = 0;
for (const f of paginas) {
  const ruta = path.join(R, f);
  const antes = fs.readFileSync(ruta, 'utf8');
  const despues = antes.replace(patron, (_, pre, b) => { referencias++; return `${pre}${b}?v=${marca[b]}"`; });
  if (despues !== antes) { fs.writeFileSync(ruta, despues); cambiadas++; }
}
// Comprobación: la tienda y su panel tienen que quedar con TODAS sus piezas marcadas.
for (const f of ['index.html', 'admin.html', 'precios.html']) {
  const s = fs.readFileSync(path.join(R, f), 'utf8');
  const sinMarca = s.match(/(?:href|src)="[^"?]+[.](?:css|js)"/g);
  if (sinMarca) throw new Error(`${f}: piezas sin marca de versión: ${sinMarca.join(', ')}`);
}
console.log(`Marcas de versión: ${piezas.length} piezas · ${referencias} referencias · ${cambiadas} páginas reescritas`);
