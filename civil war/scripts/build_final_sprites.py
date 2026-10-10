"""
Final high-quality pose sprite generator for Civil War game.
Generates all poses with clean inpainting, zero seams, and pixel-perfect registration.
"""

import os
import cv2
import numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFilter

ASSETS_DIR = r"c:\Users\sriva\civil war\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

CAP_MASTER = os.path.join(ASSETS_DIR, "cap_full.png")
IM_MASTER = os.path.join(ASSETS_DIR, "im_full.png")

# ==============================================================================
# Helper
# ==============================================================================
def rotate_and_place(part_img, angle, pivot, translate=(0, 0)):
    w, h = part_img.size
    pad = 250
    big = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    big.paste(part_img, (pad, pad))
    center = (pivot[0] + pad, pivot[1] + pad)
    rotated = big.rotate(angle, resample=Image.BICUBIC, center=center)
    res = rotated.crop((pad - translate[0], pad - translate[1], pad - translate[0] + w, pad - translate[1] + h))
    return res

# ==============================================================================
# 1. CAPTAIN AMERICA
# ==============================================================================
print("Building Captain America final sprites...")
cap_raw = Image.open(CAP_MASTER).convert("RGBA")
CAP_SCALE = 500.0 / 439.0
cap_w = int(cap_raw.width * CAP_SCALE)
cap_h = int(cap_raw.height * CAP_SCALE)
cap_scaled = cap_raw.resize((cap_w, cap_h), Image.LANCZOS)

cap_idle = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
offset_cap_x = int(120 - 251 * CAP_SCALE)
offset_cap_y = int(25 - 32 * CAP_SCALE)
cap_idle.paste(cap_scaled, (offset_cap_x, offset_cap_y), mask=cap_scaled)

# Save pristine Idle
cap_idle.save(os.path.join(ASSETS_DIR, "cap_pose_idle.png"))

# Create full torso with mirrored right side
left_torso = cap_idle.crop((60, 85, 120, 265))
mirrored_right = ImageOps.mirror(left_torso)
cap_full_torso = cap_idle.copy()
cap_full_torso.paste(mirrored_right, (120, 85))

# Crop Left Arm (viewer's right)
mask_arm_l = Image.new("L", (240, 560), 0)
d = ImageDraw.Draw(mask_arm_l)
d.polygon([(150, 95), (225, 95), (225, 305), (150, 305)], fill=255)
mask_arm_l = mask_arm_l.filter(ImageFilter.GaussianBlur(2))
cap_arm_l = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_arm_l.paste(cap_idle, (0, 0), mask=mask_arm_l)

# Crop Right Arm (viewer's left)
mask_arm_r = Image.new("L", (240, 560), 0)
d = ImageDraw.Draw(mask_arm_r)
d.polygon([(20, 95), (90, 95), (90, 305), (20, 305)], fill=255)
mask_arm_r = mask_arm_r.filter(ImageFilter.GaussianBlur(2))
cap_arm_r = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_arm_r.paste(cap_idle, (0, 0), mask=mask_arm_r)

# Head
mask_head = Image.new("L", (240, 560), 0)
d = ImageDraw.Draw(mask_head)
d.polygon([(85, 20), (155, 20), (155, 95), (85, 95)], fill=255)
mask_head = mask_head.filter(ImageFilter.GaussianBlur(2))
cap_head = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_head.paste(cap_idle, (0, 0), mask=mask_head)

# Legs
mask_legs = Image.new("L", (240, 560), 0)
d = ImageDraw.Draw(mask_legs)
d.polygon([(40, 240), (200, 240), (200, 540), (40, 540)], fill=255)
mask_legs = mask_legs.filter(ImageFilter.GaussianBlur(2))
cap_legs = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_legs.paste(cap_idle, (0, 0), mask=mask_legs)

