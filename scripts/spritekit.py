"""Utilidades de limpeza de sprites compartilhadas pelos extratores.

O halo branco em volta de móveis e placas vinha da reamostragem: os pixels transparentes
guardam a cor do fundo antigo (branco/quadriculado) e ela "vaza" para o contorno ao
redimensionar e aplicar nitidez. Aqui a cor da borda é estendida para dentro da área
transparente antes de qualquer filtro, o alfa é endurecido e o anel claro restante é removido.
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd


def bleed(im: Image.Image) -> Image.Image:
    """Preenche o RGB dos pixels transparentes com a cor opaca mais próxima."""
    a = np.array(im.convert('RGBA'))
    op = a[:, :, 3] > 0
    if op.all() or not op.any():
        return Image.fromarray(a, 'RGBA')
    _, (iy, ix) = nd.distance_transform_edt(~op, return_indices=True)
    a[:, :, :3] = a[iy, ix, :3]
    return Image.fromarray(a, 'RGBA')


def clean_edges(im: Image.Image, passes: int = 2) -> Image.Image:
    """Alfa duro + remove pixels claros e sem cor no anel externo do contorno."""
    a = np.array(im.convert('RGBA')).astype(int)
    a[:, :, 3] = np.where(a[:, :, 3] >= 128, 255, 0)
    for _ in range(passes):
        op = a[:, :, 3] > 0
        ring = op & nd.binary_dilation(~op, iterations=1)
        rgb = a[:, :, :3]
        lum = rgb.mean(2)
        sat = rgb.max(2) - rgb.min(2)
        kill = ring & (lum > 170) & (sat < 50)
        if not kill.any():
            break
        a[kill, 3] = 0
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


def resize(im: Image.Image, size, sharpen=True) -> Image.Image:
    """Redimensiona sem halo: bleed → LANCZOS → nitidez → limpeza de borda."""
    src = bleed(im)
    out = src.resize(size, Image.LANCZOS)
    if sharpen:
        rgb = out.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.2, percent=70, threshold=2))
        alpha = out.getchannel('A')
        out = rgb.convert('RGBA'); out.putalpha(alpha)
    return clean_edges(out)
