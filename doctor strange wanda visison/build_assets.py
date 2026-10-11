import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def create_cosmic_nebula_back():
    w, h = 1920, 1080
    img = Image.new('RGB', (w, h), (4, 3, 14))
    draw = ImageDraw.Draw(img)
    
    # 1. Base gradient
    for y in range(h):
        ratio = y / h
        r = int(5 + 15 * math.sin(ratio * math.pi * 0.8))
        g = int(3 + 8 * (1 - ratio) + 12 * math.sin(ratio * math.pi))
        b = int(18 + 40 * ratio + 25 * math.sin(ratio * math.pi * 0.7))
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    
    # 2. Nebula layers
    nebula = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    neb_draw = ImageDraw.Draw(nebula)
    
    # Multi-colored ethereal cosmic clouds
    clouds = [
        # (cx, cy, rx, ry, color)
        (w * 0.25, h * 0.35, 600, 380, (90, 35, 140, 130)), # Violet nebula left
        (w * 0.75, h * 0.30, 750, 420, (140, 40, 110, 110)), # Magenta nebula right
        (w * 0.50, h * 0.50, 900, 480, (60, 25, 115, 95)),   # Central deep cosmic purple
        (w * 0.30, h * 0.65, 500, 300, (180, 90, 40, 60)),   # Eldritch amber dust
        (w * 0.82, h * 0.60, 550, 320, (190, 40, 80, 85)),   # Chaos crimson haze
        (w * 0.50, h * 0.25, 450, 220, (50, 80, 160, 80)),   # Cyan celestial glow
    ]
    for cx, cy, rx, ry, col in clouds:
        neb_draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=col)
    
    nebula = nebula.filter(ImageFilter.GaussianBlur(120))
    img = Image.alpha_composite(img.convert('RGBA'), nebula)
    
    # 3. Rich Starfield
    star_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(star_layer)
    np.random.seed(42)
    
    # 500 tiny stars
    num_stars = 600
    xs = np.random.uniform(0, w, num_stars)
    ys = np.random.uniform(0, h * 0.85, num_stars)
    radii = np.random.uniform(0.5, 2.2, num_stars)
    opacities = np.random.uniform(70, 255, num_stars)
    
    star_colors = [
        (255, 255, 255), (220, 230, 255), (255, 230, 200),
        (210, 190, 255), (255, 200, 220), (180, 240, 255)
    ]
    
    for i in range(num_stars):
        col_base = star_colors[i % len(star_colors)]
        alpha = int(opacities[i])
        r = radii[i]
        col = (col_base[0], col_base[1], col_base[2], alpha)
        s_draw.ellipse([xs[i]-r, ys[i]-r, xs[i]+r, ys[i]+r], fill=col)
        
        # Cross diffraction spikes on bright stars
        if r > 1.8 and i % 7 == 0:
            sp_len = r * 6
            s_draw.line([(xs[i] - sp_len, ys[i]), (xs[i] + sp_len, ys[i])], fill=(col_base[0], col_base[1], col_base[2], int(alpha * 0.6)), width=1)
            s_draw.line([(xs[i], ys[i] - sp_len), (xs[i], ys[i] + sp_len)], fill=(col_base[0], col_base[1], col_base[2], int(alpha * 0.6)), width=1)
            
    img = Image.alpha_composite(img, star_layer)
    img.convert('RGB').save('assets/another_earth_cosmic_bg.png', quality=95)
    print("Created assets/another_earth_cosmic_bg.png")

