import shutil

# Overwrite im_clean.png with the flipped image
shutil.copyfile('assets/im_flipped.png', 'assets/im_clean.png')
print('Overwrote assets/im_clean.png with flipped version')

# Update civilwar.html
with open('civilwar.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_im_svg = '''                                        <circle cx="122" cy="154" r="7" fill="url(#gI-core)" />
                                        <circle class="reactor-glow" cx="122" cy="154" r="22" fill="#7fd8ff" opacity=".6" filter="url(#fi8)" />
                                        <circle class="palm-glow" cx="133" cy="259" r="14" fill="url(#gI-core)" filter="url(#fi8)" />'''

new_im_svg = '''                                        <circle cx="130" cy="148" r="7" fill="url(#gI-core)" />
                                        <circle class="reactor-glow" cx="130" cy="148" r="22" fill="#7fd8ff" opacity=".6" filter="url(#fi8)" />
                                        <circle class="palm-glow" cx="127" cy="259" r="14" fill="url(#gI-core)" filter="url(#fi8)" />'''

assert old_im_svg in content, 'old_im_svg not found'
content = content.replace(old_im_svg, new_im_svg, 1)

old_palm_hover = 'const P_PALM_HOVER = { x: 1283, y: 507 };'
new_palm_hover = 'const P_PALM_HOVER = { x: 1277, y: 507 };'

assert old_palm_hover in content, 'old_palm_hover not found'
content = content.replace(old_palm_hover, new_palm_hover, 1)

with open('civilwar.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully updated civilwar.html')
