# Arma el catálogo de la tienda (../catalogo.js) y la carga para la base de datos (../supabase/semilla.sql)
# a partir de: QUÉ perfumes van = los de ../precios.csv (el dueño agrega, quita y archiva desde precios.html, 27-nov;
# si precios.csv no existe, los 500 de seleccion.json), y de cada uno: todos.json.gz (los 24.063 perfumes de la
# fuente: notas, acordes, año, género), nombres.json (marca y nombre bien escritos de los 500 originales; los demás se
# escriben con traducir.py), notas_es.json + notas_es_extra.json (cada nota en español) y la foto en ../img/ (si falta,
# se baja sola). También escribe ../buscador_perfumes.json: la lista de los 24.063 para buscar y agregar en precios.html.
#
# Los PRECIOS son de referencia por marca (ver PRECIO_MARCA): sirven para que el catálogo se vea completo y los
# filtros de precio funcionen. Hay que cambiarlos por los reales (panel → Exportar lista → editar → Importar).
# Las existencias empiezan en 0: todo sale «Por encargo» hasta que se carguen las reales.
# Los votos de Fragrantica se usan solo para ORDENAR por popularidad; no se muestran (son de una copia vieja).
#
# Uso: python -I armar_catalogo.py      (se puede correr cuantas veces haga falta; nunca escribe en precios.csv si ya
#                                         existe: solo reescribe catalogo.js, semilla.sql y buscador_perfumes.json)
import csv, json, pathlib, re, datetime, gzip, hashlib, sys

AQUI = pathlib.Path(__file__).parent
RAIZ = AQUI.parent
sys.path.insert(0, str(AQUI))
from traducir import MARCAS, nombre_desde_slug
from bajar_fotos import bajar_una
leer = lambda n: json.loads((AQUI / n).read_text(encoding='utf-8'))
sel, nombres, es = leer('seleccion.json'), leer('nombres.json'), leer('notas_es.json')
# Notas de los perfumes fuera de los 500 originales (27-nov, traducidas para poder agregar cualquiera): solo rellenan
# lo que notas_es.json no tiene; lo ya revisado de notas_es.json manda.
if (AQUI / 'notas_es_extra.json').exists():
    es = {**leer('notas_es_extra.json'), **es}
todos = {}
if (AQUI / 'todos.json.gz').exists():
    with gzip.open(AQUI / 'todos.json.gz', 'rt', encoding='utf-8') as fh:
        todos = {x['fid']: x for x in json.load(fh)}
todos.update({x['fid']: x for x in sel})
# Perfumes que NO están en la fuente de 24.063 (27-nov: el catálogo del dueño traía 19 más nuevos o que la fuente no
# tiene, como Santal 33 o Yara Candy). extra.json: una fila por perfume, mismo formato que la fuente más «marca» y
# «nombre» bien escritos; el id es el de Fragrantica, así la foto se baja sola igual que los demás. Se agregan a mano.
if (AQUI / 'extra.json').exists():
    for x in leer('extra.json'):
        x = {'votos': 0, 'nota': None, 'arabe': False, 'anio': None, 'acordes': [], 'salida': [], 'corazon': [],
             'fondo': [], **x}
        if x['fid'] not in todos:
            todos[x['fid']] = x
            nombres.setdefault(str(x['fid']), {'marca': x['marca'], 'nombre': x['nombre']})

# Correcciones del revisor (26-nov): términos de Latinoamérica y nombres de ingrediente sin traducir.
es.update({'grapefruit': 'toronja', 'blood grapefruit': 'toronja sanguina', 'pink grapefruit': 'toronja rosa',
           'grapefruit blossom': 'flor de toronja', 'whipped cream': 'crema batida', 'herbal': 'herbáceo',
           'herbal notes': 'notas herbáceas', 'civetta': 'civeta', 'passionfruit': 'maracuyá', 'cupcake': 'cupcake'})
es = {k.replace('™', ''): v.replace('™', '') for k, v in es.items()}
tr = lambda n: es.get(n.replace('™', ''), n.replace('™', ''))

