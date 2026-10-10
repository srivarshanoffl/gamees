from PIL import Image

img = Image.open('assets/im_clean.png').convert('RGBA')

# Torso / chest coordinates
# Let's crop x: 85 to 135, y: 130 to 170
crop = img.crop((85, 130, 135, 170))
crop_hd = crop.resize((crop.width * 8, crop.height * 8), Image.Resampling.NEAREST)
crop_hd.save('assets/chest_zoom_hd.png')
print('Saved chest_zoom_hd.png')
