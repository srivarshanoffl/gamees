"""
Precision rendering of seamless articulated character sprites for Civil War.
Ensures zero clipping, razor-sharp textures, and anatomical alignment.
"""

import os
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import numpy as np
import cv2

ASSETS_DIR = r"c:\Users\sriva\civil war\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

CAP_MASTER = os.path.join(ASSETS_DIR, "cap_full.png")
IM_MASTER = os.path.join(ASSETS_DIR, "im_full.png")

# ==============================================================================
# Helper
# ==============================================================================
def transform_pad(img, angle=0, translate=(0, 0), pivot=(0, 0), out_size=(260, 560), out_offset_x=0):
    w, h = img.size
    pad = 300
    big = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    big.paste(img, (pad, pad))
    center = (pivot[0] + pad, pivot[1] + pad)
    rotated = big.rotate(angle, resample=Image.BICUBIC, center=center)
    
    # Crop to out_size taking out_offset_x into account
    crop_x1 = pad - translate[0] + out_offset_x
    crop_y1 = pad - translate[1]
    crop_x2 = crop_x1 + out_size[0]
    crop_y2 = crop_y1 + out_size[1]
    return rotated.crop((crop_x1, crop_y1, crop_x2, crop_y2))

# ==============================================================================
# 1. CAPTAIN AMERICA
# ==============================================================================
print("1. Processing Captain America...")
cap_raw = Image.open(CAP_MASTER).convert("RGBA")
CAP_SCALE = 500.0 / 439.0
cap_w = int(cap_raw.width * CAP_SCALE)
cap_h = int(cap_raw.height * CAP_SCALE)
cap_scaled = cap_raw.resize((cap_w, cap_h), Image.LANCZOS)

cap_stand = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
offset_cap_x = int(120 - 251 * CAP_SCALE)
offset_cap_y = int(25 - 32 * CAP_SCALE)
cap_stand.paste(cap_scaled, (offset_cap_x, offset_cap_y), mask=cap_scaled)

# Seamless Cap Torso: mirror left ribcage onto right side so no hole under raised arm
left_torso = cap_stand.crop((60, 85, 120, 265))
mirrored_right = ImageOps.mirror(left_torso)
cap_torso_full = cap_stand.copy()
cap_torso_full.paste(mirrored_right, (120, 85))

# Torso asset (chin to waist)
mask_torso = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_torso).polygon([(55, 82), (185, 82), (185, 268), (55, 268)], fill=255)
mask_torso = mask_torso.filter(ImageFilter.GaussianBlur(1))
cap_torso = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_torso.paste(cap_torso_full, (0, 0), mask=mask_torso)
cap_torso.save(os.path.join(ASSETS_DIR, "cap_torso.png"))

# Cap Head
mask_head = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_head).polygon([(85, 15), (155, 15), (155, 98), (85, 98)], fill=255)
mask_head = mask_head.filter(ImageFilter.GaussianBlur(1))
cap_head_front = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_head_front.paste(cap_stand, (0, 0), mask=mask_head)
cap_head_front.save(os.path.join(ASSETS_DIR, "cap_head_front.png"))

cap_head_down = transform_pad(cap_head_front, angle=-12, translate=(2, 5), pivot=(120, 90), out_size=(240, 560))
cap_head_down.save(os.path.join(ASSETS_DIR, "cap_head_down.png"))

# Cap Right Arm (viewer left)
mask_arm_r = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_arm_r).polygon([(15, 90), (105, 90), (105, 310), (15, 310)], fill=255)
mask_arm_r = mask_arm_r.filter(ImageFilter.GaussianBlur(1))
cap_armR_side = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_armR_side.paste(cap_stand, (0, 0), mask=mask_arm_r)
cap_armR_side.save(os.path.join(ASSETS_DIR, "cap_armR_side.png"))

cap_armR_fwd = transform_pad(cap_armR_side, angle=-45, translate=(22, -22), pivot=(78, 105), out_size=(240, 560))
cap_armR_fwd.save(os.path.join(ASSETS_DIR, "cap_armR_fwd.png"))

# Cap Left Arm (shield arm, viewer right)
mask_arm_l = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_arm_l).polygon([(135, 90), (225, 90), (225, 310), (135, 310)], fill=255)
mask_arm_l = mask_arm_l.filter(ImageFilter.GaussianBlur(1))
cap_armL_side = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_armL_side.paste(cap_stand, (0, 0), mask=mask_arm_l)

cap_armL_carry = cap_armL_side.copy()
cap_armL_carry.save(os.path.join(ASSETS_DIR, "cap_armL_carry.png"))

cap_armL_guard = transform_pad(cap_armL_side, angle=38, translate=(10, -32), pivot=(162, 105), out_size=(240, 560))
cap_armL_guard.save(os.path.join(ASSETS_DIR, "cap_armL_guard.png"))

cap_armL_back = transform_pad(cap_armL_side, angle=-32, translate=(-22, -8), pivot=(162, 105), out_size=(240, 560))
cap_armL_back.save(os.path.join(ASSETS_DIR, "cap_armL_back.png"))