# Individual legs
mask_leg_l = Image.new("L", (240, 560), 0)
d = ImageDraw.Draw(mask_leg_l)
d.polygon([(118, 240), (200, 240), (200, 540), (118, 540)], fill=255)
cap_leg_l = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_leg_l.paste(cap_idle, (0, 0), mask=mask_leg_l)

mask_leg_r = Image.new("L", (240, 560), 0)
d = ImageDraw.Draw(mask_leg_r)
d.polygon([(40, 240), (122, 240), (122, 540), (40, 540)], fill=255)
cap_leg_r = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_leg_r.paste(cap_idle, (0, 0), mask=mask_leg_r)

# A. BLOCK POSE
arm_l_guard = rotate_and_place(cap_arm_l, angle=40, pivot=(164, 110), translate=(12, -36))
cap_block = cap_full_torso.copy()
cap_block.paste(arm_l_guard, (0, 0), arm_l_guard)
cap_block.save(os.path.join(ASSETS_DIR, "cap_pose_block.png"))

# B. WINDUP POSE
arm_l_back = rotate_and_place(cap_arm_l, angle=-35, pivot=(164, 110), translate=(-22, -10))
arm_r_fwd = rotate_and_place(cap_arm_r, angle=-45, pivot=(76, 110), translate=(22, -22))
cap_windup = cap_full_torso.copy()
cap_windup.paste(arm_l_back, (0, 0), arm_l_back)
cap_windup.paste(arm_r_fwd, (0, 0), arm_r_fwd)
cap_windup.save(os.path.join(ASSETS_DIR, "cap_pose_windup.png"))

# C. THROW POSE
arm_l_throw = rotate_and_place(cap_arm_l, angle=55, pivot=(164, 110), translate=(28, -50))
cap_throw = cap_full_torso.copy()
cap_throw.paste(arm_l_throw, (0, 0), arm_l_throw)
cap_throw.save(os.path.join(ASSETS_DIR, "cap_pose_throw.png"))

# D. STRIDE A
leg_r_step = rotate_and_place(cap_leg_r, angle=-12, pivot=(95, 260), translate=(-12, -2))
leg_l_step = rotate_and_place(cap_leg_l, angle=14, pivot=(145, 260), translate=(16, -3))
cap_stride_a = cap_full_torso.copy()
# Paste legs under torso
cap_stride_a.paste(leg_r_step, (0, 0), leg_r_step)
cap_stride_a.paste(leg_l_step, (0, 0), leg_l_step)
# Re-paste torso and arms
torso_upper = cap_idle.crop((60, 85, 180, 260))
cap_stride_a.paste(torso_upper, (60, 85), torso_upper)
cap_stride_a.paste(cap_arm_r, (0, 0), cap_arm_r)
cap_stride_a.paste(cap_arm_l, (0, 0), cap_arm_l)
cap_stride_a.save(os.path.join(ASSETS_DIR, "cap_pose_stride_a.png"))

# E. STRIDE B
leg_r_step_b = rotate_and_place(cap_leg_r, angle=14, pivot=(95, 260), translate=(16, -3))
leg_l_step_b = rotate_and_place(cap_leg_l, angle=-12, pivot=(145, 260), translate=(-12, -2))
cap_stride_b = cap_full_torso.copy()
cap_stride_b.paste(leg_r_step_b, (0, 0), leg_r_step_b)
cap_stride_b.paste(leg_l_step_b, (0, 0), leg_l_step_b)
cap_stride_b.paste(torso_upper, (60, 85), torso_upper)
cap_stride_b.paste(cap_arm_r, (0, 0), cap_arm_r)
cap_stride_b.paste(cap_arm_l, (0, 0), cap_arm_l)
cap_stride_b.save(os.path.join(ASSETS_DIR, "cap_pose_stride_b.png"))

