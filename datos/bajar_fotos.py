# Baja la foto del frasco de cada perfume de seleccion.json (la misma que muestra Fragrantica, que es la
# foto oficial de la marca) y la guarda en ../img/<fid>.webp, más liviana que el jpg original.
# Es educado con el servidor: una foto cada 0,6 s y no repite las que ya están. Se puede cortar y relanzar.
# Uso: python -I bajar_fotos.py      (sale con la lista de las que fallaron, si alguna)
import io, json, pathlib, time, urllib.request
from PIL import Image

AQUI = pathlib.Path(__file__).parent
DESTINO = AQUI.parent / 'img'
DESTINO.mkdir(exist_ok=True)
URL = 'https://fimgs.net/mdimg/perfume/375x500.{}.jpg'
fallan = []
for x in json.loads((AQUI / 'seleccion.json').read_text(encoding='utf-8')):
    final = DESTINO / f"{x['fid']}.webp"
    if final.exists() and final.stat().st_size > 2000:
        continue
    for intento in range(3):
        try:
            pet = urllib.request.Request(URL.format(x['fid']), headers={'User-Agent': 'Mozilla/5.0 (catalogo-tienda)'})
            datos = urllib.request.urlopen(pet, timeout=40).read()
            im = Image.open(io.BytesIO(datos)).convert('RGB')
            im.save(final, 'WEBP', quality=82, method=6)
            break
        except Exception as e:
            err = e
            time.sleep(3 * (intento + 1))
    else:
        fallan.append((x['fid'], str(err)[:60]))
    time.sleep(0.6)
total = len(list(DESTINO.glob('*.webp')))
print('fotos en img/:', total, '· fallaron:', len(fallan), fallan[:20])
