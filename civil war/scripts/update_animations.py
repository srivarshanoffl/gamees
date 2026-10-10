with open('civilwar.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace CSS body animation rules
css_start = '        .chr .pose-inner {\n            transition: transform .55s cubic-bezier(.35, .9, .35, 1)'
css_end = '        .im-down .im-upper {\n            transform: translateY(66px)\n        }'

new_css = '''        .chr .pose-inner {
            transform: none !important;
            animation: none !important;
        }

        .chr .im-upper {
            transform: none !important;
            animation: none !important;
        }

        .bob {
            width: 100%;
        }

        @keyframes walkbob {
            from {
                transform: translateY(0);
            }
            to {
                transform: translateY(-6px);
            }
        }

        .cap-stride .bob {
            animation: walkbob .34s ease-in-out infinite alternate;
        }

        .im-enter .bob {
            animation: walkbob .3s ease-in-out infinite alternate;
        }'''

assert css_start in content, 'css_start not found'
assert css_end in content, 'css_end not found'

idx_start = content.index(css_start)
idx_end = content.index(css_end) + len(css_end)

content = content[:idx_start] + new_css + content[idx_end:]

# 2. Update palm-glow position in SVG
old_palm_svg = '<circle class="palm-glow" cx="34" cy="116" r="14" fill="url(#gI-core)" filter="url(#fi8)" />'
new_palm_svg = '<circle class="palm-glow" cx="133" cy="259" r="14" fill="url(#gI-core)" filter="url(#fi8)" />'
assert old_palm_svg in content, 'old_palm_svg not found'
content = content.replace(old_palm_svg, new_palm_svg, 1)

# 3. Update P_PALM_HOVER in JS
old_palm_js = 'const P_PALM_HOVER = { x: 1184, y: 308 };'
new_palm_js = 'const P_PALM_HOVER = { x: 1283, y: 507 };'
assert old_palm_js in content, 'old_palm_js not found'
content = content.replace(old_palm_js, new_palm_js, 1)

with open('civilwar.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully updated civilwar.html')