FAMILIA = {}
for fam, acordes in {
    'Amaderada': 'woody earthy patchouli mossy',
    'Dulce': 'sweet vanilla caramel honey almond nutty lactonic coconut coffee chocolate cacao',
    'Cítrica': 'citrus',
    'Fresca': 'fresh aquatic marine ozonic green',
    'Aromática': 'aromatic lavender herbal|fresh spicy',
    'Floral': 'floral rose tuberose iris violet powdery aldehydic musky|white floral|yellow floral',
    'Frutal': 'fruity cherry tropical',
    'Oriental': 'amber balsamic cinnamon tobacco|warm spicy|soft spicy',
    'Cuero y oud': 'leather animalic oud smoky',
}.items():
    for a in re.split(r'[ |]', acordes.replace('fresh spicy', 'fresh_spicy').replace('white floral', 'white_floral')
                       .replace('yellow floral', 'yellow_floral').replace('warm spicy', 'warm_spicy').replace('soft spicy', 'soft_spicy')):
        if a:
            FAMILIA[a.replace('_', ' ')] = fam
ADJ = {'Amaderada': 'amaderado', 'Dulce': 'dulce', 'Cítrica': 'cítrico', 'Fresca': 'fresco', 'Aromática': 'aromático',
       'Floral': 'floral', 'Frutal': 'frutal', 'Oriental': 'oriental', 'Cuero y oud': 'de cuero y oud'}
PARA = {'mujer': 'para mujer', 'hombre': 'para hombre', 'unisex': 'para mujer y hombre'}

NICHO_TOP = {'creed', 'amouage', 'by-kilian', 'kilian', 'xerjoff', 'maison-francis-kurkdjian', 'frederic-malle',
             'roja-dove', 'roja-parfums', 'parfums-de-marly', 'clive-christian', 'louis-vuitton', 'initio-parfums-prives'}
NICHO = NICHO_TOP | {'byredo', 'mancera', 'montale', 'nishane', 'serge-lutens', 'juliette-has-a-gun', 'nasomatto', 'diptyque',
                     'le-labo', 'tiziana-terenzi', 'maison-margiela-replica', 'atelier-cologne', 'acqua-di-parma', 'penhaligon-s',
                     'memo-paris', 'zoologist', 'bdk-parfums', 'tauer-perfumes', 'escentric-molecules', 'ex-nihilo', 'vilhelm-parfumerie', 'kayali-fragrances'}
PRECIO_MARCA = {
    # árabes
    'al-haramain-perfumes': 70, 'al-haramain': 70, 'swiss-arabian': 55, 'ajmal': 60, 'arabian-oud': 90, 'rasasi': 55,
    # masivas y de famosos
    **dict.fromkeys(['avon', 'britney-spears', 'ariana-grande', 'nautica', 'aquolina', 'elizabeth-arden', 'juicy-couture',
                     'salvador-dali', 'joop', 'davidoff', 'adidas', 'antonio-banderas', 'paris-hilton', 'shakira',
                     'jennifer-lopez', 'katy-perry', 'victoria-s-secret', 'bath-body-works', 'zara', 'natura',
                     'mercadona', 'jovan', 'yves-rocher', 'sarah-jessica-parker', 'gloria-vanderbilt', 'vera-wang', 'sol-de-janeiro', 'playboy', 'axe', 'curve', 'nike', 'puma', 'benetton', 'police'], 48),
    **dict.fromkeys(['calvin-klein', 'bentley', 'lacoste-fragrances', 'cacharel', 'clinique', 'lalique', 'moschino',
                     'lolita-lempicka', 'lanvin', 'tommy-hilfiger', 'diesel', 'guess', 'escada', 'mexx'], 75),
    **dict.fromkeys(['montblanc', 'hugo-boss', 'donna-karan', 'chopard', 'nina-ricci', 'estee-lauder', 'kenzo', 'azzaro',
                     'ralph-lauren', 'jimmy-choo', 'versace', 'issey-miyake', 'marc-jacobs', 'coach'], 92),
    **dict.fromkeys(['burberry', 'paco-rabanne', 'rabanne', 'narciso-rodriguez', 'chloe', 'elie-saab', 'gucci', 'bvlgari',
                     'lancome', 'carolina-herrera', 'dolce-gabbana', 'mugler', 'jean-paul-gaultier', 'thierry-mugler'], 112),
    **dict.fromkeys(['yves-saint-laurent', 'giorgio-armani', 'givenchy', 'prada', 'valentino', 'viktor-rolf',
                     'maison-martin-margiela', 'cartier', 'hermes', 'jo-malone-london', 'sisley', 'guerlain', 'dior', 'chanel'], 128),
    'tom-ford': 220, 'van-cleef-arpels': 115, 'juliette-has-a-gun': 110, 'mancera': 140, 'montale': 140,
}

