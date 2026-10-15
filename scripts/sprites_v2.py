"""Extrai a segunda leva de sprites (folhas com transparência real) para public/assets/sprites.

Uso (da raiz do projeto):  python scripts/sprites_v2.py
Escolhas: personagens da folha "-3" (costas reais + 3 quadros do Felipe), bibliotecária da folha "-1",
terreno/decalques da "-3", cenário/retratos/pisos da "Prancha", paredes da "Folha organizada".
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as nd
import spritekit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'art-source')
OUT = os.path.join(ROOT, 'public', 'assets', 'sprites')
D = 64  # px por tile (densidade 4x)
K = 4 / 3  # tamanhos abaixo foram pensados para 48 px/tile

SHEETS = {
    's1': 'Folha de Sprites RPG em Pixel Art-1.png',
    's3': 'Atlas de Sprites Pixelados para RPG-3.png',
    's4': 'Folha de sprites pixel art organizada-1.png',
    's5': 'Prancha de Sprites Pixel Art RPG-2.png',
}
cache = {}


def sheet(k):
    if k not in cache:
        a = np.array(Image.open(os.path.join(IMG, SHEETS[k])).convert('RGBA'))
        # O brilho em volta das peças é semitransparente: só o alfa sólido é sprite.
        a[:, :, 3] = np.where(a[:, :, 3] > 200, 255, 0)
        cache[k] = a
    return cache[k]


def piece(k, box, inset=0.0):
    """box = (y0, x0, altura, largura) como impresso pelo detector."""
    y0, x0, h, w = box
    a = sheet(k)[y0:y0 + h, x0:x0 + w].copy()
    m = a[:, :, 3] > 0
    if m.any():
        ys, xs = np.nonzero(m)
        a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    if inset:
        dy, dx = round(a.shape[0] * inset), round(a.shape[1] * inset)
        a = a[dy:a.shape[0] - dy, dx:a.shape[1] - dx]
    return Image.fromarray(a, 'RGBA')


def sharpen(im):
    from PIL import ImageFilter
    rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.2, percent=70, threshold=2))
    out = rgb.convert('RGBA'); out.putalpha(im.getchannel('A'))
    return out


def scale(im, f):
    # Perto do tamanho nativo, não reamostra (mantém o pixel original nítido).
    if abs(f - 1) < 0.08: return im
    return spritekit.resize(im, (max(1, round(im.width * f)), max(1, round(im.height * f))))


def fit_w(im, w):
    return scale(im, w * K / im.width)


def hard_alpha(im):
    a = np.array(im); a[:, :, 3] = np.where(a[:, :, 3] > 127, 255, 0)
    return Image.fromarray(a, 'RGBA')


UNUSED = ('tiles/', 'interior/floor_', 'interior/wall_', 'interior/wallband_', 'interior/wallside_', 'textures/grass2', 'decor/lamp_on', 'furniture/globe', 'furniture/bookpile', 'furniture/rug', 'props/post')


def save(im, rel):
    if rel.startswith(UNUSED): return  # sem uso no jogo atual
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    im.save(p)


def strip(frames, fw=None, fh=None):
    fw = fw or max(f.width for f in frames); fh = fh or max(f.height for f in frames)
    s = Image.new('RGBA', (fw * len(frames), fh))
    for i, f in enumerate(frames):
        s.alpha_composite(f, (i * fw + (fw - f.width) // 2, fh - f.height))
    return s


def seamless(im, size):
    """Patch repetível: mistura a imagem com ela mesma deslocada meio período."""
    a = np.array(im.convert('RGB').resize((size, size), Image.LANCZOS)).astype(float)
    r = np.roll(np.roll(a, size // 2, 0), size // 2, 1)
    t = np.linspace(-1, 1, size)
    w = np.clip(1 - np.maximum(np.abs(t)[:, None], np.abs(t)[None, :]), 0, 1) ** 0.8
    w = w[:, :, None] / w.max()
    out = r * (1 - w) + a * w
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGB').convert('RGBA')


# ---------------- Personagens ----------------
CELL_W, CELL_H = 64, 96
CHAR_SCALE = 1.0  # personagens no tamanho nativo da folha


def char_sheet(frames_by_dir):
    s = Image.new('RGBA', (CELL_W * 3, CELL_H * 4))
    for r, d in enumerate(['down', 'up', 'left', 'right']):
        for c, f in enumerate(frames_by_dir[d]):
            f = hard_alpha(scale(f, CHAR_SCALE))
            s.alpha_composite(f, (c * CELL_W + (CELL_W - f.width) // 2, r * CELL_H + CELL_H - f.height - 2))
    return s


def mirror(fs):
    return [f.transpose(Image.FLIP_LEFT_RIGHT) for f in fs]


S3 = {  # caixas da folha -3: linhas baixo, cima, esquerda(×2)
    'player': [[(49, 28, 53, 86), (49, 92, 54, 85), (48, 156, 53, 86)],
               [(153, 28, 52, 87), (153, 91, 54, 87), (153, 155, 54, 87)],
               [(259, 25, 56, 89), (259, 91, 56, 89), (260, 156, 55, 87)]],
    'guide': [[(51, 254, 56, 87)], [(151, 254, 55, 93)], [(255, 254, 55, 89)]],
    'scientist': [[(50, 336, 51, 89)], [(150, 335, 51, 94)], [(255, 335, 52, 93)]],
    'artisan': [[(51, 514, 55, 87)], [(150, 515, 53, 94)], [(256, 515, 54, 92)]],
    'clerk': [[(50, 601, 54, 87)], [(150, 601, 52, 93)], [(256, 601, 55, 92)]],
    'keeper': [[(51, 687, 56, 85)], [(150, 687, 54, 93)], [(256, 686, 56, 92)]],
}
for name, (down, up, left) in S3.items():
    # estas caixas foram anotadas como (y, x, largura, altura)
    pc = lambda b: piece('s3', (b[0], b[1], b[3], b[2]))
    d = [pc(b) for b in down]; u = [pc(b) for b in up]; l = [pc(b) for b in left]
    if len(d) == 1: d, u, l = d * 3, u * 3, l * 3
    # quadros: parado, passo A, passo B (a folha traz parado no meio)
    if name == 'player': d, u, l = [d[1], d[0], d[2]], [u[1], u[0], u[2]], [l[1], l[0], l[2]]
    save(char_sheet({'down': d, 'up': u, 'left': l, 'right': mirror(l)}), f'characters/{name}.png')

lib = [piece('s1', b) for b in [(43, 786, 79, 55), (126, 785, 81, 56), (211, 786, 83, 55)]]
save(char_sheet({'down': [lib[0]] * 3, 'up': [lib[1]] * 3, 'left': [lib[2]] * 3, 'right': mirror([lib[2]] * 3)}), 'characters/librarian.png')

# Retratos para diálogos (Prancha, primeira fileira)
for name, b in zip(['player', 'guide', 'scientist', 'librarian', 'artisan', 'clerk', 'keeper'],
                   [(329, 636, 81, 78), (330, 730, 80, 74), (330, 830, 81, 79), (329, 925, 81, 79),
                    (329, 1031, 81, 83), (329, 1148, 81, 82), (328, 1278, 82, 82)]):
    save(piece('s5', b).resize((128, 128), Image.LANCZOS), f'portraits/{name}.png')

# ---------------- Texturas de terreno (repetíveis, 96 px = 2 tiles) ----------------
save(seamless(piece('s3', (691, 31, 124, 120), inset=0.16), 128), 'textures/grass.png')
save(seamless(piece('s3', (692, 167, 123, 119), inset=0.16), 128), 'textures/grass2.png')
stone = Image.fromarray(sheet('s5')[828:950, 567:689], 'RGBA')  # 2×2 lajotas do piso cinza
save(stone.resize((128, 128), Image.LANCZOS), 'textures/stone.png')
sand = Image.fromarray(sheet('s3')[352:384, 882:930], 'RGBA')
save(seamless(sand, 128), 'textures/sand.png')
for i, b in enumerate([(574, 803, 73, 65), (574, 873, 73, 62), (574, 940, 73, 63), (574, 1007, 73, 66)]):
    save(seamless(piece('s3', b, inset=0.1), 128), f'textures/water{i}.png')

# ---------------- Decalques sobre a grama ----------------
save(strip([fit_w(piece('s3', b), 34) for b in [(723, 493, 80, 82), (721, 587, 81, 81)]], 64, 64), 'decals/flower_red.png')
save(strip([fit_w(piece('s3', b), 34) for b in [(725, 705, 78, 77), (723, 792, 83, 79)]], 64, 64), 'decals/flower_white.png')
save(strip([fit_w(piece('s3', b), 30) for b in [(728, 906, 81, 93), (724, 1009, 85, 81)]], 64, 64), 'decals/tuft.png')
save(strip([fit_w(piece('s3', b), 50) for b in [(856, 351, 126, 110), (861, 468, 121, 114)]], 67, None), 'decals/tall_grass.png')
save(fit_w(piece('s3', (734, 1360, 72, 69)), 30), 'decals/rock.png')
save(fit_w(piece('s3', (735, 1446, 71, 70)), 30), 'decals/rock2.png')

# ---------------- Cenário (Prancha) ----------------
save(fit_w(piece('s5', (16, 16, 221, 165)), 100), 'decor/tree.png')
save(fit_w(piece('s5', (49, 201, 60, 63)), 44), 'decor/bush.png')
save(fit_w(piece('s5', (44, 431, 47, 193)), 144), 'decor/fence.png')
save(fit_w(piece('s5', (137, 202, 138, 39)), 24), 'decor/lamp.png')
save(fit_w(piece('s5', (137, 273, 138, 47)), 29), 'decor/lamp_on.png')
save(fit_w(piece('s5', (207, 346, 78, 117)), 80), 'decor/bench.png')

save(fit_w(piece('s5', (38, 864, 132, 515)), 288), 'decor/pier.png')
save(fit_w(piece('s5', (20, 1415, 188, 92)), 46), 'decor/boat.png')
save(fit_w(piece('s5', (200, 940, 90, 97)), 54), 'decor/rock_big.png')

# ---------------- Interiores ----------------
for scene, b in zip(['lab', 'biblioteca', 'oficina', 'correio', 'farol'],
                    [(824, 23, 153, 247), (824, 308, 153, 217), (823, 562, 154, 244), (824, 840, 153, 245), (824, 1121, 152, 221)]):
    p = piece('s5', b)
    save(p.resize((256, 128), Image.LANCZOS), f'interior/floor_{scene}.png')
for scene, b in zip(['lab', 'biblioteca', 'oficina', 'correio', 'farol'],
                    [(777, 25, 110, 124), (777, 163, 110, 117), (777, 295, 110, 124), (776, 650, 111, 108), (776, 650, 111, 108)]):
    p = piece('s4', b)
    p = p.crop((0, 0, p.width, round(p.height * 0.72)))  # só a parede (a parte de baixo é piso)
    save(p.resize((128, 128), Image.LANCZOS), f'interior/wall_{scene}.png')
save(fit_w(piece('s5', (683, 1371, 66, 52)), 34), 'interior/window.png')
save(fit_w(piece('s5', (695, 1452, 51, 61)), 40), 'interior/picture.png')
save(fit_w(piece('s5', (772, 1381, 63, 60)), 30), 'interior/clock.png')
save(fit_w(piece('s5', (851, 1374, 80, 123)), 132), 'interior/rug.png')
print('ok')


# ---------------- Fundo removido das estruturas ----------------
def remove_bg(im, tol=48):
    """Apaga o "chão" desenhado em volta da peça: cresce a partir da borda por cores
    parecidas com as da borda (grama, laje), parando no contorno escuro."""
    a = np.array(im.convert('RGBA')).astype(int)
    h, w = a.shape[:2]
    op = a[:, :, 3] > 0
    rgb = a[:, :, :3]
    lum = rgb.mean(2)
    border = np.zeros((h, w), bool)
    border[0, :] = border[-1, :] = border[:, 0] = border[:, -1] = True
    # também os pixels opacos vizinhos de transparência (contorno externo da peça)
    border |= op & nd.binary_dilation(~op) & ~nd.binary_erosion(np.ones_like(op))
    seeds = border & op & (lum > 70)
    pal = rgb[seeds]
    if len(pal) == 0:
        return im
    pal = np.unique((pal // 12) * 12, axis=0)
    # distância de cada pixel à cor de borda mais próxima (em blocos para economizar memória)
    flat = rgb.reshape(-1, 3)
    best = np.full(len(flat), 1e9)
    for i in range(0, len(pal), 64):
        d = np.abs(flat[:, None, :] - pal[None, i:i + 64, :]).sum(2).min(1)
        best = np.minimum(best, d)
    similar = (best.reshape(h, w) < tol) & op & (lum > 70)
    lab, _ = nd.label(similar)
    ids = np.unique(lab[seeds & similar]); ids = ids[ids > 0]
    bg = np.isin(lab, ids)
    a[bg, 3] = 0
    out = Image.fromarray(a.astype(np.uint8), 'RGBA')
    m = np.array(out)[:, :, 3] > 0
    ys, xs = np.nonzero(m)
    return out.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


frames = [remove_bg(fit_w(piece('s5', b), 96)) for b in [(175, 484, 114, 115), (175, 600, 114, 116), (175, 719, 114, 116)]]
save(strip(frames, 128), 'decor/fountain.png')

# ---------------- Paredes decoradas (faixa superior das salas da Prancha) ----------------
for scene, b, frac in zip(['lab', 'biblioteca', 'oficina', 'correio', 'farol'],
                          [(628, 23, 184, 247), (627, 307, 181, 218), (626, 561, 182, 246), (627, 839, 182, 245), (627, 1121, 182, 223)],
                          [0.33, 0.36, 0.33, 0.36, 0.40]):
    room = piece('s5', b)
    ix = round(room.width * 0.03)
    band = room.crop((ix, round(room.height * 0.02), room.width - ix, round(room.height * frac)))
    band = sharpen(band.resize((round(band.width * 128 / band.height), 128), Image.LANCZOS))
    save(band, f'interior/wallband_{scene}.png')
    side = band.crop((3, 0, 35, 128))  # trecho liso para completar as laterais
    save(side, f'interior/wallside_{scene}.png')
print('cleanup ok')


def remove_green_base(im, frac=0.3):
    """Remove a grama desenhada na base (verdes na faixa de baixo, ligados à base)."""
    a = np.array(im.convert('RGBA')).astype(int)
    h = a.shape[0]
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    green = (g > r + 18) & (g > b + 8) & (a[:, :, 3] > 0)
    green[: int(h * (1 - frac))] = False
    lab, _ = nd.label(nd.binary_dilation(green, iterations=1))
    ids = np.unique(lab[-max(3, h // 12):][green[-max(3, h // 12):]]); ids = ids[ids > 0]
    kill = np.isin(lab, ids) & (green | (a[:, :, :3].sum(2) < 200))
    # contorno escuro que ficou sozinho embaixo da grama removida
    a[kill, 3] = 0
    lone = (a[:, :, 3] > 0) & (a[:, :, :3].sum(2) < 200)
    lone &= ~nd.binary_dilation((a[:, :, 3] > 0) & ~lone, iterations=1)
    a[lone, 3] = 0
    out = Image.fromarray(a.astype(np.uint8), 'RGBA')
    ys, xs = np.nonzero(np.array(out)[:, :, 3])
    return out.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def ellipse_cut(im, inset=0.02):
    a = np.array(im.convert('RGBA'))
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy, rx, ry = (w - 1) / 2, h * 0.58, w * (0.5 - inset), h * (0.42 - inset)
    a[((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 > 1, 3] = 0
    return Image.fromarray(a, 'RGBA')


frames = [ellipse_cut(fit_w(piece('s5', b), 96)) for b in [(175, 484, 114, 115), (175, 600, 114, 116), (175, 719, 114, 116)]]
save(strip(frames, 128), 'decor/fountain.png')
for b in ['biblioteca', 'oficina', 'correio']:
    p = os.path.join(OUT, 'buildings', f'{b}.png')
    save(remove_green_base(Image.open(p), 0.18), f'buildings/{b}.png')
save(remove_green_base(Image.open(os.path.join(OUT, 'buildings', 'farol.png')), 0.32), 'buildings/farol.png')
print('base ok')
