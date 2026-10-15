"""Gera docs/referencia_frames.png: cada sprite animado (ou que deveria ser) com os quadros
ÚNICOS que existem hoje e quantos quadros queremos. Serve de base visual para gerar a
próxima leva com uma IA.

Uso (da raiz):  python scripts/make_frame_reference.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SP = os.path.join(ROOT, 'public', 'assets', 'sprites')
OUT = os.path.join(ROOT, 'docs', 'assets', 'referencia_frames.png')


def font(size):
    for f in ['C:/Windows/Fonts/consolab.ttf', 'C:/Windows/Fonts/arialbd.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


F_TITLE, F_TXT, F_SMALL = font(26), font(18), font(14)


def frames(path, fw=None, fh=None, cols=None, rows=1):
    im = Image.open(os.path.join(SP, path)).convert('RGBA')
    if cols:
        fw, fh = im.width // cols, im.height // rows
    fw = fw or im.width; fh = fh or im.height
    out = []
    for r in range(im.height // fh):
        for c in range(im.width // fw):
            out.append(im.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh)))
    return out


def unique(fs):
    """Remove quadros repetidos (comparação de pixels)."""
    seen, out = [], []
    for f in fs:
        a = np.array(f)
        if not any(a.shape == b.shape and np.abs(a.astype(int) - b).mean() < 1.5 for b in seen):
            seen.append(a); out.append(f)
    return out


DIRS = ['baixo', 'cima', 'esquerda', 'direita']
rows = []  # (titulo, [(rotulo, [quadros])], pedido)
for name, label in [('player', 'Felipe (jogador)'), ('guide', 'Guia'), ('scientist', 'Assistente do Lab'), ('librarian', 'Bibliotecária'),
                    ('artisan', 'Artesão'), ('clerk', 'Atendente do Correio'), ('keeper', 'Faroleiro')]:
    allf = frames(f'characters/{name}.png', cols=3, rows=4)
    groups = [(DIRS[d], unique(allf[d * 3:(d + 1) * 3])) for d in range(4)]
    want = '4 direções × (2 parado + 4 andando + 4 correndo)' if name == 'player' else '4 direções × 2 parado (respirar/piscar)'
    rows.append((f'Personagem — {label}', groups, want))

anim = [
    ('Água do mar', [('textura', unique([Image.open(os.path.join(SP, f'textures/water{i}.png')) for i in range(4)]))], '8 quadros, repetível nas 4 bordas, ondas em loop'),
    ('Flor vermelha', [('decalque', unique(frames('decals/flower_red.png', 64)))], '4 quadros balançando ao vento'),
    ('Flor branca', [('decalque', unique(frames('decals/flower_white.png', 64)))], '4 quadros balançando ao vento'),
    ('Tufo de grama', [('decalque', unique(frames('decals/tuft.png', 64)))], '4 quadros balançando'),
    ('Mato alto', [('decalque', unique(frames('decals/tall_grass.png', 67)))], '4 quadros parado + 3 quadros "farfalhando" ao pisar'),
    ('Fonte da praça', [('cenário', unique(frames('decor/fountain.png', 128)))], '6 quadros de água jorrando, fundo transparente'),
    ('Garrafa na praia', [('objeto', unique(frames('props/bottle.png', 64)))], '6 quadros de brilho/boiar'),
    ('Poste', [('apagado/aceso', unique([Image.open(os.path.join(SP, 'decor/lamp.png')), Image.open(os.path.join(SP, 'decor/lamp_on.png'))]))], '4 quadros de chama/luz piscando (noite)'),
    ('Barco', [('cenário', [Image.open(os.path.join(SP, 'decor/boat.png'))])], '4 quadros boiando'),
    ('Árvore', [('cenário', [Image.open(os.path.join(SP, 'decor/tree.png'))])], '3 quadros de copa balançando'),
    ('Balão "!"', [('interface', [Image.open(os.path.join(SP, 'ui/emote.png'))])], '4 quadros de "pop" (surgir)'),
    ('Portas dos prédios', [('hoje: estáticas', [Image.open(os.path.join(SP, 'buildings/correio.png')).resize((130, 126))])], '4 quadros de porta abrindo (por prédio)'),
]
rows += [(t, g, w) for t, g, w in anim]

PAD, CELL_GAP = 24, 10
# Medir
blocks = []
for title, groups, want in rows:
    h = 0; w = 0
    for lbl, fs in groups:
        gh = max(f.height for f in fs) + 26
        gw = sum(f.width + CELL_GAP for f in fs) + 10
        w += max(gw, 190) + 16
        h = max(h, gh)
    blocks.append((title, groups, want, w, h + 62))
W = max(1200, max(b[3] for b in blocks) + 2 * PAD)
H = sum(b[4] + 16 for b in blocks) + 120
img = Image.new('RGBA', (W, H), (244, 241, 230, 255))
d = ImageDraw.Draw(img)
d.text((PAD, 20), 'Ilha Felipe — quadros que existem hoje (sem repetição) e quadros desejados', font=F_TITLE, fill=(40, 48, 56))
d.text((PAD, 56), 'Densidade: 64 px = 1 tile. Fundo transparente real. Mesma luz (cima-esquerda) e paleta das folhas atuais.', font=F_SMALL, fill=(90, 102, 118))
y = 96
for title, groups, want, bw, bh in blocks:
    d.rounded_rectangle((PAD - 8, y - 6, W - PAD + 8, y + bh), 12, outline=(40, 48, 56), width=3, fill=(255, 255, 255))
    d.text((PAD, y), title, font=F_TXT, fill=(40, 48, 56))
    d.text((PAD, y + 24), f'QUERO: {want}', font=F_SMALL, fill=(224, 64, 64))
    x = PAD
    for lbl, fs in groups:
        d.text((x, y + 44), f'{lbl} · {len(fs)} quadro(s)', font=F_SMALL, fill=(56, 112, 208))
        cx = x
        for f in fs:
            # xadrez de fundo para evidenciar transparência
            for yy in range(0, f.height, 8):
                for xx in range(0, f.width, 8):
                    if (xx // 8 + yy // 8) % 2: d.rectangle((cx + xx, y + 64 + yy, cx + min(xx + 8, f.width) - 1, y + 64 + min(yy + 8, f.height) - 1), fill=(232, 236, 242))
            img.alpha_composite(f, (cx, y + 64))
            cx += f.width + CELL_GAP
        x = max(cx, x + 190) + 16
    y += bh + 16
img.convert('RGB').save(OUT)
print(OUT, img.size)