def tipo_de(x):
    return 'arabe' if x['arabe'] else 'nicho' if x['marca_slug'] in NICHO else 'disenador'

# Tienda en México (26-nov): precio de referencia en dólares × tipo de cambio, redondeado como tienda
# (hacia arriba al siguiente cien, menos 1: 2.199 y no 2.200,05). Tipo de cambio de open.er-api.com, 26-nov-2026.
TIPO_CAMBIO = 19.64          # pesos mexicanos por dólar
def a_pesos(usd):
    return -(-usd * TIPO_CAMBIO // 100) * 100 - 1

def precio_de(x, t):
    m = x['marca_slug']
    if m in PRECIO_MARCA: return PRECIO_MARCA[m]
    if t == 'arabe': return 45
    if m in NICHO_TOP: return 320
    if t == 'nicho': return 245
    return 95

# Precios del dueño (27-nov): saldo SIN caja y saldo CON caja, en 3 escalones según lo caro que es el perfume
# (se agrupa por el precio de referencia de arriba) y un 4.º con caja para lo más fino (Tom Ford, Le Labo, Creed…).
# Pedido literal: «sin caja 750, 850 y 950, con caja 1750, 1850 y 1950 (y los más caros en 2500)».
def escalon(ref):
    if ref <= 1499: return 750, 1750      # árabes y económicos (Armaf, Lattafa, CK, Lacoste…)
    if ref <= 2299: return 850, 1850      # diseñador medio (Versace, Hugo Boss, Mugler, Carolina Herrera…)
    if ref <= 2799: return 950, 1950      # diseñador alto (Chanel, Dior, YSL, Hermès, Montale…)
    return 950, 2500                      # premium y nicho (Tom Ford, Le Labo, Byredo, Creed, MFK, Kilian…)

def concentracion_de(nombre):
    n = nombre.lower()
    for pat, c in ((r'extrait', 'Extrait'), (r'eau de parfum|\bedp\b', 'EDP'), (r'eau de toilette|\bedt\b', 'EDT'),
                   (r'eau de cologne|\bcologne\b', 'Colonia'), (r'\bparfum\b|\bperfume\b|\belixir\b', 'Parfum')):
        if re.search(pat, n): return c
    return None

def lista_es(ns, k=None):
    vistos, out = set(), []
    for n in ns:
        t = tr(n)
        if t not in vistos:
            vistos.add(t); out.append(t)
    return out[:k] if k else out

def y(xs):
    return xs[0] if len(xs) == 1 else ', '.join(xs[:-1]) + ' y ' + xs[-1]

def descripcion(p, x):
    partes = [f"{p['nombre']} de {p['marca']} es un perfume {ADJ.get(p['familia'], 'de autor')} {PARA[p['genero']]}"
              + (f", lanzado en {p['anio']}." if p['anio'] else '.')]
    s, c, f = (lista_es(x[k], 2) for k in ('salida', 'corazon', 'fondo'))
    if s and c and f:
        partes.append(f"Abre con {y(s)}, en el corazón tiene {y(c)} y deja un fondo de {y(f)}.")
    elif s:
        partes.append(f"Sus notas principales son {y(lista_es(x['salida'] + x['corazon'] + x['fondo'], 4))}.")
    if x['acordes']:
        partes.append(f"Lo que más se siente: {y([tr(a) for a in x['acordes'][:3]])}.")
    return ' '.join(partes)

cap = lambda s: s[:1].upper() + s[1:]

# ── Épocas del año (27-nov, pedido del dueño: «primavera, verano, otoño o invierno; puede ser más de una») ─────
# Se ESTIMAN de los 5 acordes principales (lo que más se siente): cada acorde tiene una «temperatura»: + fresco y
# ligero (va con calor), − cálido y denso (va con frío). Se promedian dando más peso al primero.
#   promedio ≥ +0,35 → Primavera y Verano · ≤ −0,35 → Otoño e Invierno · en medio → Primavera y Otoño (entretiempo).
#   Un floral entre los 3 primeros suma Primavera salvo que el perfume sea muy cálido.
# Revisado a mano en conocidos: Light Blue y Cool Water → primavera y verano; Black Opium y Tobacco Vanille → otoño
# e invierno; Bleu de Chanel y Eros → primavera y otoño. Es una estimación: el dueño la cambia perfume por perfume
# en precios.html (columna «temporadas» de precios.csv) y esa manda sobre esta.
TEMP = {
    'citrus': 2, 'fresh': 2, 'aquatic': 2, 'marine': 2, 'ozonic': 2, 'salty': 1.5, 'tropical': 1.5, 'green': 1.5,
    'fresh spicy': 1, 'aromatic': 1, 'fruity': 1, 'coconut': 1, 'herbal': 1, 'lavender': 0.8,
    'white floral': 0.5, 'floral': 0.5, 'yellow floral': 0.5, 'anis': 0.5, 'vodka': 0.5, 'metallic': 0.5,
    'rose': 0.3, 'violet': 0.3, 'tuberose': 0, 'cannabis': 0, 'musky': 0, 'aldehydic': 0, 'iris': 0, 'powdery': -0.2,
    'woody': -0.5, 'sweet': -0.8, 'soft spicy': -0.8, 'mossy': -0.8, 'lactonic': -0.8, 'cherry': -0.8,
    'earthy': -1, 'patchouli': -1, 'almond': -1, 'nutty': -1, 'honey': -1.2,
    'vanilla': -1.5, 'warm spicy': -1.5, 'amber': -1.5, 'leather': -1.5, 'cinnamon': -1.5, 'caramel': -1.5,
    'balsamic': -1.5, 'animalic': -1.5, 'coffee': -1.5, 'cacao': -1.5, 'chocolate': -1.5, 'rum': -1.5, 'whiskey': -1.5,
    'tobacco': -2, 'oud': -2, 'smoky': -2,
}
PESO = [1.0, 0.8, 0.6, 0.45, 0.35]
FLORAL = {'floral', 'white floral', 'rose', 'yellow floral', 'violet', 'tuberose', 'iris'}
EPOCAS = ['Primavera', 'Verano', 'Otoño', 'Invierno']
sin_temperatura = set()


def temporadas(acordes):
    sin_temperatura.update(a for a in acordes[:5] if a not in TEMP)
    a = [x for x in acordes[:5] if x in TEMP]
    if not a: return EPOCAS[:]
    w = PESO[:len(a)]
    sc = sum(TEMP[x] * k for x, k in zip(a, w)) / sum(w)
    t = {'Primavera', 'Verano'} if sc >= 0.35 else {'Otoño', 'Invierno'} if sc <= -0.35 else {'Primavera', 'Otoño'}
    if set(acordes[:3]) & FLORAL and sc > -1.1: t.add('Primavera')
    return [e for e in EPOCAS if e in t]
def nombre_de(x):
    nm = nombres.get(str(x['fid']))
    return nm or {'marca': MARCAS.get(x['marca_slug']) or nombre_desde_slug(x['marca_slug']),
                  'nombre': nombre_desde_slug(x['nombre_slug'])}


# ── Qué perfumes van (27-nov): los de precios.csv, en el orden de seleccion.json (los más votados primero) y los que el
# dueño agregó después, al final en el orden en que los agregó. Lo que quitó de precios.csv deja de estar aquí; lo que
# archivó sigue (con «visible» = no) para poder restaurarlo con sus precios.
ruta_csv = RAIZ / 'precios.csv'
pos_sel = {x['fid']: i for i, x in enumerate(sel)}
if ruta_csv.exists():
    ids_csv = []
    for r in csv.DictReader(ruta_csv.read_text(encoding='utf-8-sig').splitlines()):
        try:
            i = int(str(r.get('id', '')).strip())
        except ValueError:
            continue
        if i not in ids_csv: ids_csv.append(i)
    desconocidos = [i for i in ids_csv if i not in todos]
    if desconocidos: print('⚠ precios.csv trae ids que no existen en la fuente (se ignoran):', desconocidos[:20])
    pos_csv = {i: k for k, i in enumerate(ids_csv)}
    miembros = sorted((i for i in ids_csv if i in todos), key=lambda i: (pos_sel.get(i, 10**7), pos_csv[i]))
else:
    miembros = [x['fid'] for x in sel]

# Fecha de alta de cada perfume: se conserva la del catálogo anterior (la tienda ordena «lo más nuevo» por ella);
# solo los recién agregados llevan la de hoy.
creado_antes = {}
if (RAIZ / 'catalogo.js').exists():
    for m in re.finditer(r'"id":(\d+),.*?"creado":"([^"]+)"', (RAIZ / 'catalogo.js').read_text(encoding='utf-8')):
        creado_antes[int(m.group(1))] = m.group(2)

salida, sin_foto, sin_familia, fotos_nuevas = [], [], [], []
hoy = datetime.date.today().isoformat()
for orden, fid in enumerate(miembros):
    x = todos[fid]
    nm = nombre_de(x)
    t = tipo_de(x)
    fam = next((FAMILIA[a] for a in x['acordes'] if a in FAMILIA), None)
    if not fam: sin_familia.append(x['fid'])
    foto = RAIZ / 'img' / f"{x['fid']}.webp"
    if not foto.exists():
        motivo = bajar_una(x['fid'])   # perfume recién agregado: su foto se baja sola
        if motivo: print('⚠ sin foto', x['fid'], motivo)
        else: fotos_nuevas.append(x['fid'])
    if not foto.exists(): sin_foto.append(x['fid'])
    p = {'id': x['fid'], 'nombre': nm['nombre'], 'marca': nm['marca'], 'genero': x['genero'], 'tipo': t, 'familia': fam,
         'concentracion': concentracion_de(nm['nombre']), 'ml': None, 'precio': None, 'precio_antes': None, 'stock': 0,
         'notas_salida': ', '.join(lista_es(x['salida'])) or None, 'notas_corazon': ', '.join(lista_es(x['corazon'])) or None,
         'notas_fondo': ', '.join(lista_es(x['fondo'])) or None,
         'acordes': [cap(tr(a)) for a in x['acordes']], 'votos': x['votos'], 'anio': x['anio'],
         'imagen_url': f"img/{x['fid']}.webp" if foto.exists() else None,
         'destacado': orden < 12, 'visible': True, 'creado': creado_antes.get(x['fid'], hoy)}
    p['descripcion'] = descripcion(p, x)
    ref = int(a_pesos(precio_de(x, t)))
    p['precio_sin_caja'], p['precio_con_caja'] = escalon(ref)
    p['precio'] = p['precio_sin_caja']   # el más barato: lo usan los filtros y el orden por precio
    p['disponible'] = 'no'                # con_caja | sin_caja | ambas | no — se cambia en precios.html (precios.csv)
    p['temporadas'] = temporadas(x['acordes'])
    p['_ref'] = ref
    salida.append(p)

# La versión es una marca del CONTENIDO (27-nov), no la hora: si nada cambió, catalogo.js sale idéntico y la
# reconstrucción automática (reconstruir.sh) no publica nada.
cuerpo = ',\n'.join(json.dumps({k: v for k, v in p.items() if not k.startswith('_')}, ensure_ascii=False, separators=(',', ':')) for p in salida)
ver = hashlib.sha1(cuerpo.encode('utf-8')).hexdigest()[:10]
js = ('// Catálogo de la tienda: lo genera datos/armar_catalogo.py (no editar a mano; para cambiar precios, disponibilidad y\n'
      '// épocas del año: precios.html → precios.csv, que manda sobre esto). Precio sin caja / con caja por escalones (27-nov).\n'
      f"window.CATALOGO_VERSION = '{ver}';\nwindow.CATALOGO = [\n"
      + cuerpo + '\n];\n')
(RAIZ / 'catalogo.js').write_text(js, encoding='utf-8')

def q(v):
    if v is None: return 'null'
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, list): return 'array[' + ','.join(q(a) for a in v) + ']::text[]' if v else 'null'
    return "'" + str(v).replace("'", "''") + "'"
