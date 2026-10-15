"""Gera as imagens de referência das levas de assets (NPCs e construções) em docs/.

Uso (da raiz):  python scripts/make_batch_refs.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SP = os.path.join(ROOT, 'public', 'assets', 'sprites')
DOCS = os.path.join(ROOT, 'docs', 'assets')


def font(size):
    for f in ['C:/Windows/Fonts/consolab.ttf', 'C:/Windows/Fonts/arialbd.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


FT, FL, FS = font(28), font(18), font(14)
INK, RED, BLUE, BG = (40, 48, 56), (224, 64, 64), (56, 112, 208), (244, 241, 230)


def checker(d, x, y, w, h, step=8):
    for yy in range(0, h, step):
        for xx in range(0, w, step):
            if (xx // step + yy // step) % 2:
                d.rectangle((x + xx, y + yy, x + min(xx + step, w) - 1, y + min(yy + step, h) - 1), fill=(228, 233, 240))


# ---------------- NPCs ----------------
NPCS = [
    ('guide', 'Guia da praça', 'chapéu de explorador cáqui, camisa verde, mochila; simpático'),
    ('scientist', 'Assistente do Laboratório', 'cabelo castanho, óculos, jaleco branco, gravata vermelha'),
    ('librarian', 'Bibliotecária', 'cabelo castanho longo, óculos, suéter roxo, segura um livro'),
    ('artisan', 'Artesão da Oficina', 'bandana vermelha, avental azul de oficina, camisa branca'),
    ('clerk', 'Atendente do Correio', 'quepe azul de carteiro com emblema dourado, uniforme azul'),
    ('keeper', 'Faroleiro', 'senhor de barba branca, quepe e casaco azul-marinho de marinheiro'),
]
CW, CH = 64, 96
rows = []
for key, name, desc in NPCS:
    sh = Image.open(os.path.join(SP, 'characters', f'{key}.png')).convert('RGBA')
    fw, fh = sh.width // 3, sh.height // 4
    poses = [sh.crop((0, r * fh, fw, (r + 1) * fh)) for r in (0, 1, 2)]  # frente, costas, esquerda
    por = Image.open(os.path.join(SP, 'portraits', f'{key}.png')).convert('RGBA')
    rows.append((key, name, desc, poses, por))

W = 1240
H = 150 + len(rows) * 210
img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)
d.text((30, 24), 'Leva NPCs — referência atual (manter identidade; subir qualidade e consistência)', font=FT, fill=INK)
d.text((30, 62), 'Entregar por NPC: 1 PNG 256×96 = 4 poses de 64×96 lado a lado: FRENTE · COSTAS · ESQUERDA · FALANDO (frente, boca aberta/gesto).', font=FS, fill=RED)
d.text((30, 84), 'Personagem ~84 px de altura, pés na mesma linha (2 px acima da base), contorno escuro de 1 px, luz de cima-esquerda, fundo 100% transparente, sem brilho.', font=FS, fill=INK)
d.text((30, 104), 'Direita = espelho da esquerda (não precisa). Retrato 128×128 opcional, mesmo personagem, fundo liso.', font=FS, fill=INK)
y = 140
for key, name, desc, poses, por in rows:
    d.rounded_rectangle((20, y - 6, W - 20, y + 196), 12, outline=INK, width=3, fill=(255, 255, 255))
    d.text((36, y + 4), f'{name}  ·  characters/{key}.png', font=FL, fill=INK)
    d.text((36, y + 28), desc, font=FS, fill=BLUE)
    x = 36
    for lbl, p in zip(['FRENTE', 'COSTAS', 'ESQUERDA', 'FALANDO (novo)'], poses + [None]):
        d.text((x, y + 52), lbl, font=FS, fill=RED if p is None else INK)
        checker(d, x, y + 72, CW * 1.5 if False else 96, 120)
        if p is not None:
            big = p.resize((p.width * 5 // 4, p.height * 5 // 4), Image.NEAREST)
            img.paste(big, (x + (96 - big.width) // 2, y + 72 + 120 - big.height), big)
        else:
            d.text((x + 30, y + 120), '?', font=FT, fill=RED)
        x += 150
    d.text((x + 10, y + 52), 'RETRATO', font=FS, fill=INK)
    img.paste(por.resize((120, 120)), (x + 10, y + 72), por.resize((120, 120)))
    y += 210
img.save(os.path.join(DOCS, 'leva_npcs_referencia.png'))

# ---------------- Construções ----------------
BUILDS = [
    ('lab', 'Laboratório', 'Projetos', 'branco e azul, antena/parabólica no telhado, porta de vidro automática, emblema circular'),
    ('biblioteca', 'Biblioteca', 'Habilidades', 'madeira quente, telhado vermelho, livro aberto como emblema, janelas com estantes visíveis'),
    ('oficina', 'Oficina', 'Serviços', 'telhado de ardósia cinza, engrenagem no frontão, portão de oficina, ferramentas na fachada'),
    ('correio', 'Correio', 'Contato', 'telhado vermelho, envelope como emblema, caixa de correio ao lado, toldo vermelho'),
    ('farol', 'Farol', 'Experiência', 'listras vermelho e branco, lanterna de vidro no topo, base de pedra, porta arredondada'),
]
TARGET = {'lab': (288, 256), 'biblioteca': (256, 256), 'oficina': (288, 256), 'correio': (320, 256), 'farol': (128, 320)}
W2 = 1240
H2 = 150 + len(BUILDS) * 300
im2 = Image.new('RGB', (W2, H2), BG)
d2 = ImageDraw.Draw(im2)
d2.text((30, 24), 'Leva Construções — referência atual (subir qualidade e detalhes)', font=FT, fill=INK)
d2.text((30, 62), 'Vista 3/4 de cima, estilo RPG portátil, 64 px = 1 tile. Fundo transparente, SEM grama/chão na base. Porta centralizada na base (64 px de largura).', font=FS, fill=RED)
d2.text((30, 84), 'Opcional por prédio: 2ª imagem com janelas acesas (noite) e 3 quadros de porta abrindo (64×64 cada).', font=FS, fill=INK)
y = 130
for key, name, sec, desc in BUILDS:
    p = Image.open(os.path.join(SP, 'buildings', f'{key}.png')).convert('RGBA')
    tw, th = TARGET[key]
    d2.rounded_rectangle((20, y - 6, W2 - 20, y + 290), 12, outline=INK, width=3, fill=(255, 255, 255))
    d2.text((36, y + 4), f'{name} ({sec})  ·  buildings/{key}.png  ·  alvo {tw}×{th} px', font=FL, fill=INK)
    d2.text((36, y + 28), desc, font=FS, fill=BLUE)
    scale = min(240 / p.height, 300 / p.width)
    q = p.resize((int(p.width * scale), int(p.height * scale)), Image.NEAREST)
    checker(d2, 36, y + 48, 300, 240)
    im2.paste(q, (36 + (300 - q.width) // 2, y + 48 + 240 - q.height), q)
    d2.text((360, y + 60), 'HOJE: recorte da 1ª folha, pouco detalhe, base com grama removida à força.', font=FS, fill=INK)
    d2.text((360, y + 84), f'QUERO: mesma silhueta e cores, {tw}×{th} px, contorno limpo,', font=FS, fill=RED)
    d2.text((360, y + 104), 'texturas (telhas, tijolos, madeira), sombras internas, placa com o emblema,', font=FS, fill=RED)
    d2.text((360, y + 124), 'janelas com reflexo, porta centralizada na base.', font=FS, fill=RED)
    y += 300
im2.save(os.path.join(DOCS, 'leva_construcoes_referencia.png'))
print('ok')
