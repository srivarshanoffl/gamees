"""
Build Movie-Grade Cinematic VFX Assets for Doctor Strange vs Wanda: The Fractured Dimension
Using authentic NASA James Webb Space Telescope Cosmic Cliffs, Apollo 17 Blue Marble,
NASA Black Marble Earth at Night, and Apollo 14 Lunar Rock photography.
"""
import urllib.request
import io
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageChops

def fetch_image(url):
    print(f"Downloading {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'DoctorStrangeApp/1.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return Image.open(io.BytesIO(resp.read()))

def build_cosmic_background(carina_img):
    print("Building cinematic cosmic background from JWST Carina Nebula...")
    bg = carina_img.convert("RGB")
    w, h = bg.size
    target_w, target_h = 1920, 1080
    
    scale = max(target_w / w, target_h / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    bg = bg.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    bg = bg.crop((left, top, left + target_w, top + target_h))
    
    arr = np.array(bg, dtype=np.float32) / 255.0
    
    # MCU Multiverse Color Grade: Deep cosmic indigos, mystic magenta dust, golden stellar nurseries
    arr = np.power(arr, 1.12)
    r = arr[:, :, 0] * 1.15 + 0.03 * (1.0 - arr[:, :, 0])
    g = arr[:, :, 1] * 0.98
    b = arr[:, :, 2] * 1.30 + 0.05 * (1.0 - arr[:, :, 2])
    graded = np.stack([r, g, b], axis=-1)
    graded = np.clip(graded, 0.0, 1.0)
    
    # Cinematic Anamorphic Vignette: darker corners, lit center
    Y, X = np.ogrid[:target_h, :target_w]
    cx, cy = target_w * 0.5, target_h * 0.42
    dist_sq = ((X - cx) / (target_w * 0.60)) ** 2 + ((Y - cy) / (target_h * 0.60)) ** 2
    vignette = 1.0 - 0.40 * np.clip(dist_sq - 0.15, 0.0, 1.0)
    
    # Anamorphic horizontal flare streaks
    flare = np.exp(-((Y - target_h * 0.38) ** 2) / 18000.0) * 0.12
    flare_3 = np.stack([flare * 0.8, flare * 0.9, flare * 1.2], axis=-1)
    
    final_arr = graded * np.stack([vignette] * 3, axis=-1) + flare_3
    final_arr = (np.clip(final_arr, 0.0, 1.0) * 255.0).astype(np.uint8)
    
    final_bg = Image.fromarray(final_arr, mode="RGB")
    final_bg.save("assets/another_earth_cosmic_bg.png", quality=95)
    print("Saved assets/another_earth_cosmic_bg.png")

def build_photorealistic_earth(blue_marble, black_marble):
    print("Building photorealistic Another Earth with glowing atmosphere and city lights...")
    bm_orig = blue_marble.convert("RGB")
    bm_cx, bm_cy, bm_r = 965, 976, 638
    bm_crop = bm_orig.crop((bm_cx - bm_r, bm_cy - bm_r, bm_cx + bm_r, bm_cy + bm_r))
    
    blk_orig = black_marble.convert("RGB")
    blk_cx, blk_cy, blk_r = 968, 951, 718
    blk_crop = blk_orig.crop((blk_cx - blk_r, blk_cy - blk_r, blk_cx + blk_r, blk_cy + blk_r))
    
    earth_size = 760
    bm_crop = bm_crop.resize((earth_size, earth_size), Image.Resampling.LANCZOS)
    blk_crop = blk_crop.resize((earth_size, earth_size), Image.Resampling.LANCZOS)
    
    bm_arr = np.array(bm_crop, dtype=np.float32) / 255.0
    blk_arr = np.array(blk_crop, dtype=np.float32) / 255.0
    
    canvas_size = 1100
    cx, cy = canvas_size / 2.0, canvas_size / 2.0
    R = earth_size / 2.0
    
    Y, X = np.meshgrid(np.arange(canvas_size), np.arange(canvas_size), indexing='ij')
    dx = (X - cx)
    dy = (Y - cy)
    dist = np.sqrt(dx**2 + dy**2)
    
    disc_mask = dist <= R
    
    nx = np.zeros((canvas_size, canvas_size), dtype=np.float32)
    ny = np.zeros((canvas_size, canvas_size), dtype=np.float32)
    nz = np.zeros((canvas_size, canvas_size), dtype=np.float32)
    
    nx[disc_mask] = dx[disc_mask] / R
    ny[disc_mask] = dy[disc_mask] / R
    nz[disc_mask] = np.sqrt(np.maximum(0.0, 1.0 - (dist[disc_mask] / R)**2))
    
    lx, ly, lz = -0.58, -0.42, 0.69
    norm_l = math.sqrt(lx*lx + ly*ly + lz*lz)
    lx, ly, lz = lx/norm_l, ly/norm_l, lz/norm_l
    
    dot = nx * lx + ny * ly + nz * lz
    
    day_fac = 1.0 / (1.0 + np.exp(-10.0 * (dot - 0.05)))
    day_fac_3 = np.stack([day_fac] * 3, axis=-1)
    
    pad = (canvas_size - earth_size) // 2
    full_day = np.zeros((canvas_size, canvas_size, 3), dtype=np.float32)
    full_night = np.zeros((canvas_size, canvas_size, 3), dtype=np.float32)
    
    full_day[pad:pad+earth_size, pad:pad+earth_size] = bm_arr
    full_night[pad:pad+earth_size, pad:pad+earth_size] = blk_arr
    
    night_boost = full_night.copy() * 2.2
    night_boost[:, :, 0] *= 1.3
    night_boost[:, :, 1] *= 1.15
    
    diffuse = np.clip(dot, 0.0, 1.0)
    diffuse_3 = np.stack([diffuse] * 3, axis=-1)
    lit_day = full_day * (0.12 + 0.88 * diffuse_3)
    
    sunset_band = np.exp(-((dot - 0.05) ** 2) / 0.035)
    sunset_glow = np.stack([sunset_band * 1.0, sunset_band * 0.45, sunset_band * 0.10], axis=-1)
    
    chaos_heat = np.clip(nx * 0.8 + 0.2, 0.0, 1.0) * np.exp(-((nz - 0.2) ** 2) / 0.1) * 0.4
    chaos_glow = np.stack([chaos_heat * 1.0, chaos_heat * 0.15, chaos_heat * 0.45], axis=-1)
    
    planet_rgb = lit_day * day_fac_3 + night_boost * (1.0 - day_fac_3) + sunset_glow * 0.6 + chaos_glow
    
    fresnel = np.clip(1.0 - nz, 0.0, 1.0)
    limb = (1.0 - 0.35 * (fresnel ** 2))
    planet_rgb *= np.stack([limb] * 3, axis=-1)
    
    aa_alpha = np.clip((R - dist) + 0.5, 0.0, 1.0)
    
    planet_arr = np.zeros((canvas_size, canvas_size, 4), dtype=np.float32)
    planet_arr[:, :, :3] = planet_rgb
    planet_arr[:, :, 3] = aa_alpha
    
    planet_body = Image.fromarray((np.clip(planet_arr, 0.0, 1.0) * 255.0).astype(np.uint8), mode="RGBA")
    
    atmo_arr = np.zeros((canvas_size, canvas_size, 4), dtype=np.float32)
    dist_outside = np.maximum(0.0, dist - R)
    corona_falloff = np.exp(-dist_outside / 14.0) * (dist < R + 55)
    
    angle = np.arctan2(dy, dx)
    sun_angle = math.atan2(ly, lx)
    angle_diff = np.abs(np.arctan2(np.sin(angle - sun_angle), np.cos(angle - sun_angle)))
    
    atmo_cyan = np.array([0.35, 0.78, 1.0])
    atmo_violet = np.array([0.65, 0.35, 0.95])
    
    t_angle = np.clip(angle_diff / math.pi, 0.0, 1.0)
    for c in range(3):
        col_c = atmo_cyan[c] * (1.0 - t_angle) + atmo_violet[c] * t_angle
        atmo_arr[:, :, c] = col_c * corona_falloff * 1.4
    atmo_arr[:, :, 3] = corona_falloff * 0.85
    
    atmo_img = Image.fromarray((np.clip(atmo_arr, 0.0, 1.0) * 255.0).astype(np.uint8), mode="RGBA")
    atmo_img = atmo_img.filter(ImageFilter.GaussianBlur(radius=6))
    
    planet_with_atmo = Image.alpha_composite(atmo_img, planet_body)
    
    # Accretion Debris Ring
    ring_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(ring_img)
    
    rx_out, ry_out = R * 1.58, R * 0.48
    rx_in, ry_in = R * 1.18, R * 0.34
    tilt = math.radians(-26)
    
    np.random.seed(42)
    for _ in range(1800):
        ang = np.random.uniform(0, 2 * np.pi)
        rad_p = np.random.uniform(0, 1) ** 0.85
        crx = rx_in + (rx_out - rx_in) * rad_p
        cry = ry_in + (ry_out - ry_in) * rad_p
        
        raw_x = crx * math.cos(ang)
        raw_y = cry * math.sin(ang)
        
        px = cx + raw_x * math.cos(tilt) - raw_y * math.sin(tilt)
        py = cy + raw_x * math.sin(tilt) + raw_y * math.cos(tilt)
        
        sz = np.random.uniform(0.8, 2.6)
        if np.random.random() < 0.65:
            col = (255, 205, 120, int(np.random.uniform(150, 255)))
        else:
            col = (200, 150, 255, int(np.random.uniform(130, 230)))
        rdraw.ellipse([px - sz, py - sz, px + sz, py + sz], fill=col)
        
    ring_img = ring_img.filter(ImageFilter.GaussianBlur(radius=0.7))
    
    tilt_plane = (X - cx) * math.sin(tilt) + (Y - cy) * math.cos(tilt)
    ring_arr = np.array(ring_img)
    
    back_ring_arr = ring_arr.copy()
    front_ring_arr = ring_arr.copy()
    
    back_ring_arr[tilt_plane >= 0] = 0
    front_ring_arr[tilt_plane < 0] = 0
    
    back_ring = Image.fromarray(back_ring_arr, mode="RGBA")
    front_ring = Image.fromarray(front_ring_arr, mode="RGBA")
    
    final_comp = Image.alpha_composite(back_ring, planet_with_atmo)
    final_comp = Image.alpha_composite(final_comp, front_ring)
    
    final_comp = final_comp.resize((1000, 1000), Image.Resampling.LANCZOS)
    final_comp.save("assets/another_earth_planet.png", format="PNG")
    print("Saved photorealistic assets/another_earth_planet.png")

def build_cinematic_floating_ruins(boulder_img):
    print("Building photorealistic floating Sanctum ruins from NASA rock textures...")
    w, h = 1920, 720
    # Crop ONLY the solid boulder section of Apollo 14 (y=750..1850)
    b_crop = boulder_img.convert("RGB").crop((0, 750, 1920, 1850))
    b_crop = b_crop.resize((w, h), Image.Resampling.LANCZOS)
    b_arr = np.array(b_crop, dtype=np.float32) / 255.0
    
    # High-contrast weathered granite
    b_arr = np.power(b_arr, 1.35) * 0.70
    b_arr[:, :, 0] *= 0.95
    b_arr[:, :, 2] *= 1.25 # dark cosmic obsidian tone
    
    out_arr = np.zeros((h, w, 4), dtype=np.float32)
    
    monoliths = [
        (180, 360, 1.25, "arch"),
        (440, 270, 0.95, "spire"),
        (760, 320, 0.85, "monolith"),
        (1180, 260, 1.20, "temple"),
        (1480, 330, 0.90, "spire"),
        (1750, 290, 1.15, "arch"),
    ]
    
    mask_img = Image.new("L", (w, h), 0)
    mdraw = ImageDraw.Draw(mask_img)
    
    for mx, my, sc, mtype in monoliths:
        if mtype == "arch":
            pts = [
                (mx - 110*sc, my + 130*sc),
                (mx - 120*sc, my - 30*sc),
                (mx - 85*sc, my - 120*sc),
                (mx - 20*sc, my - 150*sc),
                (mx + 45*sc, my - 130*sc),
                (mx + 105*sc, my - 60*sc),
                (mx + 115*sc, my + 135*sc),
                (mx + 60*sc, my + 140*sc),
                (mx + 50*sc, my - 35*sc),
                (mx - 35*sc, my - 45*sc),
                (mx - 50*sc, my + 135*sc),
            ]
        elif mtype == "temple":
            pts = [
                (mx - 135*sc, my + 115*sc),
                (mx - 125*sc, my - 40*sc),
                (mx - 10*sc, my - 130*sc),
                (mx + 130*sc, my - 35*sc),
                (mx + 115*sc, my + 120*sc),
                (mx + 45*sc, my + 115*sc),
                (mx + 25*sc, my - 10*sc),
                (mx - 25*sc, my - 15*sc),
                (mx - 45*sc, my + 115*sc),
            ]
        elif mtype == "spire":
            pts = [
                (mx - 45*sc, my + 140*sc),
                (mx - 55*sc, my + 15*sc),
                (mx - 15*sc, my - 135*sc),
                (mx + 15*sc, my - 165*sc),
                (mx + 35*sc, my - 105*sc),
                (mx + 48*sc, my + 35*sc),
                (mx + 38*sc, my + 145*sc),
            ]
        else:
            pts = [
                (mx - 105*sc, my + 95*sc),
                (mx - 120*sc, my - 75*sc),
                (mx - 55*sc, my - 110*sc),
                (mx + 75*sc, my - 120*sc),
                (mx + 125*sc, my - 55*sc),
                (mx + 110*sc, my + 80*sc),
                (mx + 10*sc, my + 100*sc),
            ]
        mdraw.polygon(pts, fill=255)
        
    mask_arr = np.array(mask_img, dtype=np.float32) / 255.0
    out_arr[:, :, :3] = b_arr
    out_arr[:, :, 3] = mask_arr
    
    ruins_img = Image.fromarray((np.clip(out_arr, 0.0, 1.0) * 255.0).astype(np.uint8), mode="RGBA")
    
    effects_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    edraw = ImageDraw.Draw(effects_img)
    
    for mx, my, sc, mtype in monoliths:
        rim_col = (255, 195, 90, 220) if mx < 960 else (255, 65, 110, 220)
        rune_col = (255, 215, 130, 240) if mx < 960 else (255, 110, 150, 240)
        
        for ox, oy in [(-20*sc, -15*sc), (15*sc, 20*sc), (-5*sc, 50*sc)]:
            rx, ry = mx + ox, my + oy
            edraw.line([(rx, ry), (rx + 18*sc, ry - 14*sc)], fill=rune_col, width=2)
            edraw.line([(rx + 18*sc, ry - 14*sc), (rx + 28*sc, ry + 12*sc)], fill=rune_col, width=2)
            edraw.ellipse([rx + 6*sc, ry - 4*sc, rx + 16*sc, ry + 6*sc], outline=rune_col, width=2)
            
    effects_glow = effects_img.filter(ImageFilter.GaussianBlur(radius=5))
    ruins_with_effects = Image.alpha_composite(ruins_img, effects_glow)
    ruins_with_effects = Image.alpha_composite(ruins_with_effects, effects_img)
    
    ruins_with_effects.save("assets/midground_floating_ruins.png", format="PNG")
    print("Saved photorealistic assets/midground_floating_ruins.png")

def make_fractal_crack(p1, p2, depth=4, displacement=25):
    """Generate organic fractal lightning / rock fracture coordinates."""
    if depth == 0:
        return [p1, p2]
    mid_x = (p1[0] + p2[0]) / 2.0
    mid_y = (p1[1] + p2[1]) / 2.0
    # Displace perpendicular to segment
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    length = math.sqrt(dx*dx + dy*dy) + 1e-5
    nx = -dy / length
    ny = dx / length
    offset = random.uniform(-displacement, displacement)
    mid_point = (mid_x + nx * offset, mid_y + ny * offset)
    left_branch = make_fractal_crack(p1, mid_point, depth - 1, displacement * 0.55)
    right_branch = make_fractal_crack(mid_point, p2, depth - 1, displacement * 0.55)
    return left_branch[:-1] + right_branch

def build_cinematic_ground_platform(boulder_img):
    print("Building photorealistic mystic ground fracture platform with organic molten fissures...")
    w, h = 1920, 520
    b_crop = boulder_img.convert("RGB").crop((0, 800, 1920, 1850))
    b_crop = b_crop.resize((w, h), Image.Resampling.LANCZOS)
    b_arr = np.array(b_crop, dtype=np.float32) / 255.0
    
    # 3D perspective ground falloff
    Y_grid, X_grid = np.meshgrid(np.arange(h), np.arange(w), indexing='ij')
    y_norm = np.clip((Y_grid - 30) / (h - 30), 0.0, 1.0)
    ground_alpha = y_norm ** 1.8
    
    stone_rgb = b_arr * 0.45
    stone_rgb[:, :, 0] *= 0.92
    stone_rgb[:, :, 2] *= 1.30
    
    ground_arr = np.zeros((h, w, 4), dtype=np.float32)
    ground_arr[:, :, :3] = stone_rgb
    ground_arr[:, :, 3] = ground_alpha * 0.94
    
    base_ground = Image.fromarray((np.clip(ground_arr, 0.0, 1.0) * 255.0).astype(np.uint8), mode="RGBA")
    
    fissure_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fissure_layer)
    
    vanish_x = w * 0.5
    gold_glow = (255, 185, 60, 240)
    crimson_glow = (255, 40, 90, 240)
    core_white = (255, 255, 255, 255)
    
    random.seed(42)
    # Generate organic fractal jagged cracks
    strange_seeds = [
        ((140, h), (vanish_x, 110)),
        ((320, h), (vanish_x, 110)),
        ((50, 480), (380, 360)),
        ((460, h), (680, 280)),
    ]
    wanda_seeds = [
        ((w - 140, h), (vanish_x, 110)),
        ((w - 330, h), (vanish_x, 110)),
        ((w - 50, 470), (w - 380, 350)),
        ((w - 480, h), (w - 700, 280)),
    ]
    
    # Draw Strange molten gold cracks
    for s_start, s_end in strange_seeds:
        crack_pts = make_fractal_crack(s_start, s_end, depth=4, displacement=28)
        for i in range(len(crack_pts) - 1):
            fdraw.line([crack_pts[i], crack_pts[i+1]], fill=gold_glow, width=5)
            fdraw.line([crack_pts[i], crack_pts[i+1]], fill=core_white, width=2)
            
    # Draw Wanda chaos crimson cracks
    for w_start, w_end in wanda_seeds:
        crack_pts = make_fractal_crack(w_start, w_end, depth=4, displacement=28)
        for i in range(len(crack_pts) - 1):
            fdraw.line([crack_pts[i], crack_pts[i+1]], fill=crimson_glow, width=5)
            fdraw.line([crack_pts[i], crack_pts[i+1]], fill=core_white, width=2)
            
    # Central reality clash crack
    central_crack = make_fractal_crack((vanish_x, 110), (vanish_x, h), depth=5, displacement=22)
    for i in range(len(central_crack) - 1):
        fdraw.line([central_crack[i], central_crack[i+1]], fill=(255, 230, 210, 255), width=7)
        fdraw.line([central_crack[i], central_crack[i+1]], fill=core_white, width=3)
        
    fissure_glow = fissure_layer.filter(ImageFilter.GaussianBlur(radius=8))
    fissure_bloom = fissure_layer.filter(ImageFilter.GaussianBlur(radius=2))
    
    final_ground = Image.alpha_composite(base_ground, fissure_glow)
    final_ground = Image.alpha_composite(final_ground, fissure_bloom)
    
    final_ground.save("assets/mystic_ground_fracture.png", format="PNG")
    print("Saved photorealistic assets/mystic_ground_fracture.png")

def build_cinematic_mirror_shards():
    print("Building cinematic mirror dimension refractive glass prisms...")
    w, h = 1920, 1080
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    
    shards = [
        (110, 220, 190, 28, "gold"),
        (190, 610, 250, -16, "gold"),
        (320, 940, 310, 12, "gold"),
        (w - 120, 240, 210, -26, "chaos"),
        (w - 210, 660, 270, 18, "chaos"),
        (w - 310, 960, 320, -14, "chaos"),
        (w * 0.5, 90, 140, 40, "prism"),
    ]
    
    for cx, cy, rad, rot, style in shards:
        shard_canvas = Image.new("RGBA", (rad * 2, rad * 2), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(shard_canvas)
        scx, scy = rad, rad
        
        pts = [
            (scx - rad * 0.45, scy + rad * 0.40),
            (scx - rad * 0.38, scy - rad * 0.48),
            (scx + rad * 0.15, scy - rad * 0.58),
            (scx + rad * 0.52, scy - rad * 0.18),
            (scx + rad * 0.42, scy + rad * 0.46),
            (scx - rad * 0.12, scy + rad * 0.55),
        ]
        
        if style == "gold":
            glass_body = (255, 215, 120, 35)
            rim_light = (255, 235, 160, 220)
        elif style == "chaos":
            glass_body = (255, 85, 130, 35)
            rim_light = (255, 120, 170, 220)
        else:
            glass_body = (180, 210, 255, 30)
            rim_light = (220, 240, 255, 230)
            
        sdraw.polygon(pts, fill=glass_body)
        sdraw.line([pts[0], pts[2]], fill=rim_light, width=1)
        sdraw.line([pts[1], pts[4]], fill=rim_light, width=1)
        sdraw.line([pts[2], pts[5]], fill=rim_light, width=1)
        
        for i in range(len(pts)):
            sdraw.line([pts[i], pts[(i+1)%len(pts)]], fill=rim_light, width=2)
            
        shard_canvas = shard_canvas.rotate(rot, resample=Image.Resampling.BICUBIC, center=(scx, scy))
        img.alpha_composite(shard_canvas, (int(cx - scx), int(cy - scy)))
        
    img.save("assets/foreground_rift_shards.png", format="PNG")
    print("Saved photorealistic assets/foreground_rift_shards.png")

def main():
    print("Starting Movie-Grade VFX Asset Synthesis...")
    carina = fetch_image("http://images-assets.nasa.gov/image/carina_nebula/carina_nebula~large.jpg")
    black_marble = fetch_image("http://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001587/GSFC_20171208_Archive_e001587~large.jpg")
    blue_marble = fetch_image("http://images-assets.nasa.gov/image/as17-148-22727/as17-148-22727~large.jpg")
    boulder = fetch_image("http://images-assets.nasa.gov/image/as14-68-9451/as14-68-9451~large.jpg")
    
    build_cosmic_background(carina)
    build_photorealistic_earth(blue_marble, black_marble)
    build_cinematic_floating_ruins(boulder)
    build_cinematic_ground_platform(boulder)
    build_cinematic_mirror_shards()
    print("All photorealistic movie-grade assets generated successfully!")

if __name__ == "__main__":
    main()
