from PIL import Image, ImageDraw, ImageFilter

base = Image.open('assets/im_clean.png').convert('RGBA')

# Let's test a fine grid of candidate centers and glow aesthetics
# In the movie, the Mark 46 arc reactor is a glowing circle/trapezoid with a luminous cyan-white core
# and a soft vibrant cyan halo that illuminates the surrounding armor.
configs = [
    {"cx": 104, "cy": 146, "core_r": 5, "glow_r": 12, "desc": "104, 146 (r=5, glow=12)"},
    {"cx": 105, "cy": 146, "core_r": 5.5, "glow_r": 14, "desc": "105, 146 (r=5.5, glow=14)"},
    {"cx": 105, "cy": 148, "core_r": 5.5, "glow_r": 14, "desc": "105, 148 (r=5.5, glow=14)"},
    {"cx": 106, "cy": 146, "core_r": 6, "glow_r": 15, "desc": "106, 146 (r=6, glow=15)"},
    {"cx": 106, "cy": 148, "core_r": 6, "glow_r": 15, "desc": "106, 148 (r=6, glow=15)"},
    {"cx": 107, "cy": 147, "core_r": 6, "glow_r": 16, "desc": "107, 147 (r=6, glow=16)"},
]

results = []
for cfg in configs:
    cx, cy = cfg["cx"], cfg["cy"]
    img = base.copy()
    
    # Outer ambient glow
    glow1 = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d1 = ImageDraw.Draw(glow1)
    d1.ellipse((cx - cfg["glow_r"], cy - cfg["glow_r"], cx + cfg["glow_r"], cy + cfg["glow_r"]), fill=(120, 215, 255, 160))
    glow1 = glow1.filter(ImageFilter.GaussianBlur(6))
    
    # Mid glow
    glow2 = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d2 = ImageDraw.Draw(glow2)
    d2.ellipse((cx - cfg["core_r"] * 1.6, cy - cfg["core_r"] * 1.6, cx + cfg["core_r"] * 1.6, cy + cfg["core_r"] * 1.6), fill=(160, 235, 255, 220))
    glow2 = glow2.filter(ImageFilter.GaussianBlur(2.5))
    
    # Core
    core = Image.new('RGBA', img.size, (0, 0, 0, 0))
    dc = ImageDraw.Draw(core)
    dc.ellipse((cx - cfg["core_r"], cy - cfg["core_r"], cx + cfg["core_r"], cy + cfg["core_r"]), fill=(255, 255, 255, 255))
    
    comp = Image.alpha_composite(img, glow1)
    comp = Image.alpha_composite(comp, glow2)
    comp = Image.alpha_composite(comp, core)
    
    # Crop chest area (x: 75..175, y: 105..195)
    crop = comp.crop((75, 105, 175, 195))
    crop_2x = crop.resize((crop.width * 2, crop.height * 2), Image.Resampling.LANCZOS)
    draw_t = ImageDraw.Draw(crop_2x)
    draw_t.text((6, 6), cfg["desc"], fill=(255, 255, 0, 255))
    results.append(crop_2x)

# 2 rows of 3
row1 = Image.new('RGBA', (results[0].width * 3, results[0].height), (15, 18, 24, 255))
for i in range(3):
    row1.paste(results[i], (i * results[0].width, 0), results[i])

row2 = Image.new('RGBA', (results[0].width * 3, results[0].height), (15, 18, 24, 255))
for i in range(3, 6):
    row2.paste(results[i], ((i - 3) * results[0].width, 0), results[i])

final_img = Image.new('RGBA', (row1.width, row1.height * 2 + 10), (15, 18, 24, 255))
final_img.paste(row1, (0, 0))
final_img.paste(row2, (0, row1.height + 10))
final_img.save('assets/arc_fine_tuning.png')
print('Saved arc_fine_tuning.png')