def create_another_earth_planet():
    size = 900
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    radius = 320
    
    # 1. Outer Atmospheric Rayleigh Halo (Glow)
    halo = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    h_draw = ImageDraw.Draw(halo)
    for r in range(radius + 60, radius - 5, -3):
        frac = (r - radius) / 60.0
        alpha = int(max(0, min(140, (1.0 - frac) * 140)))
        h_draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(70, 160, 255, alpha), width=3)
    halo = halo.filter(ImageFilter.GaussianBlur(15))
    img = Image.alpha_composite(img, halo)
    
    # 2. Planet Sphere Texture
    # Synthesize planetary surface via numpy
    planet_img = Image.new('RGBA', (radius * 2, radius * 2), (0, 0, 0, 0))
    p_pixels = np.zeros((radius * 2, radius * 2, 4), dtype=np.uint8)
    
    # Coordinate grid
    y_vals = np.linspace(-1.0, 1.0, radius * 2)
    x_vals = np.linspace(-1.0, 1.0, radius * 2)
    dx, dy = np.meshgrid(x_vals, y_vals)
    dist_sq = dx**2 + dy**2
    mask = dist_sq <= 1.0
    
    # Z coordinate on unit sphere
    dz = np.zeros_like(dist_sq)
    dz[mask] = np.sqrt(np.maximum(0, 1.0 - dist_sq[mask]))
    
    # Illumination vector (top-left cosmic star lighting + eldritch rim)
    lx, ly, lz = -0.55, -0.45, 0.70
    mag_l = math.sqrt(lx**2 + ly**2 + lz**2)
    lx, ly, lz = lx/mag_l, ly/mag_l, lz/mag_l
    
    # Dot product (diffuse illumination)
    diffuse = np.zeros_like(dist_sq)
    diffuse[mask] = np.maximum(0, dx[mask]*lx + dy[mask]*ly + dz[mask]*lz)
    
    # Procedural Continents & Oceans
    # Multi-frequency sinusoidal noise for realistic coastlines and mountain ridges
    np.random.seed(101)
    lon = np.arctan2(dx, dz)
    lat = np.arcsin(np.clip(dy, -1, 1))
    
    terrain = (
        np.sin(lon * 4 + 1.2) * np.cos(lat * 3) * 0.5 +
        np.sin(lon * 8 - 0.7) * np.cos(lat * 7 + 0.4) * 0.28 +
        np.sin(lon * 16 + lat * 12) * 0.15 +
        np.cos(lon * 24 - lat * 18) * 0.08
    )
    
    # Colors
    # Ocean: Deep azure blue to cyan coastal water
    # Land: Viridian green, arid amber, high mountain brown/white
    is_land = (terrain > 0.05) & mask
    is_ocean = (terrain <= 0.05) & mask
    
    # Night city lights mask (where diffuse is dark on land)
    night_lights = is_land & (diffuse < 0.25)
    
    # Compute RGB
    r_chan = np.zeros_like(dist_sq, dtype=np.float32)
    g_chan = np.zeros_like(dist_sq, dtype=np.float32)
    b_chan = np.zeros_like(dist_sq, dtype=np.float32)
    a_chan = np.zeros_like(dist_sq, dtype=np.float32)
    
    # Ocean base
    r_chan[is_ocean] = 12 + 25 * (terrain[is_ocean] + 1)
    g_chan[is_ocean] = 45 + 75 * (terrain[is_ocean] + 1)
    b_chan[is_ocean] = 110 + 90 * (terrain[is_ocean] + 1)
    
    # Land base
    r_chan[is_land] = 45 + 130 * (terrain[is_land])
    g_chan[is_land] = 75 + 100 * (terrain[is_land])
    b_chan[is_land] = 40 + 60 * (terrain[is_land])
    
    # Swirling White Cloud Belts
    clouds = np.sin(lat * 9 + np.cos(lon * 5) * 1.5) * 0.5 + np.cos(lon * 11 + lat * 6) * 0.35
    is_cloud = (clouds > 0.28) & mask
    cloud_intensity = np.clip((clouds[is_cloud] - 0.28) * 3.5, 0, 1)
    r_chan[is_cloud] = r_chan[is_cloud] * (1 - cloud_intensity) + 245 * cloud_intensity
    g_chan[is_cloud] = g_chan[is_cloud] * (1 - cloud_intensity) + 250 * cloud_intensity
    b_chan[is_cloud] = b_chan[is_cloud] * (1 - cloud_intensity) + 255 * cloud_intensity
    
    # Apply Diffuse Sunlight + Ambient Cosmic Glow
    ambient = 0.08
    lighting = np.clip(diffuse * 0.92 + ambient, 0, 1.2)
    
    r_chan[mask] = r_chan[mask] * lighting[mask]
    g_chan[mask] = g_chan[mask] * lighting[mask]
    b_chan[mask] = b_chan[mask] * lighting[mask]
    
    # Night side glowing golden city clusters on Another Earth
    city_mask = night_lights & (np.random.uniform(0, 1, dist_sq.shape) > 0.4)
    city_intensity = (1.0 - (diffuse[city_mask] / 0.25)) * 255
    r_chan[city_mask] += city_intensity * 0.95
    g_chan[city_mask] += city_intensity * 0.75
    b_chan[city_mask] += city_intensity * 0.35
    
    # Atmospheric Rim (Limb brightening in cyan/blue)
    rim = (1.0 - dz) ** 3
    r_chan[mask] += rim[mask] * 45
    g_chan[mask] += rim[mask] * 120
    b_chan[mask] += rim[mask] * 210
    
    a_chan[mask] = 255
    
    p_pixels[..., 0] = np.clip(r_chan, 0, 255).astype(np.uint8)
    p_pixels[..., 1] = np.clip(g_chan, 0, 255).astype(np.uint8)
    p_pixels[..., 2] = np.clip(b_chan, 0, 255).astype(np.uint8)
    p_pixels[..., 3] = a_chan.astype(np.uint8)
    
    planet_img = Image.fromarray(p_pixels, mode='RGBA')
    img.paste(planet_img, (cx - radius, cy - radius), planet_img)
    
    # 3. Celestial Incursion Debris Ring / Planetary Rings
    ring_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(ring_layer)
    
    # Draw tilted elliptical rings
    ring_inner = radius * 1.25
    ring_outer = radius * 1.85
    tilt_rad = math.radians(24)
    
    # Draw concentric particle ring arcs
    for step in range(120):
        r_dist = ring_inner + (ring_outer - ring_inner) * (step / 120.0)
        # Intensity profile with gaps like Saturn / celestial debris
        density = math.sin((step / 120.0) * math.pi) ** 1.5
        if 48 <= step <= 56: # Cassini division gap
            continue
        alpha = int(density * 130)
        
        # Color gradient: icy cyan to amber dust
        col = (
            int(150 + 90 * (step / 120.0)),
            int(190 + 50 * (step / 120.0)),
            int(255 - 40 * (step / 120.0)),
            alpha
        )
        
        # Ellipse bounding box before rotation
        rx = r_dist
        ry = r_dist * 0.28
        r_draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=col, width=2)
        
    # Rotate ring layer
    ring_layer = ring_layer.rotate(24, resample=Image.BICUBIC, center=(cx, cy))
    
    # Composite: mask back of ring behind planet, front of ring in front
    # For a clean celestial look, composite ring with screen blend
    img = Image.alpha_composite(img, ring_layer)
    img.save('assets/another_earth_planet.png')
    print("Created assets/another_earth_planet.png")

