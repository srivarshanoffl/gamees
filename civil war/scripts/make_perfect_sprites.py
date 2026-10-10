"""
Precision sprite builder for Captain America and Iron Man.
Creates perfectly textured, anatomically aligned pose sprites for Civil War.
"""

import os
from PIL import Image, ImageOps, ImageDraw, ImageFilter
import numpy as np

ASSETS_DIR = r"c:\Users\sriva\civil war\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

CAP_MASTER = os.path.join(ASSETS_DIR, "cap_full.png")
IM_MASTER = os.path.join(ASSETS_DIR, "im_full.png")

# ==============================================================================
# Helper functions
# ==============================================================================
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
print("1. Building Captain America poses...")
cap_raw = Image.open(CAP_MASTER).convert("RGBA")

# Scale Cap: target height 500px on 240x560 canvas
CAP_SCALE = 500.0 / 439.0
cap_w = int(cap_raw.width * CAP_SCALE)
cap_h = int(cap_raw.height * CAP_SCALE)
cap_scaled = cap_raw.resize((cap_w, cap_h), Image.LANCZOS)

cap_stand = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
offset_cap_x = int(120 - 251 * CAP_SCALE)
offset_cap_y = int(25 - 32 * CAP_SCALE)
cap_stand.paste(cap_scaled, (offset_cap_x, offset_cap_y), mask=cap_scaled)

# Pristine Idle Pose
cap_stand.save(os.path.join(ASSETS_DIR, "cap_pose_idle.png"))

# Build Cap Full Torso (with mirrored left side to cleanly fill right ribcage under arm)
# Left half of torso: X: 60 to 120, Y: 85 to 265
left_torso = cap_stand.crop((60, 85, 120, 265))
mirrored_right = ImageOps.mirror(left_torso)

# Create torso base without the hanging left arm
cap_torso_base = cap_stand.copy()
# Erase hanging arm below shoulder
mask_arm_erase = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_arm_erase).polygon([(160, 115), (225, 115), (225, 310), (160, 310)], fill=255)
arr_tb = np.array(cap_torso_base)
arr_tb[:, :, 3] = np.where(np.array(mask_arm_erase) > 100, 0, arr_tb[:, :, 3])
cap_torso_base = Image.fromarray(arr_tb)

# Paste mirrored torso over the erased area (feathered blend)
mask_blend = Image.new("L", (60, 180), 255)
# feather left edge
mask_blend = mask_blend.filter(ImageFilter.GaussianBlur(1))
cap_torso_base.paste(mirrored_right, (120, 85), mask=mask_blend)

# Crop left arm cleanly (shoulder at 162, 105)
mask_arm_l = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_arm_l).polygon([(150, 95), (225, 95), (225, 305), (150, 305)], fill=255)
mask_arm_l = mask_arm_l.filter(ImageFilter.GaussianBlur(2))
cap_arm_l = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_arm_l.paste(cap_stand, (0, 0), mask=mask_arm_l)

# Crop right arm cleanly
mask_arm_r = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_arm_r).polygon([(20, 95), (90, 95), (90, 305), (20, 305)], fill=255)
mask_arm_r = mask_arm_r.filter(ImageFilter.GaussianBlur(2))
cap_arm_r = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_arm_r.paste(cap_stand, (0, 0), mask=mask_arm_r)

# Crop Head
mask_head = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_head).polygon([(85, 20), (155, 20), (155, 95), (85, 95)], fill=255)
cap_head = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_head.paste(cap_stand, (0, 0), mask=mask_head)

# Crop Legs
mask_leg_l = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_leg_l).polygon([(118, 240), (200, 240), (200, 540), (118, 540)], fill=255)
cap_leg_l = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_leg_l.paste(cap_stand, (0, 0), mask=mask_leg_l)

mask_leg_r = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_leg_r).polygon([(40, 240), (122, 240), (122, 540), (40, 540)], fill=255)
cap_leg_r = Image.new("RGBA", (240, 560), (0, 0, 0, 0))
cap_leg_r.paste(cap_stand, (0, 0), mask=mask_leg_r)

# 1. POSE: BLOCK (Arm bent in front of chest holding shield at (194, 212))
# Rotate arm inward and up ~25 deg, hand moves to (185, 215)
arm_l_guard = rotate_layer(cap_arm_l, angle=24, pivot=(162, 105), translate=(5, -15))
cap_block = cap_torso_base.copy()
cap_block.paste(arm_l_guard, (0, 0), arm_l_guard)
cap_block.save(os.path.join(ASSETS_DIR, "cap_pose_block.png"))

