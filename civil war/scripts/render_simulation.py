from PIL import Image, ImageDraw, ImageFilter

base = Image.open('assets/im_clean.png').convert('RGBA')

# Dimensions: 260 x 560
cx, cy = 105, 147
rx, ry = 4.8, 6.2

# 1. Outer ambient glow (fi8 blur = 8)
g_outer = Image.new('RGBA', base.size, (0, 0, 0, 0))
d_out = ImageDraw.Draw(g_outer)
d_out.ellipse((cx - 13, cy - 16, cx + 13, cy + 16), fill=(127, 216, 255, 150))
g_outer = g_outer.filter(ImageFilter.GaussianBlur(8))

# 2. Inner halo (fi4 blur = 4)
g_inner = Image.new('RGBA', base.size, (0, 0, 0, 0))
d_in = ImageDraw.Draw(g_inner)
d_in.ellipse((cx - 7.5, cy - 9.5, cx + 7.5, cy + 9.5), fill=(168, 236, 255, 210))
g_inner = g_inner.filter(ImageFilter.GaussianBlur(4))

# 3. Core
core = Image.new('RGBA', base.size, (0, 0, 0, 0))
d_core = ImageDraw.Draw(core)
d_core.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(255, 255, 255, 255))

# Also palm glow at (155, 245)
palm = Image.new('RGBA', base.size, (0, 0, 0, 0))
d_palm = ImageDraw.Draw(palm)
d_palm.ellipse((155 - 12, 245 - 12, 155 + 12, 245 + 12), fill=(127, 216, 255, 180))
palm = palm.filter(ImageFilter.GaussianBlur(8))
d_pcore = ImageDraw.Draw(palm)
d_pcore.ellipse((155 - 5, 245 - 5, 155 + 5, 245 + 5), fill=(255, 255, 255, 240))

# Composite
res = Image.alpha_composite(base, g_outer)
res = Image.alpha_composite(res, g_inner)
res = Image.alpha_composite(res, core)
res = Image.alpha_composite(res, palm)

# Save full character preview
res.save('assets/im_rendered_preview.png')

# Save zoomed-in chest view
chest_zoom = res.crop((60, 100, 180, 210))
chest_zoom_hd = chest_zoom.resize((chest_zoom.width * 3, chest_zoom.height * 3), Image.Resampling.LANCZOS)
chest_zoom_hd.save('assets/chest_rendered_hd.png')

print('Rendered im_rendered_preview.png and chest_rendered_hd.png successfully')
