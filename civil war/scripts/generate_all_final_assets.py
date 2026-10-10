"""
Production asset generator for Civil War characters.
Generates all poses with clean inpainting, anatomical joints, and no holes or seams.
"""

import os
import cv2
import numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFilter

ASSETS_DIR = r"c:\Users\sriva\civil war\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

CAP_MASTER = os.path.join(ASSETS_DIR, "cap_full.png")
IM_MASTER = os.path.join(ASSETS_DIR, "im_full.png")

def rotate_layer(img, angle, pivot, translate=(0, 0)):
    w, h = img.size
    pad = 300
    big = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    big.paste(img, (pad, pad))
    center = (pivot[0] + pad, pivot[1] + pad)
    rotated = big.rotate(angle, resample=Image.BICUBIC, center=center)
    res = rotated.crop((pad - translate[0], pad - translate[1], pad - translate[0] + w, pad - translate[1] + h))
    return res

# ==============================================================================
# 1. CAPTAIN AMERICA
# ==============================================================================
print("Generating Captain America production poses...")
cap_raw = Image.open(CAP_MASTER).convert("RGBA")
CAP_SCALE = 500.0 / 439.0
cap_w = int(cap_raw.width * CAP_SCALE)
cap_h = int(cap_raw.height * CAP_SCALE)
cap_scaled = cap_raw.resize((cap_w, cap_h), Image.LANCZOS)

cap_idle = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
offset_cap_x = int(120 - 251 * CAP_SCALE)
offset_cap_y = int(25 - 32 * CAP_SCALE)
cap_idle.paste(cap_scaled, (offset_cap_x, offset_cap_y), mask=cap_scaled)
cap_idle.save(os.path.join(ASSETS_DIR, "cap_idle.png"))

# Mirrored torso for right side
left_torso = cap_idle.crop((60, 85, 120, 260))
mirrored_right = ImageOps.mirror(left_torso)

# Solid full torso body
cap_solid_body = cap_idle.copy()
# Blend mirrored right over the ribcage under the arm (X: 120 to 175, Y: 85 to 260)
mask_blend = Image.new("L", (55, 175), 255)
mask_blend = mask_blend.filter(ImageFilter.GaussianBlur(1))
cap_solid_body.paste(mirrored_right.crop((0, 0, 55, 175)), (120, 85), mask=mask_blend)

# Crop left arm cleanly
mask_arm_l = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_arm_l).polygon([(152, 95), (225, 95), (225, 305), (152, 305)], fill=255)
mask_arm_l = mask_arm_l.filter(ImageFilter.GaussianBlur(1))
cap_arm_l = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_arm_l.paste(cap_idle, (0, 0), mask=mask_arm_l)

# Crop right arm cleanly
mask_arm_r = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_arm_r).polygon([(20, 95), (88, 95), (88, 305), (20, 305)], fill=255)
mask_arm_r = mask_arm_r.filter(ImageFilter.GaussianBlur(1))
cap_arm_r = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_arm_r.paste(cap_idle, (0, 0), mask=mask_arm_r)

# Head
mask_head = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_head).polygon([(85, 20), (155, 20), (155, 95), (85, 95)], fill=255)
cap_head = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_head.paste(cap_idle, (0, 0), mask=mask_head)

# Legs
mask_leg_l = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_leg_l).polygon([(118, 250), (200, 250), (200, 540), (118, 540)], fill=255)
cap_leg_l = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_leg_l.paste(cap_idle, (0, 0), mask=mask_leg_l)

mask_leg_r = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_leg_r).polygon([(40, 250), (122, 250), (122, 540), (40, 540)], fill=255)
cap_leg_r = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_leg_r.paste(cap_idle, (0, 0), mask=mask_leg_r)

# 1. Block Pose (left arm raised guarding chest at 194, 212)
arm_guard = rotate_layer(cap_arm_l, angle=26, pivot=(162, 105), translate=(6, -18))
cap_block = cap_solid_body.copy()
cap_block.paste(arm_guard, (0, 0), arm_guard)
cap_block.save(os.path.join(ASSETS_DIR, "cap_block.png"))

# 2. Windup Pose (left arm cocked back, right arm reaching forward)
arm_back = rotate_layer(cap_arm_l, angle=-30, pivot=(162, 105), translate=(-18, -10))
arm_fwd = rotate_layer(cap_arm_r, angle=-40, pivot=(76, 105), translate=(18, -18))
cap_windup = cap_solid_body.copy()
cap_windup.paste(arm_back, (0, 0), arm_back)
cap_windup.paste(arm_fwd, (0, 0), arm_fwd)
cap_windup.save(os.path.join(ASSETS_DIR, "cap_windup.png"))

# 3. Throw Pose (left arm extended forward)
arm_throw = rotate_layer(cap_arm_l, angle=45, pivot=(162, 105), translate=(22, -35))
cap_throw = cap_solid_body.copy()
cap_throw.paste(arm_throw, (0, 0), arm_throw)
cap_throw.save(os.path.join(ASSETS_DIR, "cap_throw.png"))

