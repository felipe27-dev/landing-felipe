"""Gera os efeitos sonoros (estilo chiptune de portátil) em public/assets/audio/sfx/*.wav.

Uso (da raiz do projeto):  python scripts/make_sfx.py
"""
import os
import wave
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'assets', 'audio', 'sfx')
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def osc(freq, d, kind='square', duty=0.5):
    """freq pode ser número ou array (glissando)."""
    n = int(SR * d)
    f = np.full(n, freq, float) if np.isscalar(freq) else np.asarray(freq, float)[:n]
    ph = np.cumsum(f) / SR % 1.0
    if kind == 'square': return np.where(ph < duty, 1.0, -1.0)
    if kind == 'tri': return 4 * np.abs(ph - 0.5) - 1
    if kind == 'saw': return 2 * ph - 1
    return np.sin(2 * np.pi * ph)


def env(d, a=0.004, r=None, curve=3.0):
    n = int(SR * d); x = np.linspace(0, 1, n)
    e = (1 - x) ** curve if r is None else np.clip((1 - x) / max(r, 1e-6), 0, 1) ** curve
    na = max(1, int(SR * a)); e[:na] *= np.linspace(0, 1, na)
    return e


def noise(d):
    return rng.uniform(-1, 1, int(SR * d))


def lowpass(x, k=6):
    return np.convolve(x, np.ones(k) / k, mode='same')


def note(n):
    return 440 * 2 ** ((n - 69) / 12)


def seq(notes, step, kind='square', duty=0.5, gap=0.85, curve=1.5):
    out = []
    for n in notes:
        tone = osc(note(n), step, kind, duty) * env(step, r=gap, curve=curve) if n else np.zeros(int(SR * step))
        out.append(tone)
    return np.concatenate(out)


def glide(f0, f1, d):
    return np.geomspace(f0, f1, int(SR * d))


def mix(*parts):
    n = max(len(p) for p in parts); out = np.zeros(n)
    for p in parts: out[:len(p)] += p
    return out


def save(name, x, vol=0.5):
    x = x / (np.abs(x).max() + 1e-9) * vol
    fade = min(len(x), int(SR * 0.006)); x[-fade:] *= np.linspace(1, 0, fade)
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


# Esbarrão: "tum" grave e abafado
d = 0.12
save('bump', lowpass(osc(glide(150, 70, d), d, 'square', 0.3) * env(d, curve=2), 10) + lowpass(noise(d) * env(d, curve=6), 20) * 0.4, 0.55)
# Interagir: dois bipes ascendentes
save('interact', seq([84, 91], 0.055, 'square', 0.25), 0.35)
# Confirmar
save('select', seq([88, 96], 0.045, 'square', 0.125), 0.32)
# Cursor do menu
d = 0.035
save('menu_move', osc(1568, d, 'square', 0.25) * env(d, curve=2.5), 0.25)
# Abrir menu: arpejo curto
save('menu_open', seq([76, 83, 88], 0.04, 'square', 0.25), 0.3)
# Blip de texto (bem curto)
d = 0.022
save('text', osc(1975, d, 'square', 0.5) * env(d, curve=1.2), 0.18)
# Porta: passos + "whoosh" descendente
d = 0.28
save('door', mix(lowpass(noise(d) * env(d, curve=3), 8) * 0.6, osc(glide(520, 180, d), d, 'tri') * env(d, curve=2)), 0.5)
# Saída: "whoosh" ascendente
save('exit', mix(lowpass(noise(d) * env(d, curve=3), 8) * 0.6, osc(glide(180, 520, d), d, 'tri') * env(d, curve=2)), 0.5)
# Viagem rápida: varredura brilhante com vibrato
d = 0.55
f = glide(300, 1600, d) * (1 + 0.03 * np.sin(2 * np.pi * 18 * t(d)))
save('travel', mix(osc(f, d, 'square', 0.25) * env(d, curve=1.2) * 0.6, osc(f * 1.5, d, 'tri') * env(d, curve=1.5) * 0.4), 0.38)
# Conquista: fanfarra (arpejo + nota longa com harmonia)
fan = seq([72, 76, 79, 84], 0.085, 'square', 0.5, gap=0.9)
hold = 0.5
long = (osc(note(88), hold, 'square', 0.25) + 0.6 * osc(note(84), hold, 'square', 0.5)) * env(hold, curve=1.4)
bass = seq([48, 0, 55, 0], 0.085, 'tri') * 0.8
save('achievement', mix(np.concatenate([fan, long]), np.concatenate([bass, osc(note(48), hold, 'tri') * env(hold, curve=1.5)])), 0.42)
# Segredo: brilho mágico (arpejo rápido descendente + ascendente)
save('secret', mix(seq([91, 88, 84, 79, 84, 88, 91, 96], 0.055, 'tri', gap=1), seq([79, 0, 76, 0, 79, 0, 84, 0], 0.055, 'square', 0.125) * 0.35), 0.4)
print('ok:', sorted(os.listdir(OUT)))
