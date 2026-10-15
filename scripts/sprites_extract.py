import sys, os, json, numpy as np
import spritekit

from PIL import Image

SRC = sys.argv[1]; OUT = sys.argv[2]

rgb = np.array(Image.open(SRC).convert('RGB'))

fg = np.load('fg.npy')

rgba = np.dstack([rgb, (fg * 255).astype(np.uint8)])

D = 64  # px por tile (densidade 4x)



def crop(y0, x0, y1, x1):

    """Recorta a regiÃ£o e aperta no conteÃºdo (alpha)."""

    a = rgba[y0:y1, x0:x1]

    ys, xs = np.nonzero(a[:, :, 3])

    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

    return Image.fromarray(a, 'RGBA')



def sharpen(im):
    """Recupera nitidez após reamostragem (só nos canais de cor)."""
    from PIL import ImageFilter
    rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.2, percent=70, threshold=2))
    out = rgb.convert('RGBA'); out.putalpha(im.getchannel('A'))
    return out


def fit_w(im, w):

    h = max(1, round(im.height * w / im.width))

    return spritekit.resize(im, (w, h)) if w != im.width else spritekit.clean_edges(im)



UNUSED = ('tiles/', 'interior/floor_', 'interior/wall_', 'interior/wallband_', 'interior/wallside_', 'textures/grass2', 'decor/lamp_on', 'furniture/globe', 'furniture/bookpile', 'furniture/rug', 'props/post')


def save(im, path):
    if path.startswith(UNUSED): return  # sem uso no jogo atual

    if not path.startswith('tiles/'): im = spritekit.clean_edges(im, passes=5)  # sem halo claro no contorno
    p = os.path.join(OUT, path); os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p)



def split_cols(im, n):

    w = im.width / n

    return [im.crop((round(i * w), 0, round((i + 1) * w), im.height)) for i in range(n)]



