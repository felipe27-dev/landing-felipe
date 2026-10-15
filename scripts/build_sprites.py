"""Regera todos os sprites a partir das folhas em art-source/, na ordem certa.

Uso (da raiz):  python scripts/build_sprites.py
Requer: Python 3.10+, numpy, scipy, Pillow  (pip install numpy scipy pillow)
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SHEET = os.path.join(ROOT, 'art-source', 'Sprite Sheet RPG Pixel Art Organizado.png')
OUT = os.path.join(ROOT, 'public', 'assets', 'sprites')


def run(*args):
    print('>', ' '.join(os.path.basename(a) for a in args))
    subprocess.run([sys.executable, *args], cwd=HERE, check=True)


# 1ª folha (sem transparência): móveis, objetos e placas
run('sprites_segment.py', SHEET)
directions = open(os.path.join(HERE, 'sprites_directions.json'), encoding='utf-8').read()
json.loads(directions)
run('sprites_extract.py', SHEET, OUT, directions)
# Folhas com transparência: terreno, cenário, retratos, interiores
run('sprites_v2.py')
# Animações com mais quadros (água, flores, mato, fonte, barco, balão)
run('sprites_v3.py')
# Leva de alta qualidade: NPCs, prédios e caminhada do Felipe
run('sprites_v4.py')

for f in ('fg.npy',):
    p = os.path.join(HERE, f)
    if os.path.exists(p):
        os.remove(p)
for f in os.listdir(HERE):
    if f.startswith('prev_') and f.endswith('.png'):
        os.remove(os.path.join(HERE, f))
print('Sprites regerados em public/assets/sprites/')