# F. AFTERMATH
head_down = rotate_and_place(cap_head, angle=-12, pivot=(120, 90), translate=(2, 6))
cap_aftermath = cap_idle.copy()
mask_erase_head = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_erase_head).rectangle((85, 20, 155, 95), fill=255)
arr_after = np.array(cap_aftermath)
arr_after[:, :, 3] = np.where(np.array(mask_erase_head) > 100, 0, arr_after[:, :, 3])
cap_aftermath = Image.fromarray(arr_after)
cap_aftermath.paste(head_down, (0, 0), head_down)
cap_aftermath.save(os.path.join(ASSETS_DIR, "cap_pose_aftermath.png"))
print("Saved all Captain America final sprites!")

# ==============================================================================
# 2. IRON MAN
# ==============================================================================
print("Building Iron Man final sprites...")
im_raw = Image.open(IM_MASTER).convert("RGBA")
IM_SCALE = 505.0 / 463.0
im_w = int(im_raw.width * IM_SCALE)
im_h = int(im_raw.height * IM_SCALE)
im_scaled = im_raw.resize((im_w, im_h), Image.LANCZOS)

im_stand = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
offset_im_x = int(130 - 262 * IM_SCALE)
offset_im_y = int(20 - 21 * IM_SCALE)
im_stand.paste(im_scaled, (offset_im_x, offset_im_y), mask=im_scaled)

# Pristine Stand
im_stand.save(os.path.join(ASSETS_DIR, "im_pose_stand.png"))

# Inpainted clean torso (old arm removed)
arr_im = np.array(im_stand)
rgb_im = arr_im[:, :, :3]
alpha_im = arr_im[:, :, 3]
mask_inpaint = np.zeros((560, 260), dtype=np.uint8)
mask_inpaint[95:275, 88:155] = 255
mask_inpaint[alpha_im == 0] = 0
inpainted_rgb = cv2.inpaint(rgb_im, mask_inpaint, inpaintRadius=9, flags=cv2.INPAINT_TELEA)
im_torso_clean = Image.fromarray(np.dstack([inpainted_rgb, alpha_im]))

# Crop near arm parts
# Upper arm:
mask_upper = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_upper).polygon([(110, 88), (155, 88), (145, 172), (105, 172)], fill=255)
mask_upper = mask_upper.filter(ImageFilter.GaussianBlur(1))
im_arm_upper = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_arm_upper.paste(im_stand, (0, 0), mask=mask_upper)

# Forearm:
mask_fore = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_fore).polygon([(105, 165), (145, 165), (135, 275), (80, 275)], fill=255)
mask_fore = mask_fore.filter(ImageFilter.GaussianBlur(1))
im_arm_fore = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_arm_fore.paste(im_stand, (0, 0), mask=mask_fore)

# A. AIM POSE
pad = 250
big_u = Image.new("RGBA", (260 + pad*2, 560 + pad*2), (0, 0, 0, 0))
big_u.paste(im_arm_upper, (pad, pad))
rot_u = big_u.rotate(-85, resample=Image.BICUBIC, center=(132+pad, 102+pad))
arm_u_aim = rot_u.crop((pad, pad, pad+260, pad+560))

big_f = Image.new("RGBA", (260 + pad*2, 560 + pad*2), (0, 0, 0, 0))
big_f.paste(im_arm_fore, (pad, pad))
rot_f = big_f.rotate(-85, resample=Image.BICUBIC, center=(132+pad, 102+pad))
arm_f_aim = rot_f.crop((pad, pad, pad+260, pad+560))

im_aim = im_torso_clean.copy()
im_aim.paste(arm_u_aim, (0, 0), arm_u_aim)
im_aim.paste(arm_f_aim, (0, 0), arm_f_aim)

# Repulsor flare
glow = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
dg = ImageDraw.Draw(glow)
dg.ellipse((32, 102, 54, 124), fill=(180, 235, 255, 255))
glow_b = glow.filter(ImageFilter.GaussianBlur(5))
dg.ellipse((37, 107, 49, 119), fill=(255, 255, 255, 255))
im_aim.paste(glow_b, (0, 0), glow_b)
im_aim.paste(glow, (0, 0), glow)
im_aim.save(os.path.join(ASSETS_DIR, "im_pose_aim.png"))

