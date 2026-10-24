# Turns rendered frames into two MP4s at 20 fps:
#   blockout.mp4          clean, the source video for Genjutsu
#   blockout-etiketli.mp4 the same with shot number, time and frame stamped in a corner, for review
# usage: python3 video/encode.py <outDir> [scene.js] [name]   (defaults: video/blockout.js, blockout)
import json, os, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

out = sys.argv[1]
entry = sys.argv[2] if len(sys.argv) > 2 else 'video/blockout.js'
name = sys.argv[3] if len(sys.argv) > 3 else 'blockout'
src = open(entry, encoding='utf-8').read()
shots = [(float(a), float(b), n) for a, b, n in re.findall(r"\[([\d.]+), ([\d.]+), '([^']+)'\]", src)]
font = ImageFont.truetype('/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Regular.ttf', 26) if os.path.exists('/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Regular.ttf') else ImageFont.load_default()
os.makedirs(f'{out}/labeled', exist_ok=True)
frames = sorted(f for f in os.listdir(f'{out}/frames') if f.endswith('.png'))
for f in frames:
    i = int(f[:4]); t = i / 20
    name = next((n for a, b, n in shots if a <= t < b), shots[-1][2])
    im = Image.open(f'{out}/frames/{f}').convert('RGB')
    d = ImageDraw.Draw(im, 'RGBA')
    label = f'{name}   {t:05.2f} s   kare {i:03d}'
    w = d.textlength(label, font=font)
    d.rounded_rectangle((24, 1080 - 76, 24 + w + 32, 1080 - 24), 12, fill=(15, 17, 21, 170))
    d.text((40, 1080 - 66), label, font=font, fill=(255, 255, 255))
    im.save(f'{out}/labeled/{f}')
enc = ['-framerate', '20', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '20', '-movflags', '+faststart']
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '20', '-i', f'{out}/frames/%04d.png', *enc[2:], f'{out}/{name}.mp4'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '20', '-i', f'{out}/labeled/%04d.png', *enc[2:], f'{out}/{name}-etiketli.mp4'], check=True)
print(len(frames), 'frames →', f'{out}/{name}.mp4', f'{out}/{name}-etiketli.mp4')
