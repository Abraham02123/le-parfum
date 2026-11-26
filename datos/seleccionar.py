# Elige los 500 perfumes del catálogo a partir de la copia del listado de Fragrantica (fuente/fra_cleaned.csv).
# Regla: los 460 con más votos + los 40 árabes con más votos que no estén ya. Sin el añadido de árabes, la
# categoría «Árabes» de la tienda quedaba con 4 perfumes (el listado por votos casi no los tiene).
# Salida: seleccion.json (500 filas) y notas_lista.txt (cada nota y acorde distintos, para traducir).
# Uso: python -I seleccionar.py
import csv, io, json, re, pathlib

AQUI = pathlib.Path(__file__).parent
ARABES = ('lattafa', 'armaf', 'rasasi', 'al-haramain', 'afnan', 'ajmal', 'swiss-arabian', 'arabian-oud',
          'alhambra', 'zaafaran', 'nabeel', 'al-rehab', 'orientica', 'paris-corner', 'fragrance-world', 'asdaaf')
N_TOTAL, N_ARABES = 500, 40

texto = (AQUI / 'fuente' / 'fra_cleaned.csv').read_bytes().decode('cp1252', errors='replace')
filas, vistos = [], set()
for r in csv.DictReader(io.StringIO(texto), delimiter=';'):
    m = re.search(r'/perfume/([^/]+)/([^/]+)-(\d+)\.html$', r['url'].strip())
    votos = (r['Rating Count'] or '').strip()
    if not m or not votos.isdigit() or int(m[3]) in vistos:
        continue
    vistos.add(int(m[3]))
    lista = lambda s: [x.strip() for x in (s or '').split(',') if x.strip() and x.strip() != 'unknown']
    filas.append({
        'fid': int(m[3]), 'marca_slug': m[1], 'nombre_slug': m[2], 'votos': int(votos),
        'nota': float(r['Rating Value'].replace(',', '.')) if r['Rating Value'].strip() else None,
        'genero': {'women': 'mujer', 'men': 'hombre'}.get(r['Gender'].strip().lower(), 'unisex'),
        'anio': int(r['Year']) if r['Year'].strip().isdigit() else None,
        'acordes': [a for a in (r[f'mainaccord{i}'].strip() for i in range(1, 6)) if a and a != 'unknown'],
        'salida': lista(r['Top']), 'corazon': lista(r['Middle']), 'fondo': lista(r['Base']),
        'arabe': any(a in m[1] for a in ARABES),
    })
filas.sort(key=lambda x: -x['votos'])
elegidos = filas[:N_TOTAL - N_ARABES]
ya = {x['fid'] for x in elegidos}
elegidos += [x for x in filas if x['arabe'] and x['fid'] not in ya][:N_TOTAL - len(elegidos)]
assert len(elegidos) == N_TOTAL and len({x['fid'] for x in elegidos}) == N_TOTAL
(AQUI / 'seleccion.json').write_text(json.dumps(elegidos, ensure_ascii=False, indent=0), encoding='utf-8')
voc = sorted({n for x in elegidos for k in ('salida', 'corazon', 'fondo', 'acordes') for n in x[k]})
(AQUI / 'notas_lista.txt').write_text('\n'.join(voc), encoding='utf-8')
print(len(elegidos), 'perfumes ·', sum(x['arabe'] for x in elegidos), 'árabes ·', len(voc), 'notas y acordes distintos')
