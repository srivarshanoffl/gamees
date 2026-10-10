"""
Articulated character asset generator with seamless overlapping anatomical joints.
Produces pixel-perfect registered pose layers for Captain America (240x560)
and Iron Man (260x560).
"""

import os
from PIL import Image, ImageFilter
import numpy as np

ASSETS_DIR = r"c:\Users\sriva\civil war\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

CAP_FULL_PATH = os.path.join(ASSETS_DIR, "cap_full.png")
IM_FULL_PATH = os.path.join(ASSETS_DIR, "im_full.png")

def extract_with_mask(src_img, poly_pts, feather=2):
    from PIL import ImageDraw
    w, h = src_img.size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(poly_pts, fill=255)
    if feather > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(feather))
    
    # Intersect with source alpha
    src_alpha = src_img.split()[3]
    mask = Image.fromarray(np.minimum(np.array(mask), np.array(src_alpha)))
    
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(src_img, (0, 0), mask=mask)
    return out

def transform_part(img, angle=0, translate=(0, 0), pivot=(0, 0)):
    w, h = img.size
    pad = 250
    big = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    big.paste(img, (pad, pad))
    center = (pivot[0] + pad, pivot[1] + pad)
    
    rotated = big.rotate(angle, resample=Image.BICUBIC, center=center)
    res = rotated.crop((pad - translate[0], pad - translate[1], pad - translate[0] + w, pad - translate[1] + h))
    return res

# ==============================================================================
# 1. CAPTAIN AMERICA
# ==============================================================================
print("--- Processing Captain America with Seamless Overlap ---")
cap_raw = Image.open(CAP_FULL_PATH).convert("RGBA")

CAP_SCALE = 500.0 / 439.0
cap_scaled_w = int(cap_raw.width * CAP_SCALE)
cap_scaled_h = int(cap_raw.height * CAP_SCALE)
cap_scaled = cap_raw.resize((cap_scaled_w, cap_scaled_h), Image.LANCZOS)

cap_base = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
offset_x = int(120 - 251 * CAP_SCALE)
offset_y = int(25 - 32 * CAP_SCALE)
cap_base.paste(cap_scaled, (offset_x, offset_y), mask=cap_scaled)

# 1. LEGS (drawn behind torso, from Y=210 down to 535)
poly_legs = [
    (40, 205), (200, 205),
    (200, 540), (40, 540)
]
cap_legs_stand = extract_with_mask(cap_base, poly_legs, feather=1)

# Individual legs for walking
poly_leg_l = [(115, 205), (200, 205), (200, 540), (115, 540)]
poly_leg_r = [(40, 205), (125, 205), (125, 540), (40, 540)]
part_leg_l = extract_with_mask(cap_base, poly_leg_l, feather=2)
part_leg_r = extract_with_mask(cap_base, poly_leg_r, feather=2)

leg_r_a = transform_part(part_leg_r, angle=-10, translate=(-12, -2), pivot=(95, 260))
leg_l_a = transform_part(part_leg_l, angle=12, translate=(14, -3), pivot=(145, 260))
cap_legs_a = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_legs_a.paste(leg_r_a, (0, 0), leg_r_a)
cap_legs_a.paste(leg_l_a, (0, 0), leg_l_a)

leg_r_b = transform_part(part_leg_r, angle=12, translate=(14, -3), pivot=(95, 260))
leg_l_b = transform_part(part_leg_l, angle=-10, translate=(-12, -2), pivot=(145, 260))
cap_legs_b = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_legs_b.paste(leg_r_b, (0, 0), leg_r_b)
cap_legs_b.paste(leg_l_b, (0, 0), leg_l_b)

leg_r_w = transform_part(part_leg_r, angle=-14, translate=(-18, 0), pivot=(95, 260))
leg_l_w = transform_part(part_leg_l, angle=15, translate=(20, 0), pivot=(145, 260))
cap_legs_wide = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_legs_wide.paste(leg_r_w, (0, 0), leg_r_w)
cap_legs_wide.paste(leg_l_w, (0, 0), leg_l_w)

# 2. FAR RIGHT ARM (drawn behind torso)
# Deep shoulder overlap into chest
poly_arm_r = [
    (15, 90), (100, 90),
    (100, 310), (15, 310)
]
cap_armR_side = extract_with_mask(cap_base, poly_arm_r, feather=1)
cap_armR_fwd = transform_part(cap_armR_side, angle=-50, translate=(25, -25), pivot=(78, 105))

