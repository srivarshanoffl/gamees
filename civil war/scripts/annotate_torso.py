from PIL import Image, ImageDraw, ImageFont
import numpy as np

img = Image.open('assets/im_clean.png').convert('RGBA')

# Let's crop the torso: x from 70 to 210, y from 90 to 220
crop = img.crop((70, 90, 210, 220))
# Let's scale it up 4x for crystal clear visibility
crop_large = crop.resize((crop.width * 4, crop.height * 4), Image.Resampling.NEAREST)
draw = ImageDraw.Draw(crop_large)

# Draw grid lines every 10 pixels (scaled * 4) with labels
for orig_x in range(80, 210, 10):
    lx = (orig_x - 70) * 4
    draw.line([(lx, 0), (lx, crop_large.height)], fill=(255, 255, 255, 100), width=1)
    # text
    draw.text((lx + 2, 2), str(orig_x), fill=(255, 255, 0, 255))

for orig_y in range(100, 220, 10):
    ly = (orig_y - 90) * 4
    draw.line([(0, ly), (crop_large.width, ly)], fill=(255, 255, 255, 100), width=1)
    draw.text((2, ly + 2), str(orig_y), fill=(255, 255, 0, 255))

crop_large.save('assets/annotated_torso.png')
print('Saved annotated_torso.png')