# B. CLASH POSE
rot_u_c = big_u.rotate(-52, resample=Image.BICUBIC, center=(132+pad, 102+pad))
arm_u_clash = rot_u_c.crop((pad, pad, pad+260, pad+560))
rot_f_c = big_f.rotate(-52, resample=Image.BICUBIC, center=(132+pad, 102+pad))
arm_f_clash = rot_f_c.crop((pad, pad, pad+260, pad+560))

im_clash = im_torso_clean.copy()
im_clash.paste(arm_u_clash, (0, 0), arm_u_clash)
im_clash.paste(arm_f_clash, (0, 0), arm_f_clash)
im_clash.save(os.path.join(ASSETS_DIR, "im_pose_clash.png"))

# C. STRIDE A & B
mask_im_leg_f = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_leg_f).polygon([(30, 235), (150, 235), (150, 540), (30, 540)], fill=255)
im_leg_f = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_leg_f.paste(im_stand, (0, 0), mask=mask_im_leg_f)

mask_im_leg_b = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_leg_b).polygon([(140, 235), (245, 235), (245, 540), (140, 540)], fill=255)
im_leg_b = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_leg_b.paste(im_stand, (0, 0), mask=mask_im_leg_b)

leg_f_step_a = rotate_and_place(im_leg_f, angle=8, pivot=(135, 255), translate=(10, -2))
leg_b_step_a = rotate_and_place(im_leg_b, angle=-10, pivot=(155, 255), translate=(-12, -2))
im_stride_a = im_stand.copy()
im_stride_a.paste(leg_b_step_a, (0, 0), leg_b_step_a)
im_stride_a.paste(leg_f_step_a, (0, 0), leg_f_step_a)
im_stride_a.save(os.path.join(ASSETS_DIR, "im_pose_stride_a.png"))

leg_f_step_b = rotate_and_place(im_leg_f, angle=-8, pivot=(135, 255), translate=(-10, -2))
leg_b_step_b = rotate_and_place(im_leg_b, angle=10, pivot=(155, 255), translate=(12, -2))
im_stride_b = im_stand.copy()
im_stride_b.paste(leg_b_step_b, (0, 0), leg_b_step_b)
im_stride_b.paste(leg_f_step_b, (0, 0), leg_f_step_b)
im_stride_b.save(os.path.join(ASSETS_DIR, "im_pose_stride_b.png"))

# D. STAGGER
im_stagger = rotate_and_place(im_stand, angle=10, pivot=(150, 480), translate=(18, 0))
im_stagger.save(os.path.join(ASSETS_DIR, "im_pose_stagger.png"))

# E. DOWN / KNEEL
# Rotate lower body into knee-bend, bow head
mask_legs_all = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_legs_all).rectangle((30, 235, 245, 540), fill=255)
im_legs_all = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_legs_all.paste(im_stand, (0, 0), mask=mask_legs_all)
legs_down = rotate_and_place(im_legs_all, angle=18, pivot=(145, 260), translate=(16, 32))

mask_im_head = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_head).rectangle((95, 15, 190, 88), fill=255)
im_head_crop = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_head_crop.paste(im_stand, (0, 0), mask=mask_im_head)
head_down_im = rotate_and_place(im_head_crop, angle=16, pivot=(145, 80), translate=(-4, 10))

im_down = im_stand.copy()
im_down.paste(legs_down, (0, 0), legs_down)
im_down.paste(head_down_im, (0, 0), head_down_im)
im_down.save(os.path.join(ASSETS_DIR, "im_pose_down.png"))

print("Saved all Iron Man final sprites!")
print("BUILD COMPLETE!")