def strip(frames, fw, fh):

    s = Image.new('RGBA', (fw * len(frames), fh))

    for i, f in enumerate(frames):

        s.paste(f, (i * fw + (fw - f.width) // 2, fh - f.height), f)

    return s



def opaque_tile(im, size=(D, D), inset=0.14):

    # remove a moldura desenhada em volta de cada tile na folha

    dx, dy = round(im.width * inset), round(im.height * inset)

    im = im.crop((dx, dy, im.width - dx, im.height - dy)).resize(size, Image.LANCZOS)

    a = np.array(im); a[:, :, 3] = 255  # terreno sempre opaco

    return Image.fromarray(a, 'RGBA')



# ---- Terreno ----

save(opaque_tile(crop(87, 512, 163, 581)), 'tiles/grass.png')

# Flores: recorta só as pétalas (remove o verde de fundo da folha) e aplica sobre a grama real.

def flower_on_grass(f):

    dx, dy = round(f.width * .12), round(f.height * .12)
    a = np.array(f.crop((dx, dy, f.width - dx, f.height - dy)).resize((D, D), Image.LANCZOS)).astype(int)

    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]

    green = (g > r + 12) & (g > b + 12)

    a[green, 3] = 0

    petals = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')

    base = opaque_tile(crop(87, 512, 163, 581)).copy()

    base.alpha_composite(petals)

    return base

save(strip([flower_on_grass(f) for f in split_cols(crop(102, 589, 162, 686), 2)], D, D), 'tiles/flower.png')

tg = [f.resize((D, D), Image.LANCZOS) for f in split_cols(crop(99, 692, 163, 866), 2)]

# mato alto: fundo de grama atrÃ¡s das folhas

g = opaque_tile(crop(87, 512, 163, 581))

tg = [Image.alpha_composite(g, f) for f in tg]

save(strip(tg, D, D), 'tiles/tall_grass.png')

save(opaque_tile(crop(187, 511, 301, 594)), 'tiles/sand.png')

save(strip([opaque_tile(f) for f in split_cols(crop(192, 695, 295, 933), 4)], D, D), 'tiles/water.png')

save(opaque_tile(crop(193, 941, 295, 1008)), 'tiles/plaza.png')

save(fit_w(crop(311, 503, 465, 609), 66), 'tiles/tree.png')

save(opaque_tile(crop(346, 620, 455, 707)), 'tiles/floor.png')

wood = opaque_tile(crop(345, 716, 454, 800))

save(wood, 'tiles/biblioteca_floor.png'); save(wood, 'tiles/oficina_floor.png')

save(opaque_tile(crop(344, 810, 455, 897), (D, 2 * D), 0.06), 'tiles/wall.png')

save(opaque_tile(crop(345, 909, 454, 1010), inset=0.04), 'tiles/mat.png')



# ---- PrÃ©dios (tamanho nativo) ----

for name, box in {'lab': (72, 1028, 259, 1190), 'biblioteca': (75, 1191, 261, 1334), 'oficina': (77, 1339, 261, 1530),

                  'correio': (285, 1060, 478, 1259), 'farol': (271, 1286, 485, 1385)}.items():

    b = crop(*box)
    save(fit_w(b, round(b.width * 4 / 3)), f'buildings/{name}.png')  # mesma proporção da densidade antiga



# ---- Objetos ----

save(crop(673, 509, 741, 568), 'props/sign.png')  # nativo: sem reamostragem

save(crop(667, 592, 754, 640), 'props/post.png')

save(crop(669, 671, 754, 717), 'props/mailbox.png')

bottles = [crop(*b) for b in [(679, 753, 749, 795), (690, 818, 747, 856), (690, 873, 747, 909), (692, 923, 748, 962), (690, 972, 747, 1010)]]

bottles = [b.resize((round(b.width * .93), round(b.height * .93)), Image.LANCZOS) for b in bottles]

save(strip(bottles, D, D), 'props/bottle.png')

save(fit_w(crop(774, 237, 835, 292), 64), 'ui/emote.png')



# ---- MÃ³veis (largura em tiles) ----

furn = {

    'table': ((521, 1058, 586, 1170), 2), 'plant': ((505, 1205, 590, 1265), 1), 'rug': ((511, 1307, 583, 1418), 3),

    'bookpile': ((519, 1440, 588, 1494), 1), 'shelf': ((616, 1053, 713, 1123), 1), 'globe': ((623, 1146, 697, 1202), 1),

    'workbench': ((627, 1216, 705, 1328), 2), 'anvil': ((642, 1350, 701, 1429), 1), 'crate': ((630, 1455, 692, 1508), 1),

    'counter': ((736, 1053, 815, 1208), 3), 'mailshelf': ((732, 1217, 819, 1283), 1), 'pc': ((744, 1298, 813, 1347), 1),

    'bench': ((753, 1363, 811, 1443), 1), 'plaque': ((750, 1455, 811, 1517), 1), 'stairs': ((840, 1058, 916, 1125), 1),

}

for name, (box, w) in furn.items():

    save(crop(*box), f'furniture/{name}.png')  # nativo: nítido e sem halo

save(crop(744, 1298, 813, 1347), 'furniture/terminal.png')



# ---- Personagens: grade por grupo ----

def cells(x0, x1, rows):

    out = []

    for (y0, y1) in rows:

        band = fg[y0:y1, x0:x1].any(0)

        cols, inside, start = [], False, 0

        for i, v in enumerate(list(band) + [False]):

            if v and not inside: inside, start = True, i

            if not v and inside:

                inside = False

                if i - start > 15: cols.append((x0 + start, x0 + i))

        if len(cols) != 3:

            # personagens encostados: divide a faixa ocupada em 3 partes iguais

            xs = np.nonzero(band)[0]; a0, a1 = x0 + xs.min(), x0 + xs.max() + 1

            w = (a1 - a0) / 3

            cols = [(round(a0 + i * w), round(a0 + (i + 1) * w)) for i in range(3)]

        out.append([crop(y0, a, y1, b) for a, b in cols])

    return out



R4 = [(85, 166), (166, 247), (247, 327), (328, 406)]

R3 = [(430, 515), (515, 596), (597, 683)]

groups = {

    'player': (8, 156, R4), 'guide': (166, 320, R4), 'scientist': (334, 484, R4),

    'librarian': (8, 156, R3), 'artisan': (170, 320, R3), 'clerk': (334, 484, R3),

    'keeper': (15, 182, [(722, 807), (807, 895)]),

}

# (linha, coluna) usada para cada direÃ§Ã£o: baixo, cima, esquerda, direita

pick = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}

FW, FH = D, 84

report = {}

for name, (x0, x1, rows) in groups.items():

    c = cells(x0, x1, rows)

    report[name] = [len(r) for r in c]

    n = len(rows)

    default = {'down': [0, 1], 'up': [n - 1, 1], 'left': [min(2, n - 1) if n == 4 else 1, 0], 'right': [min(2, n - 1) if n == 4 else 1, 2]}

    if n == 2: default = {'down': [0, 1], 'up': [1, 1], 'left': [0, 0], 'right': [0, 2]}

    sel = {**default, **pick.get(name, {})}

    sheet = Image.new('RGBA', (FW * 3, FH * 4))

    for r, d in enumerate(['down', 'up', 'left', 'right']):

        rr, cc = sel[d]

        f = c[rr][cc]

        if sel.get(d + '_flip'): f = f.transpose(Image.FLIP_LEFT_RIGHT)

        for k in range(3):

            sheet.paste(f, (k * FW + (FW - f.width) // 2, r * FH + FH - f.height - 2), f)

    save(sheet, f'characters/{name}.png')

    # contato para inspeÃ§Ã£o

    prev = Image.new('RGBA', (60 * 3, 90 * n), (255, 255, 255, 255))

    for ri, row in enumerate(c):

        for ci, f in enumerate(row[:3]): prev.paste(f, (ci * 60, ri * 90), f)

    prev.save(f'prev_{name}.png')

print(report)

