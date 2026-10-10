"""
Update civilwar.html to use ONLY preview_flipped characters (cap_clean.png and im_clean.png).
Remove all synthetic/system image swapping and SPRITE_MAP.
Implement all dynamic poses from scratch via CSS transforms on the authentic models.
"""

with open('civilwar.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update character CSS to animate the authentic sprites cleanly via CSS transforms
old_chr_pose = '''        .chr .pose-inner {
            transform: none !important;
            animation: none !important;
        }

        .chr .im-upper {
            transform: none !important;
            animation: none !important;
        }'''

new_chr_pose = '''        .chr .pose-inner {
            transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.45s ease;
            transform-origin: 50% 90%;
        }

        .chr .im-upper {
            transform: none !important;
            animation: none !important;
        }

        /* ── CAPTAIN AMERICA POSES (From Scratch using preview_flipped) ── */
        .cap-idle .pose-inner,
        .cap-stance .pose-inner {
            transform: rotate(0deg) translate(0, 0);
        }
        .cap-guard .pose-inner {
            transform: rotate(2deg) translate(4px, -2px);
        }
        .cap-block .pose-inner,
        .cap-strain .pose-inner {
            transform: rotate(4deg) translate(8px, -1px);
        }
        .cap-windup .pose-inner {
            transform: rotate(-7deg) translate(-10px, -2px);
        }
        .cap-throw .pose-inner {
            transform: rotate(8deg) translate(16px, -2px);
        }
        .cap-clash .pose-inner,
        .cap-brace .pose-inner,
        .cap-drive .pose-inner {
            transform: rotate(5deg) translate(12px, -3px);
        }
        .cap-stand .pose-inner,
        .cap-aftermath .pose-inner {
            transform: rotate(0deg) translate(0, 0);
        }

        /* ── IRON MAN POSES (From Scratch using preview_flipped) ── */
        .im-enter .pose-inner,
        .im-idle .pose-inner,
        .im-stance .pose-inner {
            transform: rotate(0deg) translate(0, 0);
            filter: drop-shadow(0 20px 16px rgba(0, 0, 0, .5));
        }
        .im-charge .pose-inner,
        .im-charging .pose-inner {
            transform: rotate(-4deg) translate(-6px, -2px);
        }
        .im-unibeam .pose-inner,
        .im-aim .pose-inner,
        .im-fire .pose-inner {
            transform: rotate(-1deg) translate(-3px, 0);
        }
        .im-stagger .pose-inner,
        .im-recover .pose-inner {
            transform: rotate(10deg) translate(22px, -4px);
        }
        .im-lunge .pose-inner,
        .im-lock .pose-inner,
        .im-aggressive .pose-inner {
            transform: rotate(-6deg) translate(-14px, -2px);
        }
        .im-down .pose-inner {
            transform: translateY(72px) rotate(14deg);
            filter: drop-shadow(0 8px 12px rgba(0,0,0,0.8)) brightness(0.65);
        }
        .im-revived .pose-inner {
            transform: translateY(0) rotate(0deg);
            filter: drop-shadow(0 20px 16px rgba(0, 0, 0, .5)) brightness(1.05);
        }'''
assert old_chr_pose in content, "old_chr_pose not found"
content = content.replace(old_chr_pose, new_chr_pose, 1)

# 2. In JavaScript, remove SPRITE_MAP, setCapSprite, setImSprite completely!
# Find the SPRITE_MAP block and replace with pure cap and im functions
old_sprite_map_chunk = '''            /* ── DYNAMIC ACTION-MATCHED CHARACTER SPRITES ── */
            const SPRITE_MAP = {
                // Captain America (5+ distinct poses):
                'cap-idle': 'assets/cap_idle.png',
                'cap-stance': 'assets/cap_idle.png',
                'cap-guard': 'assets/cap_perfect_guard.png',
                'cap-block': 'assets/cap_block.png',
                'cap-strain': 'assets/cap_block.png',
                'cap-windup': 'assets/cap_windup.png',
                'cap-throw': 'assets/cap_throw.png',
                'cap-catch': 'assets/cap_perfect_guard.png',
                'cap-brace': 'assets/cap_block.png',
                'cap-clash': 'assets/cap_perfect_guard.png',
                'cap-drive': 'assets/cap_perfect_guard.png',
                'cap-stand': 'assets/cap_aftermath.png',
                'cap-aftermath': 'assets/cap_aftermath.png',
                'cap-stride': 'assets/cap_pose_stride_a.png',

                // Iron Man (5+ distinct poses):
                'im-enter': 'assets/im_stand.png',
                'im-idle': 'assets/im_stand.png',
                'im-stance': 'assets/im_stand.png',
                'im-charge': 'assets/im_pose_charging.png',
                'im-charging': 'assets/im_pose_charging.png',
                'im-aim': 'assets/im_pose_unibeam.png',
                'im-unibeam': 'assets/im_pose_unibeam.png',
                'im-fire': 'assets/im_pose_unibeam.png',
                'im-stagger': 'assets/im_stagger.png',
                'im-recover': 'assets/im_stagger.png',
                'im-aggressive': 'assets/im_clash.png',
                'im-lunge': 'assets/im_clash.png',
                'im-lock': 'assets/im_clash.png',
                'im-driven': 'assets/im_stagger.png',
                'im-down': 'assets/im_down.png',
                'im-revived': 'assets/im_pose_revived.png'
            };

            function setCapSprite(src) {
                if (!src) return;
                const el = byId('cap-img');
                if (el) { el.setAttribute('href', src); el.setAttribute('xlink:href', src); }
                if (capRefl) {
                    const refl = capRefl.querySelector('image');
                    if (refl) { refl.setAttribute('href', src); refl.setAttribute('xlink:href', src); }
                }
            }

            function setImSprite(src) {
                if (!src) return;
                const el = byId('im-img');
                if (el) { el.setAttribute('href', src); el.setAttribute('xlink:href', src); }
                if (imRefl) {
                    const refl = imRefl.querySelector('image');
                    if (refl) { refl.setAttribute('href', src); refl.setAttribute('xlink:href', src); }
                }
            }

            const CAP_POSES = ['cap-idle', 'cap-block', 'cap-strain', 'cap-stance', 'cap-stride', 'cap-windup',
                'cap-throw', 'cap-catch', 'cap-brace', 'cap-clash', 'cap-drive', 'cap-swing', 'cap-stand', 'cap-guard', 'cap-aftermath'];
            const IM_POSES = ['im-enter', 'im-idle', 'im-aim', 'im-stagger', 'im-recover', 'im-aggressive',
                'im-charge', 'im-charging', 'im-unibeam', 'im-lunge', 'im-lock', 'im-driven', 'im-down', 'im-revived'];
            const cap = p => { setPose(capEl, CAP_POSES, p); if (SPRITE_MAP[p]) setCapSprite(SPRITE_MAP[p]); };
            const im = p => { setPose(imEl, IM_POSES, p); if (SPRITE_MAP[p]) setImSprite(SPRITE_MAP[p]); };'''

new_sprite_map_chunk = '''            /* ── AUTHENTIC CHARACTERS ONLY (preview_flipped) ──
               Captain America and Iron Man use ONLY the pristine master sprites
               from preview_flipped. All character poses and actions are driven
               cleanly from scratch via CSS transforms and spatial mechanics. */
            const CAP_POSES = ['cap-idle', 'cap-block', 'cap-strain', 'cap-stance', 'cap-stride', 'cap-windup',
                'cap-throw', 'cap-catch', 'cap-brace', 'cap-clash', 'cap-drive', 'cap-swing', 'cap-stand', 'cap-guard', 'cap-aftermath'];
            const IM_POSES = ['im-enter', 'im-idle', 'im-aim', 'im-stagger', 'im-recover', 'im-aggressive',
                'im-charge', 'im-charging', 'im-unibeam', 'im-lunge', 'im-lock', 'im-driven', 'im-down', 'im-revived'];
            const cap = p => setPose(capEl, CAP_POSES, p);
            const im = p => setPose(imEl, IM_POSES, p);'''
assert old_sprite_map_chunk in content, "old_sprite_map_chunk not found"
content = content.replace(old_sprite_map_chunk, new_sprite_map_chunk, 1)

# 3. Ensure SVG <image> tags point strictly to the authentic clean assets
# In HTML markup:
old_svg_cap = '<image id="cap-img" href="assets/cap_clean.png" xlink:href="assets/cap_clean.png" width="240" height="560" />'
new_svg_cap = '<image href="assets/cap_clean.png" xlink:href="assets/cap_clean.png" width="240" height="560" />'
if old_svg_cap in content:
    content = content.replace(old_svg_cap, new_svg_cap, 1)

old_svg_im = '<image id="im-img" href="assets/im_clean.png" xlink:href="assets/im_clean.png" width="260" height="560" />'
new_svg_im = '<image href="assets/im_clean.png" xlink:href="assets/im_clean.png" width="260" height="560" />'
if old_svg_im in content:
    content = content.replace(old_svg_im, new_svg_im, 1)

with open('civilwar.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied: civilwar.html updated to use ONLY preview_flipped assets!")
