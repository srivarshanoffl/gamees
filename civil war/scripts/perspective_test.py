from PIL import Image, ImageDraw, ImageFilter

base = Image.open('assets/im_clean.png').convert('RGBA')

tests = [
    {"name": "Circle r=5.5", "rx": 5.5, "ry": 5.5, "grx": 13, "gry": 13},
    {"name": "Ellipse rx=4.8 ry=6.2", "rx": 4.8, "ry": 6.2, "grx": 11, "gry": 14},
    {"name": "Ellipse rx=5.2 ry=6.8", "rx": 5.2, "ry": 6.8, "grx": 12, "gry": 15},
]

crops = []
cx, cy = 105, 147

for t in tests:
    img = base.copy()
    rx, ry = t["rx"], t["ry"]
    grx, gry = t["grx"], t["gry"]
    
    # Outer glow
    g1 = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d1 = ImageDraw.Draw(g1)
    d1.ellipse((cx - grx, cy - gry, cx + grx, cy + gry), fill=(120, 215, 255, 150))
    g1 = g1.filter(ImageFilter.GaussianBlur(5))
    
    # Inner halo
    g2 = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d2 = ImageDraw.Draw(g2)
    d2.ellipse((cx - rx * 1.5, cy - ry * 1.5, cx + rx * 1.5, cy + ry * 1.5), fill=(170, 235, 255, 220))
    g2 = g2.filter(ImageFilter.GaussianBlur(2))
    
    # Core
    core = Image.new('RGBA', img.size, (0, 0, 0, 0))
    dc = ImageDraw.Draw(core)
    dc.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(255, 255, 255, 255))
    
    comp = Image.alpha_composite(img, g1)
    comp = Image.alpha_composite(comp, g2)
    comp = Image.alpha_composite(comp, core)
    
    crop = comp.crop((70, 105, 175, 195))
    crop_2x = crop.resize((crop.width * 2, crop.height * 2), Image.Resampling.LANCZOS)
    draw_t = ImageDraw.Draw(crop_2x)
    draw_t.text((6, 6), t["name"], fill=(255, 255, 0, 255))
    crops.append(crop_2x)

montage = Image.new('RGBA', (crops[0].width * 3, crops[0].height), (15, 18, 24, 255))
for i, c in enumerate(crops):
    montage.paste(c, (i * c.width, 0), c)

montage.save('assets/arc_perspective_test.png')
print('Saved arc_perspective_test.png')
