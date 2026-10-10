from PIL import Image, ImageDraw, ImageFilter
import numpy as np

# Load im_clean
base_img = Image.open('assets/im_clean.png').convert('RGBA')

# Let's test candidate positions for the chest arc reactor
# Candidates:
# 1. (X=102, Y=148) - right near the front curve of the chest
# 2. (X=106, Y=148) - slightly deeper on the chest plate
# 3. (X=110, Y=148) - center of front chest plate
# 4. (X=106, Y=144) - upper chest
# 5. (X=106, Y=152) - mid-lower chest

candidates = [
    (98, 148, "X=98, Y=148"),
    (103, 146, "X=103, Y=146"),
    (106, 148, "X=106, Y=148"),
    (110, 148, "X=110, Y=148"),
    (114, 148, "X=114, Y=148"),
]

# We will create a montage showing the chest of each candidate
crops = []
for cx, cy, label in candidates:
    img = base_img.copy()
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    
    # Outer glow: soft cyan circle with blur
    glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((cx - 18, cy - 18, cx + 18, cy + 18), fill=(127, 216, 255, 120))
    glow = glow.filter(ImageFilter.GaussianBlur(6))
    
    # Inner glow
    iglow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    igd = ImageDraw.Draw(iglow)
    igd.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=(180, 240, 255, 200))
    iglow = iglow.filter(ImageFilter.GaussianBlur(3))
    
    # Core
    d.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=(255, 255, 255, 255))
    
    comp = Image.alpha_composite(img, glow)
    comp = Image.alpha_composite(comp, iglow)
    comp = Image.alpha_composite(comp, overlay)
    
    # Crop chest region
    c = comp.crop((60, 110, 170, 200))
    c_large = c.resize((c.width * 2, c.height * 2), Image.Resampling.LANCZOS)
    cdraw = ImageDraw.Draw(c_large)
    cdraw.text((5, 5), label, fill=(255, 255, 0, 255))
    crops.append(c_large)

# Stitch horizontally
total_w = sum(c.width for c in crops)
max_h = max(c.height for c in crops)
montage = Image.new('RGBA', (total_w, max_h), (20, 24, 32, 255))
x_off = 0
for c in crops:
    montage.paste(c, (x_off, 0), c)
    x_off += c.width

montage.save('assets/arc_candidates.png')
print('Saved arc_candidates.png')
