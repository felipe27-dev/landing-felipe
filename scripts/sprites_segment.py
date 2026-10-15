import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd
src = sys.argv[1]
im = np.array(Image.open(src).convert('RGB')).astype(int)
mx, mn = im.max(2), im.min(2)
bglike = (mn >= 210) & (mx - mn <= 14)
# fundo = pixels "de fundo" conectados à borda
lab, _ = nd.label(bglike)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(border))
fg = ~bg
fg = nd.binary_opening(fg, iterations=1)
np.save('fg.npy', fg)
lab2, n = nd.label(nd.binary_dilation(fg, iterations=2))
boxes = nd.find_objects(lab2)
out = []
for i, b in enumerate(boxes):
    y0, y1, x0, x1 = b[0].start, b[0].stop, b[1].start, b[1].stop
    if (y1 - y0) * (x1 - x0) < 150: continue
    out.append((y0, x0, y1, x1))
out.sort()
for o in out: print(o)
print(len(out))
