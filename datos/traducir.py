# -*- coding: utf-8 -*-
"""Genera notas_es.json (traduccion de notas_lista.txt) y nombres.json (marca y nombre
bien escritos de seleccion.json). Solo escribe esos dos JSON. Salida UTF-8, ensure_ascii=False."""
import json
import os

DIR = r"D:\tienda-perfumes\datos"

# ---------------------------------------------------------------- NOTAS: "ingles|espanol"
NOTAS = """
african freesia petals|pétalos de fresia africana
african geranium|geranio africano
african orange flower|flor de naranjo africana
agarwood (oud)|agalocha (oud)
akigalawood|akigalawood
aldehydes|aldehídos
aldehydic|aldehídico
almond|almendra
almond blossom|flor de almendro
almond milk|leche de almendra
almond tree|almendro
amalfi lemon|limón de Amalfi
amaretto|amaretto
amaryllis|amarilis
amber|ámbar
ambergris|ámbar gris
amberwood|amberwood
ambrette (musk mallow)|ambrette (malva almizclera)
ambrettolide|ambrettolide
ambroxan|ambroxan
amyl salicylate|salicilato de amilo
angelica|angélica
animalic|animálico
anis|anís
anise|anís
apple|manzana
apple blossom|flor de manzano
apple leaf|hoja de manzana
apple tree|manzano
apple tree blossom|flor de manzano
apricot|albaricoque
apricot blossom|flor de albaricoque
aquatic|acuático
aquozone|aquozone
aromatic|aromático
artemisia|artemisa
atlas cedar|cedro del Atlas
australian sandalwood|sándalo australiano
balsam fir|abeto balsámico
balsamic|balsámico
bamboo|bambú
banana leaf|hoja de plátano
basil|albahaca
bay leaf|hoja de laurel
beeswax|cera de abeja
bellflower|campanilla
benzoin|benjuí
bergamot|bergamota
big strawberry|fresa grande
birch|abedul
bitter almond|almendra amarga
bitter orange|naranja amarga
black amber|ámbar negro
black cardamom|cardamomo negro
black cherry|cereza negra
black currant|grosella negra
black elder|saúco negro
black locust|robinia
black orchid|orquídea negra
black pepper|pimienta negra
black rose|rosa negra
black tea|té negro
black vanilla husk|cáscara negra de vainilla
black violet|violeta negra
blackberry|mora
blood grapefruit|pomelo sanguino
blood mandarin|mandarina sanguina
blood orange|naranja sanguina
blue hyacinth|jacinto azul
blue lotus|loto azul
blueberry|arándano
boronia|boronia
bourbon geranium|geranio bourbon
bourbon vanilla|vainilla bourbon
bourbon vetiver|vetiver bourbon
brazilian rosewood|palisandro brasileño
brown sugar|azúcar moreno
buddleia|budleya
bulgarian rose|rosa de Bulgaria
bulrush|enea
cacao|cacao
cacao pod|vaina de cacao
cactus|cactus
cactus flower|flor de cactus
calabrian bergamot|bergamota calabresa
california cedar|cedro de California
californian gardenia|gardenia de California
calone|calone
camelia|camelia
candied almond|almendra confitada
candied fruits|frutas confitadas
candied lemon|limón confitado
candy apple|manzana de caramelo
cannabis|cannabis
cappuccino|capuchino
carambola (star fruit)|carambola (fruta estrella)
caramel|caramelo
caraway|alcaravea
cardamom|cardamomo
cardamon|cardamomo
carnation|clavel
carrot|zanahoria
carrot seeds|semillas de zanahoria
casablanca lily|azucena de Casablanca
cashmeran|cashmeran
cashmere wood|madera de cachemira
cashmirwood|madera de cachemira
cassia|casia
cassis|casis
castoreum|castóreo
cedar|cedro
cedarwood|madera de cedro
celery seeds|semillas de apio
cetalox|cetalox
ceylon cinnamon|canela de Ceilán
chamomile|manzanilla
champaca|champaca
cherry|cereza
cherry blossom|flor de cerezo
cherry liqueur|licor de cereza
chestnut|castaña
chinese cinnamon wood|madera de canela china
chinese jasmine|jazmín chino
chinotto|chinotto
chocolate|chocolate
cinnamon|canela
citron|cidra
citrus|cítrico
citruses|cítricos
civet|civeta
civetta|civetta
clary sage|salvia sclarea
clementine|clementina
clove|clavo
clover|trébol
cloves|clavos
coal|carbón
coca-cola|coca-cola
coconut|coco
coconut milk|leche de coco
coconut water|agua de coco
coffee|café
cognac|coñac
coriander|cilantro
cotton candy|algodón de azúcar
cotton flower|flor de algodón
coumarin|cumarina
cranberry|arándano rojo
creme brulee|crema brulée
cucumber|pepino
cumin|comino
cupcake|magdalena
cyclamen|ciclamen
cypress|ciprés
cypriol oil or nagarmotha|aceite de cipirol o nagarmotha
damask rose|rosa damascena
dark chocolate|chocolate negro
dates|dátiles
datura|datura
davana|davana
dried fruits|frutas secas
driftwood|madera de deriva
dry wood|madera seca
earthy|terroso
earthy notes|notas terrosas
egyptian jasmine|jazmín egipcio
egyptian rose|rosa egipcia
elemi|elemí
elemi resin|resina de elemí
exotic woods|maderas exóticas
false jasmine|falso jazmín
fennel|hinojo
fig|higo
fig leaf|hoja de higuera
fig nectar|néctar de higo
fig tree|higuera
fir|abeto
fir resin|resina de abeto
flax|lino
flint|pedernal
floral|floral
floral notes|notas florales
flowers|flores
forget me not|nomeolvides
frangipani|frangipani
frankincense|incienso
freesia|fresia
french labdanum|labdano francés
fresh|fresco
fresh almond|almendra fresca
fresh spicy|especiado fresco
fruits|frutas
fruity|frutal
fruity notes|notas frutales
galanga|galanga
galbanum|gálbano
galbanum leaf|hoja de gálbano
gardenia|gardenia
geranium|geranio
gin|ginebra
ginger|jengibre
ginger flower|flor de jengibre
goji berries|bayas de goji
gooseberry|grosella espinosa
gourmand accord|acorde gourmand
granny smith apple|manzana Granny Smith
grapefruit|pomelo
grapefruit blossom|flor de pomelo
grapes|uvas
grass|hierba
grasse rose|rosa de Grasse
green|verde
green accord|acorde verde
green apple|manzana verde
green grass|hierba verde
green leaves|hojas verdes
green lilac|lila verde
green lily|lirio verde
green mandarin|mandarina verde
green mango|mango verde
green notes|notas verdes
green tea|té verde
guaiac wood|guayaco
guatemalan cardamom|cardamomo guatemalteco
guava|guayaba
haitian vetiver|vetiver haitiano
hawthorn|espino
hazelnut|avellana
hazelnut cocoa spread|crema de cacao y avellanas
hedione|hedione
heliotrope|heliotropo
helvetolide|helvetolide
herbal|herbal
herbal notes|notas herbales
hiacynth|jacinto
hibiscus|hibisco
hibiscus seed|semilla de hibisco
himalayan poppy|amapola del Himalaya
holly|acebo
honey|miel
honeycomb|panal de miel
honeysuckle|madreselva
hyacinth|jacinto
ice|hielo
immortelle|siempreviva
incense|incienso
indian jasmine|jazmín indio
indian mandarin|mandarina india
indian patchouli|pachulí indio
indian saffron|azafrán indio
indian tuberose|nardo indio
indonesian nutmeg|nuez moscada indonesia
indonesian patchouli leaf|hoja de pachulí indonesio
iris|iris
iso e super|iso e super
italian iris|iris italiano
italian jasmine|jazmín italiano
italian lemon|limón italiano
italian mandarin|mandarina italiana
italian orange|naranja italiana
ivy|hiedra
japanese osmanthus|osmanto japonés
jasmine|jazmín
jasmine sambac|jazmín sambac
jasmine tea|té de jazmín
java vetiver oil|aceite de vetiver de Java
juniper|enebro
juniper berries|bayas de enebro
juniper berry|baya de enebro
karo karounde|karo karounde
kiwi|kiwi
kulfi|kulfi
kumquat|kumquat
labdanum|labdano
lactonic|lactónico
lavender|lavanda
leather|cuero
lemon|limón
lemon tree|limonero
lemon verbena|hierba luisa
lemon zest|piel de limón
licorice|regaliz
lilac|lila
lily|lirio
lily of the valley|lirio de los valles
lily-of-the-valley|lirio de los valles
lime|lima
lime (linden blossom)|lima (flor de tilo)
lime blossom|flor de lima
liquidambar|liquidámbar
litchi|lichi
lotus|loto
mace|macis
madagascar pepper|pimienta de Madagascar
madagascar sandalwood|sándalo de Madagascar
madagascar vanilla|vainilla de Madagascar
madagascar vetiver|vetiver de Madagascar
magnolia|magnolia
mahogany|caoba
mahonial|mahonial
malt|malta
mandarin leaf|hoja de mandarina
mandarin orange|naranja mandarina
mango|mango
marigold|caléndula
marine|marino
marshmallow|malvavisco
martini|martini
massoia wood|madera de massoia
mastic or lentisque|almáciga o lentisco
mate|mate
may rose|rosa de mayo
melon|melón
metallic|metálico
metallic notes|notas metálicas
mexican chocolate|chocolate mexicano
mignonette|reseda
milk|leche
mimosa|mimosa
mineral notes|notas minerales
mint|menta
mirabelle|mirabel
moroccan jasmine|jazmín marroquí
moroccan lemon|limón marroquí
moroccan rose|rosa marroquí
moss|musgo
mossy|musgoso
mulberry|morera
musk|almizcle
musk vodka|vodka con almizcle
musky|almizclado
myrhh|mirra
myrrh|mirra
myrtle|mirto
mysore sandalwood|sándalo de Mysore
narcissus|narciso
nashi pear|pera nashi
nasturtium|capuchina
natural vanilla|vainilla natural
nectarine|nectarina
neroli|neroli
neroli essence|esencia de neroli
night blooming cereus|cereus nocturno
nutmeg|nuez moscada
nutmeg flower|flor de nuez moscada
nutty|a frutos secos
oak|roble
oak moss|musgo de roble
oakmoss|musgo de roble
olibanum|olíbano
olive blossom|flor de olivo
olive tree|olivo
opoponax|opopónax
orange|naranja
orange blossom|azahar
orange peel|piel de naranja
orange pepper|pimienta naranja
orchid|orquídea
oregano|orégano
oriental notes|notas orientales
orris|raíz de iris
orris root|raíz de iris
osmanthus|osmanto
oud|oud
ozonic|ozónico
ozonic notes|notas ozónicas
palisander rosewood|palisandro
palmarosa|palmarrosa
panacotta|panna cotta
papaya|papaya
papaya flower|flor de papaya
paprika|pimentón
papyrus|papiro
parma violet|violeta de Parma
passion flower|pasiflora
passionfruit|fruta de la pasión
patchouli|pachulí
patchouli leaf|hoja de pachulí
peach|melocotón
peach blossom|flor de melocotonero
pear|pera
peat|turba
pelargonium|pelargonio
peony|peonía
pepper|pimienta
pepper oil|aceite de pimienta
pepperwood\u2122|pepperwood\u2122
precious woods|maderas preciosas
persimmon|caqui
peru balsam|bálsamo del Perú
petalia|petalia
petitgrain|petitgrain
pimento|pimienta de Jamaica
pimento leaf|hoja de pimienta de Jamaica
pine|pino
pine needles|agujas de pino
pine tree|pino
pine tree needles|agujas de pino
pineapple|piña
pink grapefruit|pomelo rosa
pink peony|peonía rosa
pink pepper|pimienta rosa
pink tulip|tulipán rosa
pistachio|pistacho
pitosporum|pittosporo
plum|ciruela
pomegranate|granada
pomelo|pomelo
popcorn|palomitas de maíz
powdery|atalcado
powdery notes|notas atalcadas
praline|praliné
quince|membrillo
rangoon creeper|enredadera de Rangún
raspberry|frambuesa
red apple|manzana roja
red berries|bayas rojas
red cedar|cedro rojo
red currant|grosella roja
red currant leaf|hoja de grosella roja
red cyclamen|ciclamen rojo
red fruits|frutos rojos
red litchi|lichi rojo
red thyme|tomillo rojo
reed|caña
resins|resinas
rhubarb|ruibarbo
rhubarb leaf|hoja de ruibarbo
rhuburb|ruibarbo
rice|arroz
roasted coffee beans|granos de café tostados
rose|rosa
rose de mai|rosa de mayo
rose hip|escaramujo
rose oil|aceite de rosa
rose water|agua de rosas
rosemary|romero
rum|ron
saffron|azafrán
sage|salvia
salt|sal
salty|salado
sand|arena
sandalwood|sándalo
sapodilla|sapote
sea notes|notas marinas
sea salt|sal marina
sea water|agua de mar
seaweed|algas
shiso|shiso
sichuan pepper|pimienta de Sichuan
sicilian bergamot|bergamota siciliana
sicilian lemon|limón siciliano
sicilian mandarin|mandarina siciliana
sicilian orange|naranja siciliana
silk tree blossom|flor de albicia
silkwood blossom|flor de madera de seda
smoke|humo
smoky|ahumado
soft spicy|especiado suave
soil tincture|tintura de tierra
sour cherry|cereza ácida
spices|especias
spicy notes|notas especiadas
star anise|anís estrellado
stephanotis|estefanotis
strawberry|fresa
strelitzia|strelitzia
styrax|estoraque
suede|ante
sugar|azúcar
sugar cane|caña de azúcar
sweet|dulce
sweet notes|notas dulces
sweet pea|guisante de olor
sycamore|sicómoro
sylkolide|sylkolide
syringa|siringa
tagetes|tagetes
tahitian tiare flower|flor de tiaré de Tahití
tahitian vanilla|vainilla de Tahití
tahitian vetiver|vetiver de Tahití
taif rose|rosa de Taif
tamarind|tamarindo
tangerine|tangerina
tarragon|estragón
tea|té
tea rose|rosa té
teak wood|madera de teca
texas cedar|cedro de Texas
thanaka wood|madera de thanaka
thyme|tomillo
tiare flower|flor de tiaré
tincture of rose|tintura de rosa
tobacco|tabaco
tobacco blossom|flor de tabaco
tobacco leaf|hoja de tabaco
toffee|toffee
tolu balsam|bálsamo de tolú
tomato|tomate
tomato leaf|hoja de tomate
tonka bean|haba tonka
tropical|tropical
tropical fruits|frutas tropicales
truffle|trufa
tuberose|nardo
tunisian orange blossom|azahar tunecino
turkish rose|rosa turca
turmeric|cúrcuma
tuscan iris|iris toscano
vanila|vainilla
vanilla|vainilla
vanilla absolute|absoluto de vainilla
vanilla bean|vaina de vainilla
vanilla caviar|caviar de vainilla
vanilla flower|flor de vainilla
vanilla orchid|orquídea de vainilla
vanilla pod|vaina de vainilla
vanille|vainilla
vetiver|vetiver
vetyver|vetiver
vinyl|vinilo
violet|violeta
violet leaf|hoja de violeta
violet root|raíz de violeta
virginia cedar|cedro de Virginia
virginian cedar|cedro de Virginia
vodka|vodka
wallflower|alhelí
warm spicy|especiado cálido
water hyacinth|jacinto de agua
water jasmine|jazmín de agua
water lily|nenúfar
water notes|notas acuáticas
water peony|peonía acuática
watermelon|sandía
watery notes|notas acuosas
west indian bay|laurel de las Antillas
whipped cream|nata montada
whiskey|whisky
white amber|ámbar blanco
white bergamot|bergamota blanca
white camelia|camelia blanca
white cedar extract|extracto de cedro blanco
white chocolate|chocolate blanco
white floral|floral blanco
white flowers|flores blancas
white honey|miel blanca
white iris|iris blanco
white lily|lirio blanco
white lotus|loto blanco
white musk|almizcle blanco
white nerium oleander|adelfa blanca
white peach|melocotón blanco
white pear|pera blanca
white pepper|pimienta blanca
white rose|rosa blanca
white rum|ron blanco
white tea|té blanco
white tobacco|tabaco blanco
white violet|violeta blanca
white woods|maderas blancas
wild berries|bayas silvestres
wild lavender|lavanda silvestre
wisteria|glicinia
woodsy notes|notas amaderadas
woody|amaderado
woody notes|notas amaderadas
wormwood|ajenjo
yellow floral|floral amarillo
yellow freesia|fresia amarilla
ylang-ylang|ylang-ylang
yuzu|yuzu
"""