def create_midground_floating_ruins():
    w, h = 1920, 720
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Floating astral landmasses & shattered sanctum ruins
    islands = [
        # (cx, cy, scale, rot)
        (340, 360, 1.2, -6),
        (680, 280, 0.75, 4),
        (1020, 220, 0.65, -3),
        (1380, 320, 1.05, 7),
        (1680, 410, 0.9, -5),
        (850, 460, 0.5, 12),
        (180, 220, 0.45, -8),
    ]
    
    for cx, cy, sc, rot in islands:
        # Create an individual floating island with shattered stone facets
        iw, ih = int(360 * sc), int(260 * sc)
        isl = Image.new('RGBA', (iw, ih), (0, 0, 0, 0))
        idraw = ImageDraw.Draw(isl)
        
        mcx, mcy = iw // 2, ih // 2
        # Jagged floating asteroid/island polygon
        pts = [
            (mcx - 140*sc, mcy - 10*sc),
            (mcx - 110*sc, mcy - 60*sc),
            (mcx - 40*sc, mcy - 70*sc),
            (mcx + 50*sc, mcy - 65*sc),
            (mcx + 130*sc, mcy - 20*sc),
            (mcx + 145*sc, mcy + 25*sc),
            (mcx + 80*sc, mcy + 85*sc),
            (mcx + 10*sc, mcy + 115*sc),
            (mcx - 70*sc, mcy + 80*sc),
            (mcx - 130*sc, mcy + 30*sc),
        ]
        
        # Base dark astral rock
        idraw.polygon(pts, fill=(24, 18, 46, 240), outline=(50, 36, 85, 255))
        
        # Stone facets and cracks
        idraw.line([(mcx - 40*sc, mcy - 70*sc), (mcx + 10*sc, mcy + 115*sc)], fill=(40, 28, 70, 200), width=2)
        idraw.line([(mcx + 50*sc, mcy - 65*sc), (mcx + 80*sc, mcy + 85*sc)], fill=(34, 24, 60, 200), width=2)
        
        # Upper Sanctum architecture silhouette (arches, pillars, crumbled walls)
        arch_top = mcy - 65*sc
        idraw.rectangle([mcx - 50*sc, arch_top - 50*sc, mcx - 38*sc, arch_top], fill=(36, 26, 68, 255))
        idraw.rectangle([mcx - 10*sc, arch_top - 60*sc, mcx + 2*sc, arch_top], fill=(38, 28, 72, 255))
        idraw.rectangle([mcx + 30*sc, arch_top - 45*sc, mcx + 42*sc, arch_top], fill=(34, 24, 65, 255))
        idraw.polygon([(mcx - 55*sc, arch_top - 50*sc), (mcx + 47*sc, arch_top - 45*sc), (mcx + 47*sc, arch_top - 38*sc), (mcx - 55*sc, arch_top - 42*sc)], fill=(48, 34, 88, 255))
        
        # Glowing mystical fissure veins on the rock
        vein_pts = [
            (mcx - 80*sc, mcy + 10*sc),
            (mcx - 30*sc, mcy + 25*sc),
            (mcx + 20*sc, mcy + 20*sc),
            (mcx + 70*sc, mcy + 55*sc),
            (mcx + 10*sc, mcy + 80*sc)
        ]
        idraw.line(vein_pts, fill=(190, 85, 230, 180), width=int(2*sc))
        idraw.line(vein_pts, fill=(240, 180, 255, 230), width=1)
        
        # Rim highlight from cosmic background
        idraw.line(pts[:5], fill=(130, 80, 190, 150), width=int(2*sc))
        
        # Rotate & paste
        isl = isl.rotate(rot, resample=Image.BICUBIC)
        img.paste(isl, (int(cx - iw//2), int(cy - ih//2)), isl)
        
    img.save('assets/midground_floating_ruins.png')
    print("Created assets/midground_floating_ruins.png")

def create_mystic_ground_fracture():
    w, h = 1920, 520
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 1. Perspective Reality Platform Base
    # Deep layered obsidian rock shelf with perspective
    base_poly = [
        (0, 110),
        (220, 95),
        (480, 115),
        (760, 90),
        (1040, 112),
        (1340, 88),
        (1620, 108),
        (1920, 92),
        (1920, h),
        (0, h)
    ]
    
    # Gradient fill for stone depth
    for y in range(85, h):
        ratio = (y - 85) / float(h - 85)
        r = int(18 + 10 * (1 - ratio))
        g = int(12 + 8 * (1 - ratio))
        b = int(38 + 18 * (1 - ratio))
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    
    # Mask stone outline
    mask = Image.new('L', (w, h), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.polygon(base_poly, fill=255)
    img.putalpha(mask)
    draw = ImageDraw.Draw(img)
    
    # 2. Flagstone tiles & perspective seam fissures
    for x in range(120, w, 180):
        # Fractured tile edges running down in perspective
        x_bot = x + int((x - w/2) * 0.45)
        draw.line([(x, 105), (x_bot, h)], fill=(10, 6, 24, 210), width=3)
        draw.line([(x-1, 105), (x_bot-1, h)], fill=(45, 30, 75, 120), width=1)
        
    for y in [160, 240, 340, 440]:
        # Horizontal tile fractures
        pts = [(x, y + int(12 * math.sin(x * 0.02))) for x in range(0, w, 40)]
        draw.line(pts, fill=(10, 6, 24, 210), width=3)
        draw.line([(p[0], p[1]-1) for p in pts], fill=(55, 35, 90, 130), width=1)
        
    # 3. Glowing Reality Seam & Eldritch Runes
    # Central incursion fissure where Doctor Strange and Wanda's realities clash
    fissure_pts = [
        (w//2, 90),
        (w//2 - 25, 170),
        (w//2 + 35, 260),
        (w//2 - 15, 360),
        (w//2 + 20, h)
    ]
    # Outer glow
    for width, col in [(18, (190, 70, 210, 45)), (10, (230, 100, 240, 90)), (4, (255, 180, 255, 180)), (2, (255, 255, 255, 240))]:
        draw.line(fissure_pts, fill=col, width=width)
        
    # Branching cracks left (Doctor Strange gold magic) and right (Wanda crimson magic)
    left_branch = [(w//2 - 25, 170), (w//2 - 140, 220), (w//2 - 260, 210), (w//2 - 380, 270)]
    right_branch = [(w//2 + 35, 260), (w//2 + 160, 290), (w//2 + 290, 270), (w//2 + 420, 330)]
    
    # Left gold eldritch energy veins
    draw.line(left_branch, fill=(255, 170, 60, 80), width=8)
    draw.line(left_branch, fill=(255, 215, 120, 190), width=3)
    draw.line(left_branch, fill=(255, 255, 230, 240), width=1)
    
    # Right crimson chaos energy veins
    draw.line(right_branch, fill=(255, 30, 60, 80), width=8)
    draw.line(right_branch, fill=(255, 90, 110, 190), width=3)
    draw.line(right_branch, fill=(255, 220, 230, 240), width=1)
    
    # 4. Runic Inscriptions on the stone floor
    for rad, cx_pos, col in [(90, w//2 - 380, (255, 180, 70, 70)), (90, w//2 + 380, (255, 50, 80, 70))]:
        draw.ellipse([cx_pos - rad, 250 - rad*0.35, cx_pos + rad, 250 + rad*0.35], outline=col, width=2)
        draw.ellipse([cx_pos - rad*0.7, 250 - rad*0.25, cx_pos + rad*0.7, 250 + rad*0.25], outline=col, width=1)
        
    img.save('assets/mystic_ground_fracture.png')
    print("Created assets/mystic_ground_fracture.png")

def create_foreground_rift_shards():
    w, h = 1920, 1080
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 1. Left Giant Foreground Spire
    left_spire = [
        (-40, h + 30),
        (-30, h * 0.40),
        (110, h * 0.58),
        (170, h * 0.72),
        (260, h * 0.88),
        (310, h + 30)
    ]
    draw.polygon(left_spire, fill=(8, 5, 18, 250), outline=(22, 14, 40, 255))
    draw.line(left_spire[1:4], fill=(70, 45, 110, 120), width=3)
    
    # 2. Right Giant Foreground Spire
    right_spire = [
        (w + 40, h + 30),
        (w + 30, h * 0.38),
        (w - 90, h * 0.52),
        (w - 180, h * 0.70),
        (w - 280, h * 0.86),
        (w - 320, h + 30)
    ]
    draw.polygon(right_spire, fill=(8, 5, 18, 250), outline=(22, 14, 40, 255))
    draw.line(right_spire[1:4], fill=(85, 35, 75, 120), width=3)
    
    # 3. Floating Translucent Mirror Dimension Crystal Shards
    shards = [
        # (cx, cy, [(dx, dy)...], color, highlight)
        (140, 320, [(-35, -70), (25, -45), (45, 60), (-20, 80), (-45, 10)], (50, 30, 85, 140), (180, 150, 255, 200)),
        (380, 180, [(-20, -50), (30, -30), (15, 40), (-25, 25)], (65, 35, 95, 120), (210, 180, 255, 190)),
        (280, 680, [(-40, -60), (35, -35), (40, 50), (-30, 45)], (40, 25, 70, 150), (170, 140, 240, 180)),
        (w - 220, 260, [(-30, -60), (40, -40), (25, 55), (-35, 40)], (70, 25, 60, 140), (255, 150, 190, 200)),
        (w - 420, 190, [(-25, -45), (20, -25), (35, 35), (-15, 50)], (60, 22, 50, 120), (255, 140, 170, 180)),
        (w - 310, 710, [(-45, -50), (30, -40), (45, 60), (-20, 50)], (45, 20, 45, 150), (240, 130, 160, 180)),
        (w // 2 - 280, 120, [(-20, -35), (25, -20), (15, 30), (-20, 25)], (55, 35, 80, 110), (200, 170, 255, 160)),
        (w // 2 + 320, 140, [(-25, -30), (20, -25), (30, 30), (-15, 35)], (65, 25, 55, 110), (240, 150, 180, 160)),
    ]
    
    for cx, cy, poly_rel, col, hi_col in shards:
        pts = [(cx + dx, cy + dy) for dx, dy in poly_rel]
        draw.polygon(pts, fill=col, outline=(hi_col[0], hi_col[1], hi_col[2], 140))
        # Specular glint across the faceted mirror glass
        draw.line([pts[0], pts[2]], fill=hi_col, width=2)
        
    img.save('assets/foreground_rift_shards.png')
    print("Created assets/foreground_rift_shards.png")

if __name__ == '__main__':
    create_cosmic_nebula_back()
    create_another_earth_planet()
    create_midground_floating_ruins()
    create_mystic_ground_fracture()
    create_foreground_rift_shards()
