"""Quarta leva: NPCs e prédios em alta qualidade + ciclo de caminhada de 8 quadros do Felipe.

- NPCs: "Atlas de NPCs em Pixel Art.png" (6 NPCs × frente, costas, 2 lados, falando, retrato).
- Prédios: "Conjunto Pixelado de Prédios Pokémon.png".
- Felipe: a folha só tem poses paradas de frente/costas (por isso ele "travava"). O ciclo é
  gerado a partir da pose parada: as pernas são separadas em esquerda/direita e levantadas
  alternadamente, o tronco desce no contato e os braços balançam — 8 quadros por direção.

Uso (da raiz):  python scripts/sprites_v4.py
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as nd
import spritekit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'art-source')
OUT = os.path.join(ROOT, 'public', 'assets', 'sprites')


def load(name):
    a = np.array(Image.open(os.path.join(IMG, name)).convert('RGBA'))
    a[:, :, 3] = np.where(a[:, :, 3] > 200, 255, 0)
    return a


def piece(a, y, x, h, w):
    p = a[y:y + h, x:x + w].copy()
    m = p[:, :, 3] > 0
    lab, n = nd.label(m)
    if n > 1:  # fica só com a maior peça (descarta respingos vizinhos)
        sizes = nd.sum(m, lab, range(1, n + 1))
        keep = 1 + int(np.argmax(sizes))
        big = lab == keep
        near = nd.binary_dilation(big, iterations=3)
        p[~(m & near)] = 0
    ys, xs = np.nonzero(p[:, :, 3])
    return Image.fromarray(p[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 'RGBA')


def fit_h(im, h):
    return spritekit.resize(im, (max(1, round(im.width * h / im.height)), h))


def fit_w(im, w):
    return spritekit.resize(im, (w, max(1, round(im.height * w / im.width))))


def save(im, rel):
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p)


def cell(frames, cw=64, ch=96):
    """Linha de quadros com pés alinhados 2 px acima da base."""
    s = Image.new('RGBA', (cw * len(frames), ch))
    for i, f in enumerate(frames):
        s.alpha_composite(f, (i * cw + (cw - f.width) // 2, ch - f.height - 2))
    return s


# ---------------- NPCs ----------------
A = load('Atlas de NPCs em Pixel Art.png')
NPC_ROWS = {
    'guide': [(8, 329, 142, 110), (8, 498, 142, 109), (8, 677, 142, 109), (7, 854, 143, 109), (7, 1045, 143, 107), (4, 1236, 136, 129)],
    'scientist': [(159, 332, 139, 97), (159, 506, 139, 97), (160, 686, 138, 93), (159, 859, 139, 93), (159, 1045, 139, 107), (153, 1240, 140, 118)],
    'librarian': [(306, 329, 142, 102), (306, 504, 142, 102), (306, 684, 142, 97), (306, 854, 142, 103), (306, 1042, 142, 109), (304, 1236, 139, 128)],
    'artisan': [(454, 330, 139, 98), (455, 505, 139, 103), (455, 684, 138, 103), (455, 854, 138, 100), (455, 1034, 138, 116), (452, 1238, 135, 123)],
    'clerk': [(600, 330, 135, 98), (600, 505, 135, 97), (600, 679, 135, 100), (600, 861, 135, 101), (600, 1046, 135, 111), (598, 1244, 130, 113)],
    'keeper': [(744, 330, 137, 98), (744, 505, 137, 96), (744, 680, 137, 98), (743, 859, 138, 102), (743, 1047, 138, 113), (740, 1241, 136, 123)],
}
H = 84  # altura do personagem em px (64 px = 1 tile)
for name, boxes in NPC_ROWS.items():
    front, back, side_a, side_b, talk, portrait = [piece(A, *b) for b in boxes]
    fr, bk, sa, sb, tk = (fit_h(p, H) for p in (front, back, side_a, side_b, talk))
    # Linhas: baixo, cima, esquerda, direita · colunas: parado, falando
    left, right = sa, sb
    sheet = Image.new('RGBA', (64 * 2, 96 * 4))
    for r, (a, b) in enumerate([(fr, tk), (bk, bk), (left, left), (right, right)]):
        sheet.alpha_composite(cell([a, b]), (0, r * 96))
    save(sheet, f'characters/{name}.png')
    save(fit_h(portrait, 128).crop((0, 0, 128, 128)) if fit_h(portrait, 128).width >= 128 else spritekit.resize(portrait, (128, 128)), f'portraits/{name}.png')

# ---------------- Prédios ----------------
B = load('Conjunto Pixelado de Prédios Pokémon.png')
BUILDS = {
    'biblioteca': ((81, 42, 398, 437), 256),
    'lab': ((81, 555, 404, 410), 288),
    'oficina': ((81, 1040, 398, 458), 288),
    'correio': ((568, 347, 377, 437), 300),
    'farol': ((510, 956, 449, 178), 116),
}
for name, (box, w) in BUILDS.items():
    save(fit_w(piece(B, *box), w), f'buildings/{name}.png')


# ---------------- Felipe: caminhada de 8 quadros ----------------
def walk_cycle(stand: Image.Image, side=False):
    """8 quadros a partir da pose parada. Fases: 0 parado, 1-3 perna A sobe/desce, 4 contato,
    5-7 perna B sobe/desce. Tronco desce 1 px nos contatos; braços balançam em oposição."""
    a = np.array(stand)
    h, w = a.shape[:2]
    op = a[:, :, 3] > 0
    rows = np.nonzero(op.any(1))[0]
    top, bottom = rows.min(), rows.max()
    hip = top + int((bottom - top) * 0.80)          # início das pernas
    cols = np.nonzero(op[hip:].any(0))[0]
    mid = (cols.min() + cols.max()) // 2            # divisão perna esquerda/direita
    lift = [0, 2, 4, 2, 0, 2, 4, 2]                 # altura do pé levantado (px)
    bob = [0, 1, 0, 0, 1, 1, 0, 0]                  # tronco desce no contato
    which = [None, 'L', 'L', 'L', None, 'R', 'R', 'R']
    frames = []
    for i in range(8):
        f = np.zeros_like(a)
        body = a.copy(); body[hip:] = 0
        legs = a.copy(); legs[:hip] = 0
        # tronco + cabeça (com leve descida)
        b = bob[i]
        f[b:h] = np.where(body[:h - b, :, 3:4] > 0, body[:h - b], f[b:h])
        # pernas: a do passo sobe (encolhe por baixo), a outra fica
        for side_name, sl in (('L', slice(0, mid + 1)), ('R', slice(mid + 1, w))):
            part = np.zeros_like(a); part[:, sl] = legs[:, sl]
            dy = lift[i] if which[i] == side_name else 0
            if side and which[i] and side_name != which[i]:
                dy = 0
            if dy:
                part = np.roll(part, -dy, axis=0); part[h - dy:] = 0
                part[:hip - dy + 1] = np.where(part[:hip - dy + 1, :, 3:4] > 0, 0, part[:hip - dy + 1])
            f = np.where(part[:, :, 3:4] > 0, part, f)
        frames.append(Image.fromarray(f, 'RGBA'))
    return frames


P = load('Atlas de Sprites Pixelados para RPG-3.png')
# poses paradas de alta resolução (folha -3): frente, costas, esquerda — caixas (y, x, h, w)
STAND = {'down': (49, 92, 85, 54), 'up': (153, 91, 87, 54), 'left': (259, 25, 89, 56)}
rows_out = []
for d in ['down', 'up', 'left']:
    st = piece(P, *STAND[d])
    st = fit_h(st, 86)
    rows_out.append(walk_cycle(st, side=(d == 'left')))
rows_out.append([f.transpose(Image.FLIP_LEFT_RIGHT) for f in rows_out[2]])
sheet = Image.new('RGBA', (64 * 8, 96 * 4))
for r, frames in enumerate(rows_out):
    sheet.alpha_composite(cell(frames), (0, r * 96))
save(sheet, 'characters/player.png')
print('v4 ok')