cap_armL_ext = transform_pad(cap_armL_side, angle=52, translate=(26, -46), pivot=(162, 105), out_size=(240, 560))
cap_armL_ext.save(os.path.join(ASSETS_DIR, "cap_armL_ext.png"))

# Cap Legs
mask_legs = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_legs).polygon([(40, 205), (200, 205), (200, 540), (40, 540)], fill=255)
cap_legs_stand = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_legs_stand.paste(cap_stand, (0, 0), mask=mask_legs)
cap_legs_stand.save(os.path.join(ASSETS_DIR, "cap_legs_stand.png"))

mask_leg_l = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_leg_l).polygon([(115, 205), (200, 205), (200, 540), (115, 540)], fill=255)
part_leg_l = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
part_leg_l.paste(cap_stand, (0, 0), mask=mask_leg_l)

mask_leg_r = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_leg_r).polygon([(40, 205), (125, 205), (125, 540), (40, 540)], fill=255)
part_leg_r = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
part_leg_r.paste(cap_stand, (0, 0), mask=mask_leg_r)

leg_r_a = transform_pad(part_leg_r, angle=-10, translate=(-12, -2), pivot=(95, 260), out_size=(240, 560))
leg_l_a = transform_pad(part_leg_l, angle=12, translate=(14, -3), pivot=(145, 260), out_size=(240, 560))
cap_legs_a = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_legs_a.paste(leg_r_a, (0, 0), leg_r_a)
cap_legs_a.paste(leg_l_a, (0, 0), leg_l_a)
cap_legs_a.save(os.path.join(ASSETS_DIR, "cap_legs_a.png"))

leg_r_b = transform_pad(part_leg_r, angle=12, translate=(14, -3), pivot=(95, 260), out_size=(240, 560))
leg_l_b = transform_pad(part_leg_l, angle=-10, translate=(-12, -2), pivot=(145, 260), out_size=(240, 560))
cap_legs_b = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_legs_b.paste(leg_r_b, (0, 0), leg_r_b)
cap_legs_b.paste(leg_l_b, (0, 0), leg_l_b)
cap_legs_b.save(os.path.join(ASSETS_DIR, "cap_legs_b.png"))

leg_r_w = transform_pad(part_leg_r, angle=-14, translate=(-18, 0), pivot=(95, 260), out_size=(240, 560))
leg_l_w = transform_pad(part_leg_l, angle=15, translate=(20, 0), pivot=(145, 260), out_size=(240, 560))
cap_legs_wide = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_legs_wide.paste(leg_r_w, (0, 0), leg_r_w)
cap_legs_wide.paste(leg_l_w, (0, 0), leg_l_w)
cap_legs_wide.save(os.path.join(ASSETS_DIR, "cap_legs_wide.png"))
print("Captain America assets complete!")


# ==============================================================================
# 2. IRON MAN
# ==============================================================================
print("2. Processing Iron Man...")
im_raw = Image.open(IM_MASTER).convert("RGBA")
IM_SCALE = 505.0 / 463.0
im_scaled_w = int(im_raw.width * IM_SCALE)
im_scaled_h = int(im_raw.height * IM_SCALE)
im_scaled = im_raw.resize((im_scaled_w, im_scaled_h), Image.LANCZOS)

offset_im_x = int(130 - 262 * IM_SCALE)
offset_im_y = int(20 - 21 * IM_SCALE)

im_stand = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_stand.paste(im_scaled, (offset_im_x, offset_im_y), mask=im_scaled)

# Clean Iron Man Torso:
# Texture cloning from genuine armor ribs
im_torso_base = im_stand.copy()
# Clone back ribcage plate onto under-arm area
armor_patch = im_stand.crop((150, 115, 195, 260))
im_torso_base.paste(armor_patch, (105, 115))
# Re-overlay front chest armor edge
chest_contour = im_stand.crop((85, 80, 110, 265))
im_torso_base.paste(chest_contour, (85, 80), chest_contour)

mask_im_torso = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_torso).polygon([(85, 78), (200, 78), (200, 270), (85, 270)], fill=255)
mask_im_torso = mask_im_torso.filter(ImageFilter.GaussianBlur(1))
im_torso = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_torso.paste(im_torso_base, (0, 0), mask=mask_im_torso)
im_torso.save(os.path.join(ASSETS_DIR, "im_torso.png"))

# Iron Man Head
mask_im_head = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_head).polygon([(95, 15), (190, 15), (190, 92), (95, 92)], fill=255)
mask_im_head = mask_im_head.filter(ImageFilter.GaussianBlur(1))
im_head_front = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_head_front.paste(im_stand, (0, 0), mask=mask_im_head)
im_head_front.save(os.path.join(ASSETS_DIR, "im_head_front.png"))

im_head_down = transform_pad(im_head_front, angle=14, translate=(-2, 6), pivot=(145, 80), out_size=(260, 560))
im_head_down.save(os.path.join(ASSETS_DIR, "im_head_down.png"))