# 3. TORSO (overlaps on top of legs and far arm; extends from chin Y=85 down to belt/pelvis Y=265)
poly_torso = [
    (65, 82), (175, 82),
    (175, 265), (65, 265)
]
cap_torso = extract_with_mask(cap_base, poly_torso, feather=1)

# 4. HEAD (overlaps on top of torso; neck extends down to Y=98 behind collar)
poly_head = [(85, 15), (155, 15), (155, 98), (85, 98)]
cap_head_front = extract_with_mask(cap_base, poly_head, feather=1)
cap_head_down = transform_part(cap_head_front, angle=-12, translate=(2, 5), pivot=(120, 90))

# 5. NEAR LEFT ARM (drawn in front of torso)
poly_arm_l = [
    (140, 90), (225, 90),
    (225, 310), (140, 310)
]
cap_armL_side = extract_with_mask(cap_base, poly_arm_l, feather=1)
cap_armL_carry = cap_armL_side.copy()
cap_armL_guard = transform_part(cap_armL_side, angle=40, translate=(12, -38), pivot=(162, 105))
cap_armL_back = transform_part(cap_armL_side, angle=-35, translate=(-25, -10), pivot=(162, 105))
cap_armL_ext = transform_part(cap_armL_side, angle=55, translate=(30, -52), pivot=(162, 105))

# Save Cap
cap_head_front.save(os.path.join(ASSETS_DIR, "cap_head_front.png"))
cap_head_down.save(os.path.join(ASSETS_DIR, "cap_head_down.png"))
cap_torso.save(os.path.join(ASSETS_DIR, "cap_torso.png"))
cap_armR_side.save(os.path.join(ASSETS_DIR, "cap_armR_side.png"))
cap_armR_fwd.save(os.path.join(ASSETS_DIR, "cap_armR_fwd.png"))
cap_armL_carry.save(os.path.join(ASSETS_DIR, "cap_armL_carry.png"))
cap_armL_guard.save(os.path.join(ASSETS_DIR, "cap_armL_guard.png"))
cap_armL_back.save(os.path.join(ASSETS_DIR, "cap_armL_back.png"))
cap_armL_ext.save(os.path.join(ASSETS_DIR, "cap_armL_ext.png"))
cap_legs_stand.save(os.path.join(ASSETS_DIR, "cap_legs_stand.png"))
cap_legs_a.save(os.path.join(ASSETS_DIR, "cap_legs_a.png"))
cap_legs_b.save(os.path.join(ASSETS_DIR, "cap_legs_b.png"))
cap_legs_wide.save(os.path.join(ASSETS_DIR, "cap_legs_wide.png"))
print("Saved seamless Captain America parts!")


# ==============================================================================
# 2. IRON MAN
# ==============================================================================
print("--- Processing Iron Man with Seamless Overlap ---")
im_raw = Image.open(IM_FULL_PATH).convert("RGBA")

IM_SCALE = 505.0 / 463.0
im_scaled_w = int(im_raw.width * IM_SCALE)
im_scaled_h = int(im_raw.height * IM_SCALE)
im_scaled = im_raw.resize((im_scaled_w, im_scaled_h), Image.LANCZOS)

offset_im_x = int(130 - 262 * IM_SCALE)
offset_im_y = int(20 - 21 * IM_SCALE)

im_base = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_base.paste(im_scaled, (offset_im_x, offset_im_y), mask=im_scaled)

# 1. LEGS (drawn behind upper body; from Y=210 down to 540)
poly_im_legs = [
    (30, 205), (245, 205),
    (245, 540), (30, 540)
]
im_legs_stand = extract_with_mask(im_base, poly_im_legs, feather=1)

poly_im_leg_f = [(30, 205), (150, 205), (150, 540), (30, 540)]
poly_im_leg_b = [(140, 205), (245, 205), (245, 540), (140, 540)]
part_im_leg_f = extract_with_mask(im_base, poly_im_leg_f, feather=2)
part_im_leg_b = extract_with_mask(im_base, poly_im_leg_b, feather=2)

