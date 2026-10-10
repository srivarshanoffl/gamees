import re
from xml.etree import ElementTree as ET

with open('civilwar.html', encoding='utf-8') as f:
    text = f.read()

assert 'assets/cap_legs_stand.png' in text, 'Cap legs missing'
assert 'assets/cap_armL_guard.png' in text, 'Cap guard arm missing'
assert 'assets/im_armR_aim.png' in text, 'IM aim arm missing'
assert 'assets/im_legs_kneel.png' in text, 'IM kneel missing'
assert '</svg>' in text, 'SVG close tag missing'

cap_match = re.search(r'(<svg viewBox="0 0 240 560".*?</svg>)', text, re.DOTALL)
assert cap_match, 'Cap SVG match failed'
ET.fromstring(cap_match.group(1))
print('Cap SVG XML parsed cleanly!')

im_match = re.search(r'(<svg viewBox="0 0 260 560".*?</svg>)', text, re.DOTALL)
assert im_match, 'IM SVG match failed'
ET.fromstring(im_match.group(1))
print('Iron Man SVG XML parsed cleanly!')
print('ALL VALIDATIONS PASSED!')
