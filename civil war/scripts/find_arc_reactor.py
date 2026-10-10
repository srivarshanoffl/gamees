import cv2
import numpy as np
from PIL import Image

img = Image.open('assets/im_clean.png').convert('RGBA')
arr = np.array(img)

# Let's crop chest area: y in [100, 220], x in [80, 180]
# Save chest crop for viewing
chest = arr[100:220, 80:180]
Image.fromarray(chest).save('assets/chest_inspect.png')

# Let's find brightness or cyan/blue core in chest
# Notice Iron Man suit is red & gold. The arc reactor is cyan/white/light-blue
# Or let's check high brightness pixels or blue > red pixels
r = chest[:, :, 0].astype(float)
g = chest[:, :, 1].astype(float)
b = chest[:, :, 2].astype(float)
a = chest[:, :, 3].astype(float)

# Blue or white dominance or high brightness:
is_reactor = (a > 100) & ((b > r + 30) | ((r > 200) & (g > 200) & (b > 200)))
ys, xs = np.where(is_reactor)
if len(xs) > 0:
    mean_x = xs.mean() + 80
    mean_y = ys.mean() + 100
    print(f"Detected reactor pixels: count={len(xs)}, center=({mean_x:.1f}, {mean_y:.1f})")
    print(f"X range: [{xs.min()+80}, {xs.max()+80}], Y range: [{ys.min()+100}, {ys.max()+100}]")
else:
    print("No cyan/white pixels detected with strict threshold, checking brightest area in torso:")
    # Check brightest pixels in chest
    brightness = (r + g + b) / 3.0 * (a > 100)
    max_pos = np.unravel_index(np.argmax(brightness), brightness.shape)
    print(f"Max brightness at ({max_pos[1]+80}, {max_pos[0]+100}) with val={brightness[max_pos]}")

# Also check original un-flipped image if available (assets/im_full.png or assets/im_torso.png)