leg_f_a = transform_part(part_im_leg_f, angle=8, translate=(10, -2), pivot=(135, 255))
leg_b_a = transform_part(part_im_leg_b, angle=-10, translate=(-12, -2), pivot=(155, 255))
im_legs_a = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_a.paste(leg_b_a, (0, 0), leg_b_a)
im_legs_a.paste(leg_f_a, (0, 0), leg_f_a)

leg_f_b = transform_part(part_im_leg_f, angle=-8, translate=(-10, -2), pivot=(135, 255))
leg_b_b = transform_part(part_im_leg_b, angle=10, translate=(12, -2), pivot=(155, 255))
im_legs_b = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_b.paste(leg_f_b, (0, 0), leg_f_b)
im_legs_b.paste(leg_b_b, (0, 0), leg_b_b)

leg_f_st = transform_part(part_im_leg_f, angle=-18, translate=(-20, 0), pivot=(135, 255))
leg_b_st = transform_part(part_im_leg_b, angle=14, translate=(22, 0), pivot=(155, 255))
im_legs_stagger = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_stagger.paste(leg_b_st, (0, 0), leg_b_st)
im_legs_stagger.paste(leg_f_st, (0, 0), leg_f_st)

leg_f_lg = transform_part(part_im_leg_f, angle=18, translate=(22, -4), pivot=(135, 255))
leg_b_lg = transform_part(part_im_leg_b, angle=-20, translate=(-24, -2), pivot=(155, 255))
im_legs_lunge = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_lunge.paste(leg_b_lg, (0, 0), leg_b_lg)
im_legs_lunge.paste(leg_f_lg, (0, 0), leg_f_lg)

im_legs_kneel = transform_part(im_legs_stand, angle=16, translate=(14, 28), pivot=(145, 255))

# 2. FAR LEFT ARM (background arm)
poly_im_arm_far = [(150, 85), (210, 85), (210, 270), (150, 270)]
im_armL_rest = extract_with_mask(im_base, poly_im_arm_far, feather=1)

# 3. TORSO (extends from chin Y=80 down to waist/pelvis Y=260)
poly_im_torso = [
    (90, 80), (195, 80),
    (195, 260), (90, 260)
]
im_torso = extract_with_mask(im_base, poly_im_torso, feather=1)

# 4. HEAD (extends into neck collar)
poly_im_head = [(95, 15), (190, 15), (190, 92), (95, 92)]
im_head_front = extract_with_mask(im_base, poly_im_head, feather=1)
im_head_down = transform_part(im_head_front, angle=14, translate=(-2, 6), pivot=(145, 80))

# 5. NEAR RIGHT ARM
poly_im_arm_near = [
    (75, 85), (160, 85),
    (160, 280), (75, 280)
]
im_armR_rest = extract_with_mask(im_base, poly_im_arm_near, feather=1)
# Aim horizontally to the left at Cap
im_armR_aim = transform_part(im_armR_rest, angle=-72, translate=(-45, -20), pivot=(125, 100))
# Grapple clash forward
im_arms_fwd = transform_part(im_armR_rest, angle=-50, translate=(-30, -10), pivot=(125, 100))

# Save Iron Man
im_head_front.save(os.path.join(ASSETS_DIR, "im_head_front.png"))
im_head_down.save(os.path.join(ASSETS_DIR, "im_head_down.png"))
im_torso.save(os.path.join(ASSETS_DIR, "im_torso.png"))
im_armL_rest.save(os.path.join(ASSETS_DIR, "im_armL_rest.png"))
im_armR_rest.save(os.path.join(ASSETS_DIR, "im_armR_rest.png"))
im_armR_aim.save(os.path.join(ASSETS_DIR, "im_armR_aim.png"))
im_arms_fwd.save(os.path.join(ASSETS_DIR, "im_arms_fwd.png"))
im_legs_stand.save(os.path.join(ASSETS_DIR, "im_legs_stand.png"))
im_legs_a.save(os.path.join(ASSETS_DIR, "im_legs_a.png"))
im_legs_b.save(os.path.join(ASSETS_DIR, "im_legs_b.png"))
im_legs_stagger.save(os.path.join(ASSETS_DIR, "im_legs_stagger.png"))
im_legs_lunge.save(os.path.join(ASSETS_DIR, "im_legs_lunge.png"))
im_legs_kneel.save(os.path.join(ASSETS_DIR, "im_legs_kneel.png"))
print("Saved seamless Iron Man parts!")
print("ALL ASSETS REGENERATED SEAMLESSLY!")