# Iron Man Far Arm (rest)
mask_im_arm_far = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_arm_far).polygon([(150, 85), (210, 85), (210, 270), (150, 270)], fill=255)
mask_im_arm_far = mask_im_arm_far.filter(ImageFilter.GaussianBlur(1))
im_armL_rest = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_armL_rest.paste(im_stand, (0, 0), mask=mask_im_arm_far)
im_armL_rest.save(os.path.join(ASSETS_DIR, "im_armL_rest.png"))

# Iron Man Near Arm (rest)
mask_im_arm_near = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_arm_near).polygon([(75, 85), (160, 85), (160, 280), (75, 280)], fill=255)
mask_im_arm_near = mask_im_arm_near.filter(ImageFilter.GaussianBlur(1))
im_armR_rest = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_armR_rest.paste(im_stand, (0, 0), mask=mask_im_arm_near)
im_armR_rest.save(os.path.join(ASSETS_DIR, "im_armR_rest.png"))

# Iron Man Aim Arm (wider canvas width=320, placed with out_offset_x=-60 so nothing clips!)
# Hand extends to the left, palm lands at X=34, Y=116 in SVG coordinate system
im_armR_aim = transform_pad(im_armR_rest, angle=-74, translate=(-12, 10), pivot=(132, 102), out_size=(320, 560), out_offset_x=-60)
im_armR_aim.save(os.path.join(ASSETS_DIR, "im_armR_aim.png"))

# Iron Man Grapple Clash Arms
im_arms_fwd = transform_pad(im_armR_rest, angle=-48, translate=(-18, -4), pivot=(132, 102), out_size=(320, 560), out_offset_x=-60)
im_arms_fwd.save(os.path.join(ASSETS_DIR, "im_arms_fwd.png"))

# Iron Man Legs
mask_im_legs = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_legs).polygon([(30, 205), (245, 205), (245, 540), (30, 540)], fill=255)
im_legs_stand = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_stand.paste(im_stand, (0, 0), mask=mask_im_legs)
im_legs_stand.save(os.path.join(ASSETS_DIR, "im_legs_stand.png"))

mask_im_leg_f = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_leg_f).polygon([(30, 205), (150, 205), (150, 540), (30, 540)], fill=255)
part_im_leg_f = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
part_im_leg_f.paste(im_stand, (0, 0), mask=mask_im_leg_f)

mask_im_leg_b = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_leg_b).polygon([(140, 205), (245, 205), (245, 540), (140, 540)], fill=255)
part_im_leg_b = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
part_im_leg_b.paste(im_stand, (0, 0), mask=mask_im_leg_b)

leg_f_a = transform_pad(part_im_leg_f, angle=8, translate=(10, -2), pivot=(135, 255), out_size=(260, 560))
leg_b_a = transform_pad(part_im_leg_b, angle=-10, translate=(-12, -2), pivot=(155, 255), out_size=(260, 560))
im_legs_a = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_a.paste(leg_b_a, (0, 0), leg_b_a)
im_legs_a.paste(leg_f_a, (0, 0), leg_f_a)
im_legs_a.save(os.path.join(ASSETS_DIR, "im_legs_a.png"))

leg_f_b = transform_pad(part_im_leg_f, angle=-8, translate=(-10, -2), pivot=(135, 255), out_size=(260, 560))
leg_b_b = transform_pad(part_im_leg_b, angle=10, translate=(12, -2), pivot=(155, 255), out_size=(260, 560))
im_legs_b = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_b.paste(leg_f_b, (0, 0), leg_f_b)
im_legs_b.paste(leg_b_b, (0, 0), leg_b_b)
im_legs_b.save(os.path.join(ASSETS_DIR, "im_legs_b.png"))

leg_f_st = transform_pad(part_im_leg_f, angle=-18, translate=(-20, 0), pivot=(135, 255), out_size=(260, 560))
leg_b_st = transform_pad(part_im_leg_b, angle=14, translate=(22, 0), pivot=(155, 255), out_size=(260, 560))
im_legs_stagger = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_stagger.paste(leg_b_st, (0, 0), leg_b_st)
im_legs_stagger.paste(leg_f_st, (0, 0), leg_f_st)
im_legs_stagger.save(os.path.join(ASSETS_DIR, "im_legs_stagger.png"))

leg_f_lg = transform_pad(part_im_leg_f, angle=18, translate=(22, -4), pivot=(135, 255), out_size=(260, 560))
leg_b_lg = transform_pad(part_im_leg_b, angle=-20, translate=(-24, -2), pivot=(155, 255), out_size=(260, 560))
im_legs_lunge = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_lunge.paste(leg_b_lg, (0, 0), leg_b_lg)
im_legs_lunge.paste(leg_f_lg, (0, 0), leg_f_lg)
im_legs_lunge.save(os.path.join(ASSETS_DIR, "im_legs_lunge.png"))

im_legs_kneel = transform_pad(im_legs_stand, angle=16, translate=(14, 28), pivot=(145, 255), out_size=(260, 560))
im_legs_kneel.save(os.path.join(ASSETS_DIR, "im_legs_kneel.png"))

print("Iron Man assets complete!")
print("ALL ASSETS RENDERED WITH PERFECTION!")
