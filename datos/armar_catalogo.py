# Arma el catálogo de la tienda (../catalogo.js) y la carga para la base de datos (../supabase/semilla.sql)
# a partir de: seleccion.json (los 500 perfumes), nombres.json (marca y nombre bien escritos),
# notas_es.json (cada nota y acorde en español) y las fotos ya bajadas en ../img/.
#
# Los PRECIOS son de referencia por marca (ver PRECIO_MARCA): sirven para que el catálogo se vea completo y los
# filtros de precio funcionen. Hay que cambiarlos por los reales (panel → Exportar lista → editar → Importar).
# Las existencias empiezan en 0: todo sale «Por encargo» hasta que se carguen las reales.
# Los votos de Fragrantica se usan solo para ORDENAR por popularidad; no se muestran (son de una copia vieja).
#
# Uso: python -I armar_catalogo.py      (se puede correr cuantas veces haga falta; no toca precios ya editados
#                                         en la base, solo reescribe catalogo.js y semilla.sql)
import json, pathlib, re, datetime

AQUI = pathlib.Path(__file__).parent
RAIZ = AQUI.parent
leer = lambda n: json.loads((AQUI / n).read_text(encoding='utf-8'))
sel, nombres, es = leer('seleccion.json'), leer('nombres.json'), leer('notas_es.json')

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

def precio_de(x, t):
    m = x['marca_slug']
    if m in PRECIO_MARCA: return PRECIO_MARCA[m]
    if t == 'arabe': return 45
    if m in NICHO_TOP: return 320
    if t == 'nicho': return 245
    return 95

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
salida, sin_foto, sin_familia = [], [], []
hoy = datetime.date.today().isoformat()
for orden, x in enumerate(sel):
    nm = nombres[str(x['fid'])]
    t = tipo_de(x)
    fam = next((FAMILIA[a] for a in x['acordes'] if a in FAMILIA), None)
    if not fam: sin_familia.append(x['fid'])
    foto = RAIZ / 'img' / f"{x['fid']}.webp"
    if not foto.exists(): sin_foto.append(x['fid'])
    p = {'id': x['fid'], 'nombre': nm['nombre'], 'marca': nm['marca'], 'genero': x['genero'], 'tipo': t, 'familia': fam,
         'concentracion': concentracion_de(nm['nombre']), 'ml': None, 'precio': precio_de(x, t), 'precio_antes': None, 'stock': 0,
         'notas_salida': ', '.join(lista_es(x['salida'])) or None, 'notas_corazon': ', '.join(lista_es(x['corazon'])) or None,
         'notas_fondo': ', '.join(lista_es(x['fondo'])) or None,
         'acordes': [cap(tr(a)) for a in x['acordes']], 'votos': x['votos'], 'anio': x['anio'],
         'imagen_url': f"img/{x['fid']}.webp" if foto.exists() else None,
         'destacado': orden < 12, 'visible': True, 'creado': hoy}
    p['descripcion'] = descripcion(p, x)
    salida.append(p)

ver = datetime.datetime.now().strftime('%Y%m%d%H%M')
js = ('// Catálogo de la tienda: lo genera datos/armar_catalogo.py (no editar a mano; para cambiar precios y existencias\n'
      '// usar el panel: Exportar lista → editar en Excel → Importar). Precios de referencia por marca; existencias en 0.\n'
      f"window.CATALOGO_VERSION = '{ver}';\nwindow.CATALOGO = [\n"
      + ',\n'.join(json.dumps(p, ensure_ascii=False, separators=(',', ':')) for p in salida) + '\n];\n')
(RAIZ / 'catalogo.js').write_text(js, encoding='utf-8')

def q(v):
    if v is None: return 'null'
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, list): return 'array[' + ','.join(q(a) for a in v) + ']::text[]' if v else 'null'
    return "'" + str(v).replace("'", "''") + "'"
cols = ['id', 'nombre', 'marca', 'genero', 'tipo', 'familia', 'concentracion', 'ml', 'precio', 'precio_antes', 'stock', 'descripcion',
        'notas_salida', 'notas_corazon', 'notas_fondo', 'acordes', 'votos', 'anio', 'imagen_url', 'destacado', 'visible']
sql = ['-- Carga los 500 perfumes del catálogo. Correr UNA vez, DESPUÉS de esquema.sql (SQL Editor de Supabase → Run).',
       '-- Si un perfume ya existe (mismo id) no se toca: así no se pisan precios o existencias ya editados.',
       'begin;',
       f"insert into perfumes ({', '.join(cols)}) overriding system value values"]
sql.append(',\n'.join('(' + ', '.join(q(p[c]) for c in cols) + ')' for p in salida))
sql[-1] += '\non conflict (id) do nothing;'
sql += ["select setval(pg_get_serial_sequence('perfumes','id'), greatest(1000000, (select max(id) from perfumes)));", 'commit;']
(RAIZ / 'supabase' / 'semilla.sql').write_text('\n'.join(sql) + '\n', encoding='utf-8')

from collections import Counter
print('perfumes:', len(salida), '· con foto:', len(salida) - len(sin_foto), '· sin foto:', len(sin_foto), '· sin familia:', sin_familia)
print('familias:', dict(Counter(p['familia'] for p in salida)))
print('tipos:', dict(Counter(p['tipo'] for p in salida)), '· géneros:', dict(Counter(p['genero'] for p in salida)))
print('precios:', dict(sorted(Counter(p['precio'] for p in salida).items())))
print('concentración:', dict(Counter(p['concentracion'] for p in salida)))
print('marcas a 95 por defecto:', sorted({x['marca_slug'] for x, p in zip(sel, salida) if p['precio'] == 95}))
print('versión:', ver)