# 4. Stride A
leg_r_step = rotate_layer(cap_leg_r, angle=-12, pivot=(95, 260), translate=(-12, -2))
leg_l_step = rotate_layer(cap_leg_l, angle=14, pivot=(145, 260), translate=(16, -3))
cap_stride_a = cap_idle.copy()
# Erase lower legs
mask_erase_l = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_erase_l).rectangle((40, 265, 200, 540), fill=255)
arr_sa = np.array(cap_stride_a)
arr_sa[:, :, 3] = np.where(np.array(mask_erase_l) > 100, 0, arr_sa[:, :, 3])
cap_stride_a = Image.fromarray(arr_sa)
cap_stride_a.paste(leg_r_step, (0, 0), leg_r_step)
cap_stride_a.paste(leg_l_step, (0, 0), leg_l_step)
cap_stride_a.save(os.path.join(ASSETS_DIR, "cap_stride_a.png"))

# 5. Stride B
leg_r_step_b = rotate_layer(cap_leg_r, angle=14, pivot=(95, 260), translate=(16, -3))
leg_l_step_b = rotate_layer(cap_leg_l, angle=-12, pivot=(145, 260), translate=(-12, -2))
cap_stride_b = Image.fromarray(arr_sa).copy()
cap_stride_b.paste(leg_r_step_b, (0, 0), leg_r_step_b)
cap_stride_b.paste(leg_l_step_b, (0, 0), leg_l_step_b)
cap_stride_b.save(os.path.join(ASSETS_DIR, "cap_stride_b.png"))

# 6. Aftermath (head bowed down)
head_down = rotate_layer(cap_head, angle=-14, pivot=(120, 90), translate=(2, 6))
cap_aftermath = cap_idle.copy()
mask_erase_head = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_erase_head).rectangle((85, 20, 155, 95), fill=255)
arr_after = np.array(cap_aftermath)
arr_after[:, :, 3] = np.where(np.array(mask_erase_head) > 100, 0, arr_after[:, :, 3])
cap_aftermath = Image.fromarray(arr_after)
cap_aftermath.paste(head_down, (0, 0), head_down)
cap_aftermath.save(os.path.join(ASSETS_DIR, "cap_aftermath.png"))

print("All Captain America poses generated successfully!")

# ==============================================================================
# 2. IRON MAN
# ==============================================================================
print("Generating Iron Man production poses...")
im_raw = Image.open(IM_MASTER).convert("RGBA")
IM_SCALE = 505.0 / 463.0
im_w = int(im_raw.width * IM_SCALE)
im_h = int(im_raw.height * IM_SCALE)
im_scaled = im_raw.resize((im_w, im_h), Image.LANCZOS)

im_stand = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
offset_im_x = int(130 - 262 * IM_SCALE)
offset_im_y = int(20 - 21 * IM_SCALE)
im_stand.paste(im_scaled, (offset_im_x, offset_im_y), mask=im_scaled)
im_stand.save(os.path.join(ASSETS_DIR, "im_stand.png"))

# Inpainted clean torso
arr_im = np.array(im_stand)
rgb_im = arr_im[:, :, :3]
alpha_im = arr_im[:, :, 3]
mask_inpaint = np.zeros((560, 260), dtype=np.uint8)
mask_inpaint[95:275, 88:155] = 255
mask_inpaint[alpha_im == 0] = 0
inpainted_rgb = cv2.inpaint(rgb_im, mask_inpaint, inpaintRadius=9, flags=cv2.INPAINT_TELEA)
im_torso_clean = Image.fromarray(np.dstack([inpainted_rgb, alpha_im]))

# Crop near arm from stand
mask_arm = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_arm).polygon([(110, 88), (155, 88), (145, 180), (135, 275), (80, 275), (85, 175), (105, 95)], fill=255)
mask_arm = mask_arm.filter(ImageFilter.GaussianBlur(1))
im_arm_near = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_arm_near.paste(im_stand, (0, 0), mask=mask_arm)

# Shoulder bell cap (to overlay on joint)
shoulder_cap = im_stand.crop((112, 86, 150, 125))

# 1. Aim Pose (arm forward pointing at Cap, palm at X~34, Y~116)
pad = 250
big_arm = Image.new("RGBA", (260 + pad*2, 560 + pad*2), (0, 0, 0, 0))
big_arm.paste(im_arm_near, (pad, pad))
rot_arm = big_arm.rotate(-75, resample=Image.BICUBIC, center=(132+pad, 102+pad))
arm_aim_res = rot_arm.crop((pad - 12, pad - 5, pad - 12 + 260, pad - 5 + 560))