# 2. POSE: WINDUP (Arm drawn back behind body, right arm fwd)
arm_l_back = rotate_layer(cap_arm_l, angle=-30, pivot=(162, 105), translate=(-20, -10))
arm_r_fwd = rotate_layer(cap_arm_r, angle=-40, pivot=(76, 105), translate=(18, -18))
cap_windup = cap_torso_base.copy()
cap_windup.paste(arm_l_back, (0, 0), arm_l_back)
cap_windup.paste(arm_r_fwd, (0, 0), arm_r_fwd)
cap_windup.save(os.path.join(ASSETS_DIR, "cap_pose_windup.png"))

# 3. POSE: THROW (Arm extended forward)
arm_l_throw = rotate_layer(cap_arm_l, angle=45, pivot=(162, 105), translate=(22, -35))
cap_throw = cap_torso_base.copy()
cap_throw.paste(arm_l_throw, (0, 0), arm_l_throw)
cap_throw.save(os.path.join(ASSETS_DIR, "cap_pose_throw.png"))

# 4. POSE: STRIDE A
leg_r_step = rotate_layer(cap_leg_r, angle=-12, pivot=(95, 260), translate=(-12, -2))
leg_l_step = rotate_layer(cap_leg_l, angle=14, pivot=(145, 260), translate=(16, -3))
cap_stride_a = cap_stand.copy()
# Erase lower legs
mask_erase_legs = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_erase_legs).rectangle((40, 260, 200, 540), fill=255)
arr_sa = np.array(cap_stride_a)
arr_sa[:, :, 3] = np.where(np.array(mask_erase_legs) > 100, 0, arr_sa[:, :, 3])
cap_stride_a = Image.fromarray(arr_sa)
cap_stride_a.paste(leg_r_step, (0, 0), leg_r_step)
cap_stride_a.paste(leg_l_step, (0, 0), leg_l_step)
# Re-overlay belt and hands
hands_belt = cap_stand.crop((20, 230, 225, 305))
cap_stride_a.paste(hands_belt, (20, 230), hands_belt)
cap_stride_a.save(os.path.join(ASSETS_DIR, "cap_pose_stride_a.png"))

# 5. POSE: STRIDE B
leg_r_step_b = rotate_layer(cap_leg_r, angle=14, pivot=(95, 260), translate=(16, -3))
leg_l_step_b = rotate_layer(cap_leg_l, angle=-12, pivot=(145, 260), translate=(-12, -2))
cap_stride_b = Image.fromarray(arr_sa).copy()
cap_stride_b.paste(leg_r_step_b, (0, 0), leg_r_step_b)
cap_stride_b.paste(leg_l_step_b, (0, 0), leg_l_step_b)
cap_stride_b.paste(hands_belt, (20, 230), hands_belt)
cap_stride_b.save(os.path.join(ASSETS_DIR, "cap_pose_stride_b.png"))

# 6. POSE: AFTERMATH (Head bowed down)
head_down = rotate_layer(cap_head, angle=-14, pivot=(120, 90), translate=(2, 6))
cap_aftermath = cap_stand.copy()
mask_erase_head = Image.new("L", (240, 560), 0)
ImageDraw.Draw(mask_erase_head).rectangle((85, 20, 155, 95), fill=255)
arr_after = np.array(cap_aftermath)
arr_after[:, :, 3] = np.where(np.array(mask_erase_head) > 100, 0, arr_after[:, :, 3])
cap_aftermath = Image.fromarray(arr_after)
cap_aftermath.paste(head_down, (0, 0), head_down)
cap_aftermath.save(os.path.join(ASSETS_DIR, "cap_pose_aftermath.png"))

print("All Captain America poses built!")

# ==============================================================================
# 2. IRON MAN
# ==============================================================================
print("2. Building Iron Man poses...")
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

# Build Iron Man Torso Armor (cloning realistic metal textures from back and abdomen)
# Sample realistic armor plate from abdomen/back: X: 145 to 195, Y: 110 to 250
im_armor_base = im_stand.copy()
armor_texture = im_stand.crop((145, 110, 195, 250))
# Fill under-arm area:
im_armor_base.paste(armor_texture, (105, 110))
# Blend with chest edge
chest_contour = im_stand.crop((85, 85, 110, 260))
im_armor_base.paste(chest_contour, (85, 85), chest_contour)