cols = ['id', 'nombre', 'marca', 'genero', 'tipo', 'familia', 'concentracion', 'ml', 'precio', 'precio_antes', 'stock', 'descripcion',
        'notas_salida', 'notas_corazon', 'notas_fondo', 'acordes', 'votos', 'anio', 'imagen_url', 'destacado', 'visible', 'temporadas']
sql = [f'-- Carga los {len(salida)} perfumes del catálogo. Correr UNA vez, DESPUÉS de esquema.sql (SQL Editor de Supabase → Run).',
       '-- Si un perfume ya existe (mismo id) no se toca: así no se pisan precios o existencias ya editados.',
       'begin;',
       f"insert into perfumes ({', '.join(cols)}) overriding system value values"]
sql.append(',\n'.join('(' + ', '.join(q(p[c]) for c in cols) + ')' for p in salida))
sql[-1] += '\non conflict (id) do nothing;'
sql += ["select setval(pg_get_serial_sequence('perfumes','id'), greatest(1000000, (select max(id) from perfumes)));", 'commit;']
(RAIZ / 'supabase' / 'semilla.sql').write_text('\n'.join(sql) + '\n', encoding='utf-8')

# ── precios.csv: lo que el dueño cambia desde el celular (precios.html) y la tienda lee al abrirse (27-nov) ──────
# Se CREA si no existe. Si ya existe NO se toca: desde el 27-nov es el dueño quien dice qué perfumes van (agregar,
# quitar y archivar en precios.html); antes este paso añadía al final los que faltaban, y eso deshacía cada «quitar».
DISP_TEXTO = {'con_caja': 'con caja', 'sin_caja': 'sin caja', 'ambas': 'con y sin caja', 'no': 'no disponible'}
CAB = ['id', 'marca', 'nombre', 'sin caja', 'con caja', 'disponible', 'temporadas', 'visible']
fila_csv = lambda p: [p['id'], p['marca'], p['nombre'], p['precio_sin_caja'], p['precio_con_caja'], DISP_TEXTO[p['disponible']],
                      ' / '.join(p['temporadas']), 'si' if p['visible'] else 'no']
