import csv, json, re, sys, io

FUENTE = r"D:\tienda-perfumes\datos\fuente\fra_cleaned.csv"
SALIDA = r"D:\tienda-perfumes\datos\populares_crudo.json"
PARTICULAS = {"de", "di", "du", "la", "le", "of", "and", "by", "del", "da", "von"}

def leer_filas(ruta):
    raw = open(ruta, "rb").read()
    for enc in ("utf-8", "cp1252", "latin-1"):
        try:
            texto = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    return list(csv.DictReader(io.StringIO(texto), delimiter=";"))

def num_votos(s):
    s = (s or "").strip().replace(" ", "")
    if not s:
        return None
    if re.fullmatch(r"\d{1,3}(\.\d{3})+", s):   # 1.234 -> miles
        s = s.replace(".", "")
    elif re.fullmatch(r"\d{1,3}(,\d{3})+", s):  # 1,234 -> miles
        s = s.replace(",", "")
    return int(float(s.replace(",", ".")))

def nota_f(s):
    s = (s or "").strip()
    return float(s.replace(",", ".")) if s else None

def titulo(slug):
    partes = slug.split("-")
    out = []
    for i, p in enumerate(partes):
        if i > 0 and p in PARTICULAS:
            out.append(p)
        else:
            out.append(p[:1].upper() + p[1:])
    return " ".join(out)

def genero(g):
    g = (g or "").strip().lower()
    if g == "women":
        return "mujer"
    if g == "men":
        return "hombre"
    return "unisex"

filas = leer_filas(FUENTE)
print("filas leidas:", len(filas))
vistos, datos, sin_fid, sin_votos = set(), [], 0, 0
for r in filas:
    url = (r.get("url") or "").strip()
    m = re.search(r"/perfume/([^/]+)/([^/]+)-(\d+)\.html$", url)
    if not m:
        sin_fid += 1
        continue
    fid = int(m.group(3))
    votos = num_votos(r.get("Rating Count"))
    if votos is None:
        sin_votos += 1
        continue
    if fid in vistos:
        continue
    vistos.add(fid)
    acordes = [r.get(f"mainaccord{i}", "").strip() for i in range(1, 6)]
    acordes = [a for a in acordes if a]
    perf = [p.strip() for p in (r.get("Perfumer1", ""), r.get("Perfumer2", "")) if p and p.strip()]
    anio = (r.get("Year") or "").strip()
    datos.append({
        "fid": fid,
        "nombre": titulo(m.group(2)),
        "marca": titulo(m.group(1)),
        "genero": genero(r.get("Gender")),
        "anio": int(anio) if anio.isdigit() else None,
        "votos": votos,
        "nota": nota_f(r.get("Rating Value")),
        "acordes": acordes,
        "salida": (r.get("Top") or "").strip(),
        "corazon": (r.get("Middle") or "").strip(),
        "fondo": (r.get("Base") or "").strip(),
        "perfumistas": ", ".join(perf),
        "url": url,
    })

datos.sort(key=lambda x: (-x["votos"], x["fid"]))
top = datos[:500]
print("unicos por fid:", len(datos), "| sin fid:", sin_fid, "| sin votos:", sin_votos)
with open(SALIDA, "w", encoding="utf-8") as f:
    json.dump(top, f, ensure_ascii=False, indent=1)
print("escrito:", SALIDA, len(top))