im_aim = im_torso_clean.copy()
im_aim.paste(arm_aim_res, (0, 0), arm_aim_res)
# Cover shoulder joint with shoulder cap
im_aim.paste(shoulder_cap, (112, 86), shoulder_cap)

# Palm repulsor glow at (34, 116)
glow = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
dg = ImageDraw.Draw(glow)
dg.ellipse((22, 104, 46, 128), fill=(180, 235, 255, 255))
glow_b = glow.filter(ImageFilter.GaussianBlur(5))
dg.ellipse((27, 109, 41, 123), fill=(255, 255, 255, 255))
im_aim.paste(glow_b, (0, 0), glow_b)
im_aim.paste(glow, (0, 0), glow)
im_aim.save(os.path.join(ASSETS_DIR, "im_aim.png"))

# 2. Clash Pose (arms forward grappling Cap's shield)
rot_clash = big_arm.rotate(-52, resample=Image.BICUBIC, center=(132+pad, 102+pad))
arm_clash_res = rot_clash.crop((pad - 10, pad - 5, pad - 10 + 260, pad - 5 + 560))
im_clash = im_torso_clean.copy()
im_clash.paste(arm_clash_res, (0, 0), arm_clash_res)
im_clash.paste(shoulder_cap, (112, 86), shoulder_cap)
im_clash.save(os.path.join(ASSETS_DIR, "im_clash.png"))

# 3. Stride A & B
mask_im_leg_f = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_leg_f).polygon([(30, 235), (150, 235), (150, 540), (30, 540)], fill=255)
im_leg_f = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_leg_f.paste(im_stand, (0, 0), mask=mask_im_leg_f)

mask_im_leg_b = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_leg_b).polygon([(140, 235), (245, 235), (245, 540), (140, 540)], fill=255)
im_leg_b = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_leg_b.paste(im_stand, (0, 0), mask=mask_im_leg_b)

leg_f_step_a = rotate_layer(im_leg_f, angle=8, pivot=(135, 255), translate=(10, -2))
leg_b_step_a = rotate_layer(im_leg_b, angle=-10, pivot=(155, 255), translate=(-12, -2))
im_stride_a = im_stand.copy()
mask_im_erase_l = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_erase_l).rectangle((30, 260, 245, 540), fill=255)
arr_ima = np.array(im_stride_a)
arr_ima[:, :, 3] = np.where(np.array(mask_im_erase_l) > 100, 0, arr_ima[:, :, 3])
im_stride_a = Image.fromarray(arr_ima)
im_stride_a.paste(leg_b_step_a, (0, 0), leg_b_step_a)
im_stride_a.paste(leg_f_step_a, (0, 0), leg_f_step_a)
im_stride_a.save(os.path.join(ASSETS_DIR, "im_stride_a.png"))

leg_f_step_b = rotate_layer(im_leg_f, angle=-8, pivot=(135, 255), translate=(-10, -2))
leg_b_step_b = rotate_layer(im_leg_b, angle=10, pivot=(155, 255), translate=(12, -2))
im_stride_b = Image.fromarray(arr_ima).copy()
im_stride_b.paste(leg_b_step_b, (0, 0), leg_b_step_b)
im_stride_b.paste(leg_f_step_b, (0, 0), leg_f_step_b)
im_stride_b.save(os.path.join(ASSETS_DIR, "im_stride_b.png"))

# 4. Stagger (recoiling back from shield)
im_stagger = rotate_layer(im_stand, angle=10, pivot=(150, 480), translate=(18, 0))
im_stagger.save(os.path.join(ASSETS_DIR, "im_stagger.png"))

# 5. Down / Kneel
mask_legs_all = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_legs_all).rectangle((30, 235, 245, 540), fill=255)
im_legs_all = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_all.paste(im_stand, (0, 0), mask=mask_legs_all)
legs_down = rotate_layer(im_legs_all, angle=18, pivot=(145, 260), translate=(16, 32))

mask_im_head = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_head).rectangle((95, 15, 190, 88), fill=255)
im_head_crop = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_head_crop.paste(im_stand, (0, 0), mask=mask_im_head)
head_down_im = rotate_layer(im_head_crop, angle=16, pivot=(145, 80), translate=(-4, 10))

im_down = im_stand.copy()
mask_erase_dh = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_erase_dh).rectangle((30, 260, 245, 540), fill=255)
ImageDraw.Draw(mask_erase_dh).rectangle((95, 15, 190, 88), fill=255)
arr_d = np.array(im_down)
arr_d[:, :, 3] = np.where(np.array(mask_erase_dh) > 100, 0, arr_d[:, :, 3])
im_down = Image.fromarray(arr_d)
im_down.paste(legs_down, (0, 0), legs_down)
im_down.paste(head_down_im, (0, 0), head_down_im)
im_down.save(os.path.join(ASSETS_DIR, "im_down.png"))

print("All Iron Man poses generated successfully!")
print("ALL PRODUCTION ASSETS GENERATED!")