if ruta_csv.exists():
    print('precios.csv: ya existía, no se toca (manda el dueño)')
else:
    with ruta_csv.open('w', encoding='utf-8', newline='') as fh:
        w = csv.writer(fh, lineterminator='\n'); w.writerow(CAB); w.writerows(fila_csv(p) for p in salida)
    print('precios.csv: creado con', len(salida), 'perfumes')

# ── buscador_perfumes.json: los 24.063 perfumes de la fuente, para buscar y agregar en precios.html (27-nov) ─────
# Una fila por perfume, de los más votados a los menos: [id, marca, nombre, género (m/h/u), año, sin caja, con caja,
# épocas (iniciales P V O I)]. Precio y épocas salen de las mismas reglas de arriba: el perfume entra completo.
G = {'mujer': 'm', 'hombre': 'h', 'unisex': 'u'}
filas_b = []
for x in sorted(todos.values(), key=lambda x: (-x['votos'], x['fid'])):
    nm = nombre_de(x)
    sin, con = escalon(int(a_pesos(precio_de(x, tipo_de(x)))))
    ep = ''.join(e[0] for e in temporadas(x['acordes']))
    filas_b.append([x['fid'], nm['marca'], nm['nombre'], G.get(x['genero'], 'u'), x['anio'] or 0, sin, con, ep])
