from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
icon_dir = ROOT / 'icon'
icon_dir.mkdir(exist_ok=True)

size = 512
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

for r, a in [(180, 28), (130, 44), (86, 70)]:
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((size//2-r, size//2-r-18, size//2+r, size//2+r-18), fill=(255, 178, 84, a))
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    img.alpha_composite(glow)

bowl = [(150, 290), (362, 290), (330, 392), (182, 392)]
d.polygon(bowl, fill=(56, 34, 23, 255))
d.line(bowl + [bowl[0]], fill=(212, 165, 103, 220), width=8)
d.rounded_rectangle((170, 330, 342, 360), radius=12, fill=(86, 55, 39, 255), outline=(222, 176, 114, 220), width=5)

d.line((220, 320, 296, 156), fill=(123, 79, 52, 255), width=10)
d.line((222, 320, 298, 156), fill=(220, 176, 118, 180), width=3)

d.ellipse((284, 144, 308, 168), fill=(255, 206, 133, 255))
flame = Image.new('RGBA', (size, size), (0, 0, 0, 0))
fd = ImageDraw.Draw(flame)
fd.ellipse((268, 128, 328, 188), fill=(255, 151, 73, 185))
flame = flame.filter(ImageFilter.GaussianBlur(10))
img.alpha_composite(flame)

for i in range(6):
    x = 292 + i * 8
    y = 118 - i * 22
    smoke = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(smoke)
    sd.ellipse((x - 22, y - 22, x + 22, y + 22), fill=(230, 230, 236, 42 - i * 4))
    smoke = smoke.filter(ImageFilter.GaussianBlur(10))
    img.alpha_composite(smoke)

img.save(icon_dir / 'prayclaude-512.png')
img.resize((256, 256)).save(icon_dir / 'prayclaude-256.png')
img.resize((64, 64)).save(icon_dir / 'Template.png')
img.resize((256, 256)).save(icon_dir / 'icon.png')
print('Generated PNG assets in', icon_dir)
