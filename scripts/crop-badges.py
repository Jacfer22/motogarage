from PIL import Image
import os

ref_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'badges', 'badges-reference.png')
out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'badges')
ref = Image.open(ref_path).convert('RGBA')

# (name, left, top, right, bottom) — solo stemma, senza etichetta testo
BOXES = [
    ('chiave-in-mano', 18, 48, 248, 262),
    ('strada-aperta', 268, 48, 502, 262),
    ('centauro-asfalto', 522, 48, 758, 268),
    ('conquistatore-passi', 778, 48, 1006, 268),
    ('re-delle-curve', 78, 358, 338, 572),
    ('leggenda-in-sella', 388, 352, 638, 582),
    ('divinita-bitume', 668, 318, 998, 578),
]


def trim_content(im: Image.Image, pad: int = 6) -> Image.Image:
    px = im.load()
    w, h = im.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > 28 or g > 28 or b > 28:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x <= min_x:
        return im
    return im.crop((
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(w, max_x + pad + 1),
        min(h, max_y + pad + 1),
    ))


for name, l, t, r, b in BOXES:
    crop = ref.crop((l, t, r, b))
    trimmed = trim_content(crop, pad=8)
    path = os.path.join(out_dir, f'{name}.png')
    trimmed.save(path, optimize=True)
    print(name, trimmed.size)
