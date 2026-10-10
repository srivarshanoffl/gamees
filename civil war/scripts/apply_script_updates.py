"""
Script to apply JavaScript gameplay updates to civilwar.html.
"""

with open('civilwar.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update A (Audio): add reboot()
old_audio_chunk = '''                    boom(k) {
                        osc('sine', 130, 36, .6, .45 * k); noiseHit(.5, .3 * k, 'lowpass', 380);
                        setTimeout(() => osc('sine', 95, 34, .4, .25 * k), 70);
                    },'''

new_audio_chunk = '''                    boom(k) {
                        osc('sine', 130, 36, .6, .45 * k); noiseHit(.5, .3 * k, 'lowpass', 380);
                        setTimeout(() => osc('sine', 95, 34, .4, .25 * k), 70);
                    },
                    reboot() {
                        [220, 330, 440, 660, 880].forEach((f, i) => {
                            setTimeout(() => osc('sine', f, f * 1.05, 0.28, 0.08), i * 110);
                        });
                        noiseHit(0.4, 0.08, 'bandpass', 350, 1.8);
                    },'''
assert old_audio_chunk in content, "old_audio_chunk not found"
content = content.replace(old_audio_chunk, new_audio_chunk, 1)

# 2. Add SPRITE_MAP and sprite functions, and update cap & im
old_poses_chunk = '''            const CAP_POSES = ['cap-idle', 'cap-block', 'cap-strain', 'cap-stance', 'cap-stride', 'cap-windup',
                'cap-throw', 'cap-catch', 'cap-brace', 'cap-clash', 'cap-drive', 'cap-swing', 'cap-stand'];
            const IM_POSES = ['im-enter', 'im-idle', 'im-aim', 'im-stagger', 'im-recover', 'im-aggressive',
                'im-charge', 'im-lunge', 'im-lock', 'im-driven', 'im-down'];
            const cap = p => setPose(capEl, CAP_POSES, p);
            const im = p => setPose(imEl, IM_POSES, p);'''

new_poses_chunk = '''            /* ── DYNAMIC ACTION-MATCHED CHARACTER SPRITES ── */
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
assert old_poses_chunk in content, "old_poses_chunk not found"
content = content.replace(old_poses_chunk, new_poses_chunk, 1)

# 3. Replace fireBeam and beamOff with fireUnibeam and unibeamOff originating from chest reactor
old_firebeam_chunk = '''            function fireBeam(palm, target, dur) {
                const dx = target.x - palm.x, dy = target.y - palm.y;
                beam.style.left = palm.x + 'px';
                beam.style.top = (palm.y - 9) + 'px';
                beam.style.width = Math.hypot(dx, dy) + 'px';
                beam.style.setProperty('--beam-a', (Math.atan2(dy, dx) * 180 / Math.PI) + 'deg');
                beamHit.style.left = target.x + 'px'; beamHit.style.top = target.y + 'px';
                beam.classList.add('firing'); beamHit.classList.add('on');
                A.fire(); A.beam(dur);
                sparks(target.x, target.y, 10, { dist: 130 });
                shake('shake-s');
            }
            function beamOff() {
                beam.classList.remove('firing'); beamHit.classList.remove('on');
                imEl.classList.remove('im-hot');
                byId('rep-light').classList.remove('on');
                shield.classList.remove('energized');
            }'''

new_firebeam_chunk = '''            /* ── CHEST ARC REACTOR UNIBEAM ATTACK ── */
            function fireUnibeam(target, dur) {
                // Chest reactor origin: dynamic world coordinate aligned with Iron Man position
                const chest = { x: 1255 + imX, y: 394 };
                const dx = target.x - chest.x, dy = target.y - chest.y;
                const dist = Math.hypot(dx, dy);
                const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;

                beam.style.left = chest.x + 'px';
                beam.style.top = chest.y + 'px';
                beam.style.width = dist + 'px';
                beam.style.setProperty('--beam-a', angleDeg + 'deg');
                beamHit.style.left = target.x + 'px'; beamHit.style.top = target.y + 'px';

                imEl.classList.remove('reactor-charging');
                imEl.classList.add('reactor-unibeam');
                im('im-unibeam');

                beam.classList.add('firing'); beamHit.classList.add('on');
                byId('rep-light').classList.add('on');
                shield.classList.add('energized');
                A.fire(); A.beam(dur);
                sparks(target.x, target.y, 16, { dist: 140 });
                shake('shake-m');
            }

            function unibeamOff() {
                beam.classList.remove('firing'); beamHit.classList.remove('on');
                imEl.classList.remove('reactor-unibeam');
                byId('rep-light').classList.remove('on');
                shield.classList.remove('energized');
            }'''
assert old_firebeam_chunk in content, "old_firebeam_chunk not found"
content = content.replace(old_firebeam_chunk, new_firebeam_chunk, 1)

# 4. Replace impactArrived, debug challenge polling, CUES, finish, resetAll, and events
# Find the block starting at function impactArrived() and ending before requestAnimationFrame(loop)
old_gameplay_start = '''            function impactArrived() {
                if (S.flags.arrived) return; S.flags.arrived = true;
                snapShield('at-impact');
                shieldInner.classList.add('press');
                preImp.style.left = P_IM_CHEST.x + 'px'; preImp.style.top = P_IM_CHEST.y + 'px';
                impactEl.style.left = P_IM_CHEST.x + 'px'; impactEl.style.top = P_IM_CHEST.y + 'px';
                preImp.classList.add('on');
                A.clank(); sparks(P_IM_CHEST.x - 6, P_IM_CHEST.y - 4, 7, { dist: 85 });
                setShot('impactChest'); shake('shake-s');
                later(() => preImp.classList.remove('on'), 1600);
                later(() => fx.classList.add('impact-live'), 1750);
                later(enterDebugPause, 1950);
            }'''
assert old_gameplay_start in content, "old_gameplay_start not found"

# Let's locate the whole chunk from impactArrived down to loop(now)
idx_start = content.index("            function impactArrived() {")
idx_loop = content.index("            let cueIdx = 0, lastT = performance.now();")

new_gameplay_block = '''            function impactArrived() {
                if (S.flags.arrived) return; S.flags.arrived = true;
                snapShield('at-impact');
                shieldInner.classList.add('press');
                preImp.style.left = P_IM_CHEST.x + 'px'; preImp.style.top = P_IM_CHEST.y + 'px';
                impactEl.style.left = P_IM_CHEST.x + 'px'; impactEl.style.top = P_IM_CHEST.y + 'px';
                preImp.classList.add('on');
                A.clank(); sparks(P_IM_CHEST.x - 6, P_IM_CHEST.y - 4, 8, { dist: 90 });
                setShot('impactChest'); shake('shake-m');
                later(() => {
                    preImp.classList.remove('on');
                    fx.classList.add('impact-live');
                    flashFull(.4); burst(P_IM_CHEST.x, P_IM_CHEST.y);
                    sparks(P_IM_CHEST.x, P_IM_CHEST.y, 18);
                    shake('shake-m'); A.boom(1); A.clank();
                    im('im-stagger'); shieldInner.classList.remove('press');
                    dust(1200, 790, 5);
                    later(() => {
                        shield.classList.remove('at-impact');
                        shield.classList.add('return');
                        A.whoosh();
                        setShot('mediumTwo');
                    }, 500);
                }, 350);
            }
            function shieldCaught() {
                if (S.flags.caught) return; S.flags.caught = true;
                snapShield('at-catch');
                cap('cap-catch'); A.catch();
            }
            shield.addEventListener('animationend', e => {
                if (e.animationName === 'shield-flight') impactArrived();
                if (e.animationName === 'shield-return') shieldCaught();
            });

            /* ---------------------------------------------------------------------
               HTML DEBUGGING CHALLENGE & TONY STARK REVIVAL
               --------------------------------------------------------------------- */
            const codeInput = byId('code-input'),
                repairBtn = byId('repair-btn'),
                resetCodeBtn = byId('reset-code-btn'),
                debugStatus = byId('debug-status');

            const INITIAL_HTML_BUG = '<div class="reactor-status">\\n  <p>ARC REACTOR: OFFLINE</div>';

            function validateHtmlCode(input) {
                const trimmed = (input || '').trim();
                if (!trimmed) {
                    return { ok: false, msg: 'ERROR: Code cannot be empty. Please enter the corrected markup.' };
                }
                const hasClosingP = /<\\s*\\/\\s*p\\s*>/i.test(trimmed);
                const hasOpeningP = /<\\s*p\\b[^>]*>/i.test(trimmed);
                const hasClosingDiv = /<\\s*\\/\\s*div\\s*>/i.test(trimmed);
                const hasOpeningDiv = /<\\s*div\\b[^>]*>/i.test(trimmed);

                if (!hasClosingP) {
                    return { ok: false, msg: 'SYNTAX ERROR: The <p> tag is missing its closing </p> tag!' };
                }
                if (!hasOpeningP || !hasClosingDiv || !hasOpeningDiv) {
                    return { ok: false, msg: 'SYNTAX ERROR: Missing required <div> or <p> tags.' };
                }
                const pClosePos = trimmed.search(/<\\s*\\/\\s*p\\s*>/i);
                const divClosePos = trimmed.search(/<\\s*\\/\\s*div\\s*>/i);
                if (pClosePos > divClosePos) {
                    return { ok: false, msg: 'HIERARCHY ERROR: </p> must close before </div>!' };
                }
                return { ok: true, msg: 'HTML ERROR FIXED — VITAL FUNCTIONS RESTORED' };
            }

            function checkHtmlFix() {
                if (S.debugResolved) return;
                const code = codeInput.value;
                const res = validateHtmlCode(code);
                if (!res.ok) {
                    debugStatus.textContent = res.msg;
                    debugStatus.className = 'd-status err';
                    shake('shake-s');
                    return;
                }
                // Validated fix!
                S.debugResolved = true;
                S.resolvedBy = 'fix';
                debugStatus.textContent = res.msg;
                debugStatus.className = 'd-status good';
                repairBtn.disabled = true;
                codeInput.disabled = true;
                A.reboot();

                later(() => {
                    hideOverlay();
                    reviveTony();
                }, 1300);
            }

            function enterDebugPause() {
                S.phase = 'DEBUG_PAUSE';
                S.playing = false;
                slate('DIAGNOSTIC · SYSTEM FAILURE');
                later(showOverlay, 400);
                console.log('%cSYSTEM FAILURE: TONY STARK — VITAL FUNCTIONS OFFLINE. Awaiting HTML bug correction…', 'color:#ff5252; font-weight:bold;');
            }

            function showOverlay() {
                overlayEl.classList.add('on');
                codeInput.focus();
            }

            function hideOverlay() {
                overlayEl.classList.remove('on');
            }

            function reviveTony() {
                S.phase = 'REVIVED';
                slate('SCENE 05 · RESTORATION');

                // 1. Restore reactor indicators
                imEl.classList.remove('reactor-die');
                imEl.classList.add('reactor-restored');
                burst(P_IM_CHEST.x, P_IM_CHEST.y + 40);
                sparks(P_IM_CHEST.x, P_IM_CHEST.y + 40, 16, { dist: 90 });
                A.boom(0.6);

                // 2. Transition Tony from defeated into revived pose
                im('im-revived');

                // 3. Display recovery announcement
                caption('TONY STARK — VITAL FUNCTIONS RESTORED', 4.0);
                flourish('VITAL FUNCTIONS RESTORED');

                // 4. Transition camera to final composition showing Cap and Tony
                later(() => {
                    setShot('finalWide', { dur: 2600 });
                    titleEl.classList.add('on');
                }, 1400);

                // 5. Completion screen with PLAY AGAIN button
                later(finish, 4200);
            }

            /* ---------------------------------------------------------------------
               SHORTENED CINEMATIC TIMELINE (~26 seconds active fight)
               --------------------------------------------------------------------- */
            const CUES = [
                /* SCENE 1 — ESTABLISHING & FACE-OFF (0–7s) */
                [0.05, () => {
                    S.phase = 'INTRO'; setShot('wide');
                    cap('cap-idle'); im('im-enter');
                    moveImTo(0, 3200); A.servo();
                }],
                [1.00, () => caption('SIBERIA — ABANDONED HYDRA FACILITY', 2.2)],
                [3.20, () => { setShot('medium'); im('im-idle'); caption('Stand down, Steve.', 2.0, 'STARK'); }],
                [5.20, () => { cap('cap-guard'); caption("Can't do that, Tony.", 1.8, 'CAP'); }],

                /* SCENE 2 — CHEST UNIBEAM ATTACK & SHIELD BLOCK (7–13s) */
                [7.00, () => {
                    S.phase = 'UNIBEAM_ATTACK'; slate('SCENE 02 · CHEST UNIBEAM');
                    im('im-charge'); imEl.classList.add('reactor-charging'); A.charge(2.4);
                    setShot('closeRepl');
                    showPrompt('BLOCK', 'RAISE YOUR SHIELD', 2.8);
                }],
                [9.80, () => {
                    if (!S.flags.blocked) { resolvePrompt(false); doBlock(); }
                    cap('cap-block');
                    fireUnibeam(P_SHIELD_S2, 2.4); flashFull(.3);
                }],
                [12.20, () => {
                    unibeamOff(); im('im-recover'); cap('cap-guard');
                    setShot('medium');
                }],

                /* SCENE 3 — SHIELD COUNTERATTACK (13–19s) */
                [13.50, () => {
                    S.phase = 'SHIELD_THROW'; slate('SCENE 03 · SHIELD COUNTER');
                    cap('cap-stride'); moveCapTo(CAP_ADV_THROW, 1400);
                    shield.classList.remove('at-block'); shield.classList.add('at-windup');
                    cap('cap-windup');
                    showPrompt('THROW', 'THROW THE SHIELD', 2.4);
                }],
                [15.90, () => {
                    if (!S.flags.thrown) { resolvePrompt(false); doThrow(); }
                }],

                /* SCENE 4 — FINAL CLASH & IRON MAN DEFEATED (19–26.5s) */
                [19.80, () => {
                    S.phase = 'FINAL_CLASH'; slate('SCENE 04 · FINAL CONFRONTATION');
                    cap('cap-stride'); moveCapTo(CAP_ADV_CLASH, 1600);
                    im('im-lunge'); moveImTo(IM_ADV_CLASH, 1600);
                    showPrompt('BRACE', 'BRACE THE IMPACT', 2.0);
                }],
                [21.80, () => {
                    if (!S.flags.braced) { resolvePrompt(false); doBrace(); }
                    flashFull(.7); burst(P_CLASH.x, P_CLASH.y);
                    sparks(P_CLASH.x, P_CLASH.y, 22); shake('shake-l');
                    A.boom(1.2); A.clank();
                    moveCapTo(CAP_ADV_FINAL, 1200); moveImTo(IM_FINAL, 1200);
                    snapShield('at-stuck');
                }],
                [23.20, () => {
                    imEl.classList.add('reactor-die');
                    sparks(P_SWING_HIT.x, P_SWING_HIT.y, 26);
                    wisp.style.left = (P_SWING_HIT.x + 10) + 'px'; wisp.style.top = P_SWING_HIT.y + 'px'; wisp.classList.add('on');
                    shake('shake-m');
                }],
                [24.40, () => {
                    im('im-down'); cap('cap-stand');
                    setShot('finalWide', { dur: 2000 });
                    caption('SYSTEM WARNING: Tony Stark vital functions offline.', 2.5);
                }],
                [26.50, () => {
                    enterDebugPause();
                }]
            ];

            function finish() {
                S.phase = 'COMPLETE'; S.playing = false;
                const r = byId('st-result');
                r.textContent = 'HTML REPAIR VERIFIED — ARC REACTOR & LIFE SUPPORT RESTORED';
                r.className = 'good';
                byId('st-time').textContent = S.time.toFixed(1) + 's active combat';
                byId('st-inter').textContent = `BLOCK ${S.stats.block} · THROW ${S.stats.throw} · BRACE ${S.stats.brace}`;
                completeEl.classList.add('on');
                console.log('SEQUENCE COMPLETE —', r.textContent);
            }

            /* ---------------------------------------------------------------------
               RESET / RESTART
               --------------------------------------------------------------------- */
            function resetAll() {
                S.runId++; cueIdx = 0; capToken++;
                Object.assign(S, {
                    phase: 'INTRO', playing: false, time: 0, prompt: null,
                    debugResolved: false, resolvedBy: null, fixPending: false,
                    flags: { blocked: false, thrown: false, braced: false, arrived: false, caught: false },
                    stats: { block: '—', throw: '—', brace: '—' }
                });

                cap('cap-idle'); im('im-enter');
                capEl.classList.remove('cap-quiet');
                imEl.className = 'chr im-enter';
                moveCapTo(0, 0); moveImTo(IM_IN, 0);

                shield.className = ''; shield.style.transform = ''; shieldInner.classList.remove('press');

                fx.classList.remove('impact-live');
                beam.classList.remove('firing'); beamHit.classList.remove('on');
                preImp.classList.remove('on'); preImp.removeAttribute('style');
                burstEl.classList.remove('go');
                sparksHost.innerHTML = ''; dustHost.innerHTML = '';
                wisp.classList.remove('on'); wisp.removeAttribute('style');
                byId('rep-light').classList.remove('on');
                flashEl.classList.remove('go');
                try { impactEl.getAnimations().forEach(a => a.cancel()); } catch (e) { }
                impactEl.removeAttribute('style');
                impactEl.className = 'shield-impact';

                codeInput.value = INITIAL_HTML_BUG;
                codeInput.disabled = false;
                repairBtn.disabled = false;
                debugStatus.textContent = 'HINT: The <p> element is never closed before </div>. Add the missing </p> closing tag.';
                debugStatus.className = 'd-status hint';

                captionEl.classList.remove('on'); hidePrompt();
                overlayEl.classList.remove('on');
                titleEl.classList.remove('on'); completeEl.classList.remove('on');
                world.classList.remove('aftermath');
                slate('SCENE 01 · ESTABLISHING');
                setShot('wide', { cut: true, dur: 0 });
            }

            repairBtn.addEventListener('click', checkHtmlFix);
            resetCodeBtn.addEventListener('click', () => {
                codeInput.value = INITIAL_HTML_BUG;
                debugStatus.textContent = 'HINT: The <p> element is never closed before </div>. Add the missing </p> closing tag.';
                debugStatus.className = 'd-status hint';
                codeInput.focus();
            });
            codeInput.addEventListener('keydown', e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    checkHtmlFix();
                }
            });\n'''

content = content[:idx_start] + new_gameplay_block + content[idx_loop:]

with open('civilwar.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Second pass applied successfully: JavaScript gameplay and HTML debug challenge integrated!")
