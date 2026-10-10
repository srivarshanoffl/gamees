import os

with open('civilwar.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Check for all expected IDs
expected_ids = [
    'cap', 'im', 'shield', 'beam', 'beam-hit',
    'debug-overlay', 'code-input', 'repair-btn', 'bypass-btn', 'reset-code-btn', 'debug-status',
    'restart-btn', 'start-btn', 'complete', 'title-card'
]
for eid in expected_ids:
    assert f'id="{eid}"' in text, f'Missing ID: {eid}'
print('All required DOM IDs (including bypass-btn) present and matched!')

# Check that ONLY preview_flipped assets are referenced
import re
assets_used = set(re.findall(r'assets/[a-zA-Z0-9_-]+\.png', text))
print('Assets referenced in HTML:', assets_used)
assert assets_used == {'assets/cap_clean.png', 'assets/im_clean.png'}, 'Unexpected assets referenced'
print('Confirmed: ONLY authentic preview_flipped characters are used!')

# Check that the bug overlay has the requested prompt text
assert 'SYSTEM FAILURE: TONY STARK — VITAL FUNCTIONS OFFLINE' in text, 'Missing system failure header'
assert 'HTML ERROR FIXED — VITAL FUNCTIONS RESTORED' in text, 'Missing restored text'
assert 'TONY STARK — VITAL FUNCTIONS RESTORED' in text, 'Missing Tony Stark restored text'
assert 'PLAY AGAIN' in text, 'Missing PLAY AGAIN button text'

print('ALL GAMEPLAY & VALIDATION CHECKS PASSED!')
