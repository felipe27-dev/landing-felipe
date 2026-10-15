"""Terceira leva: animações com mais quadros (folha "Atlas de Sprites RPG em Pixel Art-2").

A folha vem em resolução baixa (~metade das anteriores). Para não borrar, cada peça é
ampliada 2× por vizinho mais próximo (mantém o pixel nítido) e só então ajustada ao tamanho
final com LANCZOS + nitidez + limpeza de borda (spritekit.resize).

Uso (da raiz):  python scripts/sprites_v3.py
"""
import os
import numpy as np
from PIL import Image
import spritekit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art-source', 'Atlas de Sprites RPG em Pixel Art-2.png')
OUT = os.path.join(ROOT, 'public', 'assets', 'sprites')

A = np.array(Image.open(SRC).convert('RGBA'))
A[:, :, 3] = np.where(A[:, :, 3] > 200, 255, 0)  # o brilho em volta é semitransparente


def piece(y, x, h, w):
    a = A[y:y + h, x:x + w].copy()
    ys, xs = np.nonzero(a[:, :, 3])
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    im = Image.fromarray(a, 'RGBA')
    return im.resize((im.width * 2, im.height * 2), Image.NEAREST)  # 2× nítido antes de ajustar


def fit_h(im, h):
    return spritekit.resize(im, (max(1, round(im.width * h / im.height)), h))


def fit_w(im, w):
    return spritekit.resize(im, (w, max(1, round(im.height * w / im.width))))


def strip(frames, fw=None, fh=None):
    fw = fw or max(f.width for f in frames); fh = fh or max(f.height for f in frames)
    s = Image.new('RGBA', (fw * len(frames), fh))
    for i, f in enumerate(frames):
        s.alpha_composite(f, (i * fw + (fw - f.width) // 2, fh - f.height))
    return s


def save(im, rel):
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p)


def seamless(im, size):
    a = np.array(im.convert('RGB').resize((size, size), Image.LANCZOS)).astype(float)
    r = np.roll(np.roll(a, size // 2, 0), size // 2, 1)
    t = np.linspace(-1, 1, size)
    w = np.clip(1 - np.maximum(np.abs(t)[:, None], np.abs(t)[None, :]), 0, 1) ** 0.8
    w = w[:, :, None] / w.max()
    return Image.fromarray((r * (1 - w) + a * w).clip(0, 255).astype(np.uint8), 'RGB').convert('RGBA')


# ---- Felipe: 6 quadros por direção (0 = parado, 1–5 = passos) ----
ROWS = {  # (y, x, h, w) por quadro, na ordem da folha
    'down': [(19, 30, 56, 38), (19, 86, 56, 37), (19, 140, 56, 38)],
    'up': [(87, 31, 57, 36), (87, 86, 57, 37), (87, 140, 57, 37), (87, 194, 57, 36), (87, 248, 56, 36), (87, 302, 57, 35)],
    'left': [(155, 27, 55, 38), (156, 83, 54, 38), (156, 137, 54, 38), (156, 192, 54, 37), (155, 245, 55, 38), (155, 300, 55, 38)],
}
CW, CH, H = 64, 96, 86  # célula e altura do personagem (igual aos atuais)
down = [fit_h(piece(*b), H) for b in ROWS['down']]
down = [down[0], down[1], down[0], down[2], down[0], down[1]]  # só há 3 poses de frente: ciclo
up = [fit_h(piece(*b), H) for b in ROWS['up']]
left = [fit_h(piece(*b), H) for b in ROWS['left']]
right = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in left]
sheet = Image.new('RGBA', (CW * 6, CH * 4))
for r, frames in enumerate([down, up, left, right]):
    for c, f in enumerate(frames):
        sheet.alpha_composite(f, (c * CW + (CW - f.width) // 2, r * CH + CH - f.height - 2))
# save(sheet, 'characters/player.png')  # desativado: poses inconsistentes; o Felipe vem da folha -3 (sprites_v2)

# ---- Água: 6 quadros repetíveis (128 = 2 tiles) ----
for i, x in enumerate([1067, 1067, 1068, 1068, 1067, 1067]):
    pass
WATER = [(1068, 25, 74, 76), (1067, 106, 75, 76), (1068, 188, 74, 76), (1068, 269, 74, 76), (1067, 351, 75, 76), (1067, 432, 75, 76)]
for i, b in enumerate(WATER):
    p = piece(*b)
    dx, dy = round(p.width * 0.08), round(p.height * 0.08)
    save(seamless(p.crop((dx, dy, p.width - dx, p.height - dy)), 128), f'textures/water{i}.png')

# ---- Decalques com 4 quadros ----
def decal(boxes, w, cell, name):
    save(strip([fit_w(piece(*b), w) for b in boxes], cell, cell), f'decals/{name}.png')


decal([(1228, 28, 43, 40), (1230, 83, 41, 38), (1229, 139, 42, 38), (1228, 195, 40, 38)], 46, 64, 'flower_red')
decal([(1228, 274, 42, 35), (1228, 326, 40, 36), (1229, 376, 42, 38), (1230, 426, 41, 42)], 46, 64, 'flower_white')
decal([(1294, 30, 39, 40), (1293, 84, 40, 42), (1293, 138, 40, 40), (1295, 193, 38, 40)], 42, 64, 'tuft')
save(strip([fit_w(piece(*b), 64) for b in [(1352, 24, 57, 50), (1351, 80, 58, 46), (1350, 138, 59, 44), (1350, 190, 59, 50)]], 67, None), 'decals/tall_grass.png')

# ---- Cenário animado ----
save(strip([fit_w(piece(*b), 128) for b in [(1437, 22, 69, 77), (1437, 105, 69, 76), (1436, 186, 69, 75), (1437, 266, 69, 76), (1438, 346, 69, 76), (1440, 430, 68, 76)]], 128), 'decor/fountain.png')
save(strip([fit_h(piece(*b), 112) for b in [(1674, 22, 84, 40), (1674, 78, 84, 40), (1674, 133, 84, 41), (1674, 191, 84, 41)]], 64), 'decor/boat.png')
save(strip([fit_w(piece(*b), 60) for b in [(1780, 30, 47, 45), (1780, 98, 48, 46), (1780, 168, 48, 46), (1780, 238, 48, 45)]], 64, 64), 'ui/emote.png')
print('v3 ok')