(RAIZ / 'buscador_perfumes.json').write_text(json.dumps(filas_b, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print('buscador_perfumes.json:', len(filas_b), 'perfumes ·', round((RAIZ / 'buscador_perfumes.json').stat().st_size / 1e6, 2), 'MB')
if fotos_nuevas: print('fotos bajadas ahora:', fotos_nuevas)

from collections import Counter
print('perfumes:', len(salida), '· con foto:', len(salida) - len(sin_foto), '· sin foto:', len(sin_foto), '· sin familia:', sin_familia)
print('familias:', dict(Counter(p['familia'] for p in salida)))
print('tipos:', dict(Counter(p['tipo'] for p in salida)), '· géneros:', dict(Counter(p['genero'] for p in salida)))
print('precios (sin caja, con caja):', dict(sorted(Counter((p['precio_sin_caja'], p['precio_con_caja']) for p in salida).items())))
print('concentración:', dict(Counter(p['concentracion'] for p in salida)))
print('marcas a 95 por defecto:', sorted({todos[p['id']]['marca_slug'] for p in salida if p['_ref'] == a_pesos(95)}))
print('épocas por perfume:', dict(Counter(len(p['temporadas']) for p in salida)), '·',
      dict(Counter(e for p in salida for e in p['temporadas'])), '· acordes sin temperatura:', sorted(sin_temperatura) or 0)
print('versión:', ver)
