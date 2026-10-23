# Converts assets/images/* into web-ready WebP files in assets/web/ (named by shot ID, e.g. A1.webp).
# build.mjs embeds these into the single-file brand book. Run: python3 scripts/web-images.py
import glob, os
from PIL import Image

SRC, OUT, MAX, Q = 'assets/images', 'assets/web', 1600, 80
os.makedirs(OUT, exist_ok=True)
for f in sorted(glob.glob(os.path.join(SRC, '*'))):
    sid = os.path.basename(f).split('-')[0]
    im = Image.open(f).convert('RGB')
    im.thumbnail((MAX, MAX), Image.LANCZOS)
    im.save(os.path.join(OUT, sid + '.webp'), 'WEBP', quality=Q, method=6)
    print(sid, im.size, os.path.getsize(os.path.join(OUT, sid + '.webp')) // 1024, 'KB')
