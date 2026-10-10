with open('civilwar.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Arc Reactor filter and circle in #im SVG
old_svg_chunk = '''                                        <defs>
                                            <radialGradient id="gI-core">
                                                <stop offset="0" stop-color="#ffffff" />
                                                <stop offset=".4" stop-color="#9fe8ff" />
                                                <stop offset="1" stop-color="#1e6f9e" />
                                            </radialGradient>
                                            <filter id="fi4" x="-80%" y="-80%" width="260%" height="260%">
                                                <feGaussianBlur stdDeviation="4" />
                                            </filter>
                                            <filter id="fi8" x="-80%" y="-80%" width="260%" height="260%">
                                                <feGaussianBlur stdDeviation="8" />
                                            </filter>
                                        </defs>
                                        <image href="assets/im_clean.png" xlink:href="assets/im_clean.png" width="260" height="560" />
                                        <circle cx="130" cy="148" r="7" fill="url(#gI-core)" />
                                        <circle class="reactor-glow" cx="130" cy="148" r="22" fill="#7fd8ff" opacity=".6" filter="url(#fi8)" />
                                        <circle class="palm-glow" cx="127" cy="259" r="14" fill="url(#gI-core)" filter="url(#fi8)" />'''

new_svg_chunk = '''                                        <defs>
                                            <radialGradient id="gI-core">
                                                <stop offset="0" stop-color="#ffffff" />
                                                <stop offset=".4" stop-color="#9fe8ff" />
                                                <stop offset="1" stop-color="#1e6f9e" />
                                            </radialGradient>
                                            <filter id="fi3" x="-80%" y="-80%" width="260%" height="260%">
                                                <feGaussianBlur stdDeviation="2.5" />
                                            </filter>
                                            <filter id="fi4" x="-80%" y="-80%" width="260%" height="260%">
                                                <feGaussianBlur stdDeviation="4" />
                                            </filter>
                                            <filter id="fi8" x="-80%" y="-80%" width="260%" height="260%">
                                                <feGaussianBlur stdDeviation="8" />
                                            </filter>
                                        </defs>
                                        <image href="assets/im_clean.png" xlink:href="assets/im_clean.png" width="260" height="560" />
                                        <circle cx="98" cy="153" r="3.2" fill="url(#gI-core)" />
                                        <circle class="reactor-glow" cx="98" cy="153" r="7.5" fill="#7fd8ff" opacity=".7" filter="url(#fi3)" />
                                        <circle class="palm-glow" cx="127" cy="259" r="14" fill="url(#gI-core)" filter="url(#fi8)" />'''

assert old_svg_chunk in content, 'old_svg_chunk not found'
content = content.replace(old_svg_chunk, new_svg_chunk, 1)

# 2. Update CSS for reactor-glow and shield stuck/final-throw
old_shield_swing = '''        @keyframes shield-swing {
            0% {
                transform: translate(196px, 212px) rotate(0deg)
            }

            100% {
                transform: translate(430px, 276px) rotate(100deg)
            }
        }

        #shield.swing {
            animation: shield-swing .5s ease-in forwards
        }'''

new_shield_rules = '''        #shield.at-stuck {
            --sx: 318px;
            --sy: 149px;
            --sr: 76deg;
            transform: translate(318px, 149px) rotate(76deg) !important;
            transition: none !important;
        }

        @keyframes shield-final-throw {
            0% {
                transform: translate(196px, 212px) rotate(0deg);
            }

            35% {
                transform: translate(250px, 175px) rotate(220deg);
            }

            70% {
                transform: translate(295px, 155px) rotate(480deg);
            }

            100% {
                transform: translate(318px, 149px) rotate(796deg);
            }
        }

        #shield.final-throw {
            animation: shield-final-throw .55s cubic-bezier(.22, .75, .35, 1) forwards;
        }

        @keyframes shield-swing {
            0% {
                transform: translate(196px, 212px) rotate(0deg);
            }

            100% {
                transform: translate(318px, 149px) rotate(76deg);
            }
        }

        #shield.swing {
            animation: shield-final-throw .55s cubic-bezier(.22, .75, .35, 1) forwards;
        }'''

assert old_shield_swing in content, 'old_shield_swing not found'
content = content.replace(old_shield_swing, new_shield_rules, 1)

# 3. Update snapShield to remove final-throw
old_snap = "shield.classList.remove('flight', 'return', 'swing');"
new_snap = "shield.classList.remove('flight', 'return', 'swing', 'final-throw');"
assert old_snap in content, 'old_snap not found'
content = content.replace(old_snap, new_snap, 1)

# 4. Update coordinates in JS
old_coords = '''            const P_IM_CHEST = { x: 1268, y: 422 };   // IM aggressive-pose chest (impact)
            const P_CLASH = { x: 820, y: 465 };   // shield-surface/palm contact
            const P_SWING_HIT = { x: 1250, y: 528 };    // finishing blow on kneeling chest'''

new_coords = '''            const P_IM_CHEST = { x: 1248, y: 401 };   // IM chest arc reactor (impact)
            const P_CLASH = { x: 820, y: 465 };   // shield-surface/palm contact
            const P_SWING_HIT = { x: 1138, y: 401 };    // finishing blow on Iron Man chest arc reactor'''

assert old_coords in content, 'old_coords not found'
content = content.replace(old_coords, new_coords, 1)

# 5. Update climax timeline in Scene 06
old_climax = '''                [83.00, () => {
                    cap('cap-swing'); shield.classList.remove('at-brace');
                    shield.classList.add('swing'); A.whoosh();
                }],
                [83.55, () => {
                    flashFull(.85); burst(P_SWING_HIT.x, P_SWING_HIT.y);
                    sparks(P_SWING_HIT.x, P_SWING_HIT.y - 2, 20); shake('shake-l');
                    A.boom(1.3); A.clank(); im('im-down');
                    imEl.classList.remove('reactor-hot'); imEl.classList.add('reactor-die');
                    dust(1150, 790, 8);
                }],
                [84.60, () => { cap('cap-stand'); snapShield('at-rest'); }],'''

new_climax = '''                [83.00, () => {
                    cap('cap-stride'); shield.classList.remove('at-brace');
                    shield.classList.add('final-throw'); A.whoosh();
                }],
                [83.55, () => {
                    flashFull(.9); burst(P_SWING_HIT.x, P_SWING_HIT.y);
                    sparks(P_SWING_HIT.x, P_SWING_HIT.y, 28); shake('shake-l');
                    A.boom(1.3); A.clank();
                    snapShield('at-stuck');
                    imEl.classList.remove('reactor-hot'); imEl.classList.add('reactor-die');
                    dust(1150, 790, 8);
                    sparkDrip(6);
                }],
                [84.60, () => { cap('cap-stand'); }],'''

assert old_climax in content, 'old_climax not found'
content = content.replace(old_climax, new_climax, 1)

# 6. Make sure resetAll clears stuck styles on shield
old_reset_shield = "shield.className = ''; shieldInner.classList.remove('press');"
new_reset_shield = "shield.className = ''; shield.style.transform = ''; shieldInner.classList.remove('press');"
assert old_reset_shield in content, 'old_reset_shield not found'
content = content.replace(old_reset_shield, new_reset_shield, 1)

with open('civilwar.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully applied arc reactor placement and final shield throw/stuck goal updates!')