# Crop near arm
mask_arm = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_arm).polygon([(110, 88), (155, 88), (145, 180), (135, 275), (80, 275), (85, 175), (105, 95)], fill=255)
mask_arm = mask_arm.filter(ImageFilter.GaussianBlur(1))
im_arm_near = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
im_arm_near.paste(im_stand, (0, 0), mask=mask_arm)

# 1. POSE: AIM (Repulsor arm pointing horizontally forward at Cap, palm at X~34, Y~116)
# Arm rotated forward ~ -68 deg around shoulder (132, 102)
arm_aim = rotate_layer(im_arm_near, angle=-68, pivot=(132, 102), translate=(-30, -10))
im_aim = im_armor_base.copy()
im_aim.paste(arm_aim, (0, 0), arm_aim)

# Luminous Arc Reactor on chest (centered at X=130, Y=145) and Palm Repulsor (at X=40, Y=116)
glow_repulsor = Image.new("RGBA", (260, 560), (0, 0, 0, 0))
draw_g = ImageDraw.Draw(glow_repulsor)
draw_g.ellipse((32, 108, 52, 128), fill=(180, 235, 255, 255))
glow_blur = glow_repulsor.filter(ImageFilter.GaussianBlur(6))
draw_g.ellipse((37, 113, 47, 123), fill=(255, 255, 255, 255))

im_aim.paste(glow_blur, (0, 0), glow_blur)
im_aim.paste(glow_repulsor, (0, 0), glow_repulsor)
im_aim.save(os.path.join(ASSETS_DIR, "im_pose_aim.png"))

# 2. POSE: CLASH / LOCK (Arms forward grappling Cap's shield)
arm_clash = rotate_layer(im_arm_near, angle=-48, pivot=(132, 102), translate=(-20, -5))
im_clash = im_armor_base.copy()
im_clash.paste(arm_clash, (0, 0), arm_clash)
im_clash.save(os.path.join(ASSETS_DIR, "im_pose_clash.png"))

# 3. POSE: STRIDE A & B
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
# Erase legs
mask_im_erase_l = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_im_erase_l).rectangle((30, 260, 245, 540), fill=255)
arr_ima = np.array(im_stride_a)
arr_ima[:, :, 3] = np.where(np.array(mask_im_erase_l) > 100, 0, arr_ima[:, :, 3])
im_stride_a = Image.fromarray(arr_ima)
im_stride_a.paste(leg_b_step_a, (0, 0), leg_b_step_a)
im_stride_a.paste(leg_f_step_a, (0, 0), leg_f_step_a)
# Overlay hand
hand_crop = im_stand.crop((70, 200, 155, 280))
im_stride_a.paste(hand_crop, (70, 200), hand_crop)
im_stride_a.save(os.path.join(ASSETS_DIR, "im_pose_stride_a.png"))

leg_f_step_b = rotate_layer(im_leg_f, angle=-8, pivot=(135, 255), translate=(-10, -2))
leg_b_step_b = rotate_layer(im_leg_b, angle=10, pivot=(155, 255), translate=(12, -2))
im_stride_b = Image.fromarray(arr_ima).copy()
im_stride_b.paste(leg_b_step_b, (0, 0), leg_b_step_b)
im_stride_b.paste(leg_f_step_b, (0, 0), leg_f_step_b)
im_stride_b.paste(hand_crop, (70, 200), hand_crop)
im_stride_b.save(os.path.join(ASSETS_DIR, "im_pose_stride_b.png"))

# 4. POSE: STAGGER (Hit by shield, recoiling backward)
im_stagger = rotate_layer(im_stand, angle=10, pivot=(150, 480), translate=(18, 0))
im_stagger.save(os.path.join(ASSETS_DIR, "im_pose_stagger.png"))

# 5. POSE: DOWN (Defeated kneeling on Siberia floor)
# Lower body bends down, head bows forward
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
# Erase legs and head
mask_erase_dh = Image.new("L", (260, 560), 0)
ImageDraw.Draw(mask_erase_dh).rectangle((30, 260, 245, 540), fill=255)
ImageDraw.Draw(mask_erase_dh).rectangle((95, 15, 190, 88), fill=255)
arr_d = np.array(im_down)
arr_d[:, :, 3] = np.where(np.array(mask_erase_dh) > 100, 0, arr_d[:, :, 3])
im_down = Image.fromarray(arr_d)
im_down.paste(legs_down, (0, 0), legs_down)
im_down.paste(head_down_im, (0, 0), head_down_im)
im_down.save(os.path.join(ASSETS_DIR, "im_pose_down.png"))

print("All Iron Man poses built!")
print("ALL PERFECT SPRITES GENERATED!")