def leer_notas():
    tr = {}
    for linea in NOTAS.split("\n"):
        if not linea.strip():
            continue
        en, es = linea.split("|", 1)
        tr[en] = es.strip()
    return tr


def escribir_notas():
    lista = [l for l in open(os.path.join(DIR, "notas_lista.txt"), encoding="utf-8").read().splitlines() if l]
    tr = leer_notas()
    faltan = [x for x in lista if not tr.get(x, "").strip()]
    if faltan:
        raise SystemExit("SIN TRADUCIR: %r" % faltan)
    salida = {x: tr[x] for x in lista}
    with open(os.path.join(DIR, "notas_es.json"), "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=1)
    print("notas_es.json:", len(salida), "entradas")


# ---------------------------------------------------------------- NOMBRES
MARCAS = {
    "mugler": "Mugler", "dolce-gabbana": "Dolce & Gabbana", "chanel": "Chanel", "lancome": "Lancôme",
    "tom-ford": "Tom Ford", "yves-saint-laurent": "Yves Saint Laurent", "dior": "Dior", "hermes": "Hermès",
    "versace": "Versace", "calvin-klein": "Calvin Klein", "maison-francis-kurkdjian": "Maison Francis Kurkdjian",
    "chloe": "Chloé", "creed": "Creed", "lalique": "Lalique", "paco-rabanne": "Paco Rabanne",
    "giorgio-armani": "Giorgio Armani", "jean-paul-gaultier": "Jean Paul Gaultier", "viktor-rolf": "Viktor&Rolf",
    "narciso-rodriguez": "Narciso Rodriguez", "carolina-herrera": "Carolina Herrera", "guerlain": "Guerlain",
    "armaf": "Armaf", "maison-martin-margiela": "Maison Margiela", "davidoff": "Davidoff", "prada": "Prada",
    "donna-karan": "Donna Karan", "issey-miyake": "Issey Miyake", "nina-ricci": "Nina Ricci", "kenzo": "Kenzo",
    "britney-spears": "Britney Spears", "aquolina": "Aquolina", "ariana-grande": "Ariana Grande",
    "cacharel": "Cacharel", "elizabeth-arden": "Elizabeth Arden", "nautica": "Nautica", "by-kilian": "By Kilian",
    "givenchy": "Givenchy", "byredo": "Byredo", "marc-jacobs": "Marc Jacobs", "parfums-de-marly": "Parfums de Marly",
    "juicy-couture": "Juicy Couture", "montblanc": "Montblanc", "hugo-boss": "Hugo Boss", "burberry": "Burberry",
    "azzaro": "Azzaro", "lolita-lempicka": "Lolita Lempicka", "bvlgari": "Bvlgari", "nasomatto": "Nasomatto",
    "moschino": "Moschino", "estee-lauder": "Estée Lauder", "mancera": "Mancera", "elie-saab": "Elie Saab",
    "jimmy-choo": "Jimmy Choo", "montale": "Montale", "diptyque": "Diptyque", "bentley": "Bentley",
    "cerruti": "Cerruti", "zadig-voltaire": "Zadig & Voltaire", "sarah-jessica-parker": "Sarah Jessica Parker",
    "frederic-malle": "Frédéric Malle", "tauer-perfumes": "Tauer Perfumes", "afnan": "Afnan", "chopard": "Chopard",
    "tommy-hilfiger": "Tommy Hilfiger", "nishane": "Nishane", "bottega-veneta": "Bottega Veneta",
    "tiziana-terenzi": "Tiziana Terenzi", "jo-malone-london": "Jo Malone London", "paloma-picasso": "Paloma Picasso",
    "balenciaga": "Balenciaga", "agent-provocateur": "Agent Provocateur", "salvador-dali": "Salvador Dalí",
    "valentino": "Valentino", "acqua-di-parma": "Acqua di Parma", "cartier": "Cartier", "vera-wang": "Vera Wang",
    "clinique": "Clinique", "amouage": "Amouage", "juliette-has-a-gun": "Juliette Has a Gun",
    "guy-laroche": "Guy Laroche", "avon": "Avon", "sol-de-janeiro": "Sol de Janeiro", "trussardi": "Trussardi",
    "xerjoff": "Xerjoff", "lacoste-fragrances": "Lacoste", "gucci": "Gucci", "ralph-lauren": "Ralph Lauren",
    "lattafa-perfumes": "Lattafa", "initio-parfums-prives": "Initio Parfums Privés", "ex-nihilo": "Ex Nihilo",
    "sisley": "Sisley", "shiseido": "Shiseido", "yves-rocher": "Yves Rocher", "serge-lutens": "Serge Lutens",
    "escada": "Escada", "gres": "Grès", "joop": "Joop!", "rochas": "Rochas", "le-labo": "Le Labo",
    "rasasi": "Rasasi", "lanvin": "Lanvin", "van-cleef-arpels": "Van Cleef & Arpels", "bdk-parfums": "BDK Parfums",
    "victoria-s-secret": "Victoria's Secret", "gloria-vanderbilt": "Gloria Vanderbilt",
    "armand-basi": "Armand Basi", "kayali-fragrances": "Kayali", "swiss-arabian": "Swiss Arabian",
    "al-haramain-perfumes": "Al Haramain", "ard-al-zaafaran": "Ard Al Zaafaran",
    "maison-alhambra": "Maison Alhambra", "jennifer-lopez": "Jennifer Lopez",
    "roberto-cavalli": "Roberto Cavalli",
}

# Palabras sueltas del slug -> como se escriben (acentos, mayusculas de siglas)
PALABRAS = {
    "ideal": "Idéal", "demon": "Démon", "male": "Mâle", "elixir": "Élixir", "tresor": "Trésor",
    "cherie": "Chérie", "poeme": "Poème", "cinema": "Cinéma", "fraiche": "Fraîche", "extreme": "Extrême",
    "egoiste": "Égoïste", "femininite": "Féminité", "poudree": "Poudrée", "elysees": "Élysées",
    "desert": "Désert", "mediterranee": "Méditerranée", "hermes": "Hermès", "panthere": "Panthère",
    "elephant": "Éléphant", "cafe": "Café", "imperatrice": "Impératrice", "vole": "Volé", "gio": "Giò",
    "si": "Sì", "amethyste": "Améthyste", "lumiere": "Lumière", "eclat": "Éclat", "prive": "Privé",
    "tres": "Très", "chloe": "Chloé", "ck": "CK", "dkny": "DKNY", "vip": "VIP", "ch": "CH", "in2u": "IN2U",
    "xj": "XJ", "premiere": "Première", "reserve": "Réserve", "privee": "Privée", "millesime": "Millésime",
    "evidence": "Évidence", "memoire": "Mémoire", "ete": "Été",
    "feminite": "Féminité", "xxv": "XXV", "ii": "II", "xs": "XS", "boise": "Boisé",
}

# Conectores en minuscula (si no van al principio)
MINUSCULAS = {"de", "di", "du", "des", "sur", "en", "et", "ou", "par", "pour", "in", "by", "of", "a"}

# Casos que la regla general no resuelve bien (el nombre debe seguir dando el mismo slug sin acentos)
EXCEPCIONES = {
    "a-men": "A*Men", "a-men-pure-havane": "A*Men Pure Havane", "a-men-pure-malt": "A*Men Pure Malt",
    "encre-noire-a-l-extreme": "Encre Noire à l'Extrême",
    "l-de-lolita-lempicka": "L de Lolita Lempicka", "j-adore": "J'adore",
    "d-g-anthology-l-imperatrice-3": "D&G Anthology l'Impératrice 3",
    "angels-share": "Angels' Share", "love-don-t-be-shy": "Love, Don't Be Shy",
    "bade-e-al-oud-oud-for-glory": "Bade'e Al Oud Oud for Glory",
    "bade-e-al-oud-amethyst": "Bade'e Al Oud Amethyst",
    "bade-e-al-oud-honor-glory": "Bade'e Al Oud Honor & Glory",
    "qaa-ed": "Qaa'ed", "9pm": "9PM", "02-l-air-du-desert-marocain": "02 L'Air du Désert Marocain",
    "eau-de-lacoste-l-12-12-white": "Eau de Lacoste L.12.12 White", "un-jardin-sur-le-nil": "Un Jardin sur le Nil",
    "in-red": "In Red", "chanel-no-5-l-eau": "Chanel No 5 L'Eau", "cheap-chic-i-love-love": "Cheap & Chic I Love Love",
    "j-adore": "J'adore",
}


def nombre_desde_slug(slug):
    if slug in EXCEPCIONES:
        return EXCEPCIONES[slug]
    toks = slug.split("-")
    out = []
    i = 0

    def disp(t):
        return PALABRAS.get(t, t.capitalize())

    while i < len(toks):
        t = toks[i]
        # elision: l-, d-, j-, n-, s- seguido de palabra -> l'Palabra
        if len(t) == 1 and t in "ldjns" and i + 1 < len(toks):
            pre = (t.upper() if i == 0 else t) + "'"
            out.append(pre + disp(toks[i + 1]))
            i += 2
            continue
        if i > 0 and t in MINUSCULAS:
            out.append(t)
        else:
            out.append(disp(t))
        i += 1
    return " ".join(out)


def escribir_nombres():
    seleccion = json.load(open(os.path.join(DIR, "seleccion.json"), encoding="utf-8"))
    salida = {}
    for x in seleccion:
        m = x["marca_slug"]
        if m not in MARCAS:
            raise SystemExit("MARCA SIN NOMBRE: %s" % m)
        salida[str(x["fid"])] = {"marca": MARCAS[m], "nombre": nombre_desde_slug(x["nombre_slug"])}
    with open(os.path.join(DIR, "nombres.json"), "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=1)
    print("nombres.json:", len(salida), "entradas")


if __name__ == "__main__":
    escribir_notas()
    escribir_nombres()
