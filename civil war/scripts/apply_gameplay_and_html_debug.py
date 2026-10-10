"""
Script to apply Civil War gameplay shortening, chest unibeam attacks,
multiple action-matched character sprites, and post-defeat HTML debugging challenge.
"""

import re

with open('civilwar.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Bug CSS: make .shield-impact animation reference match @keyframes so combat doesn't break
old_bug_css = '''.shield-impact {
            animation: shieldImpact 800ms ease-out forwards;
        }'''
new_bug_css = '''.shield-impact {
            animation: shield-impact 800ms ease-out forwards;
        }'''
assert old_bug_css in content, "old_bug_css not found"
content = content.replace(old_bug_css, new_bug_css, 1)

# 2. Add chest reactor charging and Unibeam styles
old_reactor_css = '''.im-charging .palm-glow {
            animation: palm-charge 2.8s ease-out forwards
        }

        .im-quick .palm-glow {
            animation: palm-charge-quick .55s ease-out forwards
        }

        .im-hot .palm-glow {
            opacity: 1;
            transform: scale(1.25);
            animation: palm-buzz .12s linear infinite alternate
        }'''

new_reactor_css = '''.im-charging .palm-glow {
            animation: palm-charge 2.8s ease-out forwards
        }

        .im-quick .palm-glow {
            animation: palm-charge-quick .55s ease-out forwards
        }

        .im-hot .palm-glow {
            opacity: 1;
            transform: scale(1.25);
            animation: palm-buzz .12s linear infinite alternate
        }

        /* ── CHEST ARC REACTOR CHARGING & UNIBEAM ── */
        @keyframes reactor-charge-surge {
            0% {
                transform: scale(1);
                opacity: 0.65;
            }
            40% {
                transform: scale(1.6);
                opacity: 0.9;
                filter: drop-shadow(0 0 16px #6fe0ff);
            }
            100% {
                transform: scale(2.4);
                opacity: 1;
                filter: drop-shadow(0 0 28px #ffffff);
            }
        }

        .im-charging .reactor-glow,
        .reactor-charging .reactor-glow {
            animation: reactor-charge-surge 2.4s ease-out forwards !important;
            opacity: 1 !important;
        }

        .im-charging .reactor-core,
        .reactor-charging .reactor-core {
            filter: drop-shadow(0 0 12px #ffffff);
        }

        .reactor-unibeam .reactor-glow {
            animation: palm-buzz .1s infinite alternate;
            transform: scale(2.5);
            opacity: 1 !important;
            filter: drop-shadow(0 0 32px #9fe8ff);
        }

        .reactor-restored .reactor-glow {
            animation: reactor-pulse 1.8s ease-in-out infinite alternate !important;
            opacity: 0.95 !important;
            transform: scale(1.35);
            filter: drop-shadow(0 0 20px #68d8ff);
        }

        .reactor-restored .reactor-core {
            opacity: 1 !important;
            filter: drop-shadow(0 0 14px #ffffff);
        }'''
assert old_reactor_css in content, "old_reactor_css not found"
content = content.replace(old_reactor_css, new_reactor_css, 1)

# 3. Upgrade #beam to formidable chest Unibeam
old_beam_css = '''        #beam {
            position: absolute;
            height: 18px;
            border-radius: 50%;
            opacity: 0;
            transform-origin: 0 50%;
            background: linear-gradient(90deg, rgba(150, 210, 255, 0), rgba(185, 230, 255, .85) 16%, #f2ffff 50%, rgba(185, 230, 255, .85) 84%, rgba(150, 210, 255, 0));
            filter: blur(.4px) drop-shadow(0 0 16px rgba(110, 190, 255, .95))
        }

        @keyframes beam-pulse {
            from {
                transform: rotate(var(--beam-a)) scaleY(.65)
            }

            to {
                transform: rotate(var(--beam-a)) scaleY(1.3)
            }
        }'''

new_beam_css = '''        #beam {
            position: absolute;
            height: 38px;
            margin-top: -19px;
            border-radius: 19px;
            opacity: 0;
            transform-origin: 0 50%;
            background: linear-gradient(180deg, rgba(90, 190, 255, 0.2) 0%, rgba(175, 235, 255, 0.95) 25%, #ffffff 50%, rgba(175, 235, 255, 0.95) 75%, rgba(90, 190, 255, 0.2) 100%);
            box-shadow: 0 0 35px rgba(110, 205, 255, 0.95), 0 0 70px rgba(70, 165, 255, 0.7);
            filter: drop-shadow(0 0 14px #a8ecff);
            pointer-events: none;
        }

        @keyframes beam-pulse {
            from {
                transform: rotate(var(--beam-a)) scaleY(0.75);
                filter: drop-shadow(0 0 16px #7fd8ff);
            }

            to {
                transform: rotate(var(--beam-a)) scaleY(1.35);
                filter: drop-shadow(0 0 32px #cbf6ff);
            }
        }'''
assert old_beam_css in content, "old_beam_css not found"
content = content.replace(old_beam_css, new_beam_css, 1)

# 4. Replace #debug-overlay CSS with compact HUD HTML debugging challenge CSS
old_debug_css = '''        /* ---------- diagnostic overlay ---------- */
        #debug-overlay {
            position: fixed;
            left: 24px;
            bottom: 24px;
            z-index: 10;
            width: min(400px, 86vw);
            background: rgba(7, 10, 16, .86);
            border: 1px solid rgba(229, 161, 58, .45);
            border-radius: 10px;
            backdrop-filter: blur(6px);
            padding: 16px 18px 14px;
            font-family: Consolas, "SF Mono", Menlo, monospace;
            color: #c8d4e4;
            opacity: 0;
            pointer-events: none;
            transform: translateY(12px);
            transition: .35s
        }

        #debug-overlay.on {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto
        }

        #debug-overlay .d-head {
            display: flex;
            align-items: center;
            gap: 9px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: .12em;
            color: #f0b05a;
            margin-bottom: 11px
        }

        #debug-overlay .d-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #e04b3a;
            box-shadow: 0 0 10px #e04b3a;
            animation: diag-blink 1s steps(1) infinite
        }

        @keyframes diag-blink {

            0%,
            60% {
                opacity: 1
            }

            61%,
            100% {
                opacity: .25
            }
        }

        #debug-overlay .d-row {
            display: flex;
            gap: 10px;
            font-size: 11.5px;
            line-height: 1.55
        }

        #debug-overlay .d-row span {
            flex: 0 0 82px;
            color: #7e93ad;
            letter-spacing: .06em
        }

        #debug-overlay .d-row code {
            color: #d7e4f6
        }

        #debug-overlay .d-hint {
            margin-top: 9px;
            padding-top: 9px;
            border-top: 1px solid rgba(140, 170, 210, .18);
            font-size: 11.5px;
            line-height: 1.55;
            color: #a9bccf
        }

        #debug-overlay .d-hint code {
            color: #f0c896
        }

        #bypass-btn {
            margin-top: 12px;
            width: 100%;
            padding: 9px 0;
            border-radius: 6px;
            font-family: inherit;
            font-size: 12px;
            letter-spacing: .28em;
            background: #241505;
            color: #f0b05a;
            border: 1px solid #a6722c;
            transition: .2s
        }

        #bypass-btn:hover {
            background: #38220a;
            box-shadow: 0 0 14px rgba(240, 176, 90, .25)
        }

        #bypass-btn:disabled {
            opacity: .35;
            cursor: default
        }

        #debug-overlay .d-note {
            margin-top: 6px;
            text-align: center;
            font-size: 10px;
            letter-spacing: .08em;
            color: #7e93ad
        }'''

new_debug_css = '''        /* ---------- diagnostic overlay: HTML DEBUGGING CHALLENGE ---------- */
        #debug-overlay {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            z-index: 1000;
            width: min(560px, 92vw);
            background: rgba(8, 12, 20, 0.94);
            border: 2px solid rgba(220, 50, 50, 0.65);
            box-shadow: 0 0 35px rgba(220, 40, 40, 0.35), 0 20px 60px rgba(0, 0, 0, 0.85);
            border-radius: 12px;
            backdrop-filter: blur(12px);
            padding: 22px 24px 20px;
            font-family: Consolas, "SF Mono", Menlo, monospace;
            color: #d6e2f0;
            opacity: 0;
            pointer-events: none;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
        }

        #debug-overlay.on {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            pointer-events: auto;
        }

        #debug-overlay .d-head {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13.5px;
            font-weight: 700;
            letter-spacing: 0.1em;
            color: #ff5252;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        #debug-overlay .d-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #ff3333;
            box-shadow: 0 0 12px #ff2222;
            animation: diag-blink 0.8s steps(1) infinite;
        }

        @keyframes diag-blink {
            0%, 60% { opacity: 1 }
            61%, 100% { opacity: 0.25 }
        }

        #debug-overlay .d-sub {
            font-size: 12px;
            color: #9ab0c8;
            line-height: 1.55;
            margin-bottom: 12px;
            font-family: "Segoe UI", system-ui, sans-serif;
        }

        #debug-overlay .d-sub code {
            color: #ffb4a2;
            background: rgba(255, 60, 60, 0.12);
            padding: 2px 5px;
            border-radius: 4px;
        }

        #debug-overlay .d-instruction {
            font-size: 12px;
            color: #64b5f6;
            background: rgba(33, 150, 243, 0.1);
            border-left: 3px solid #2196f3;
            padding: 8px 12px;
            margin-bottom: 14px;
            border-radius: 0 6px 6px 0;
            font-family: "Segoe UI", system-ui, sans-serif;
        }

        #debug-overlay .d-code-box {
            background: #04070e;
            border: 1px solid rgba(100, 140, 190, 0.25);
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 12px;
        }

        #debug-overlay .d-code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0d1524;
            padding: 6px 12px;
            font-size: 11px;
            color: #7b94b2;
            letter-spacing: 0.08em;
            border-bottom: 1px solid rgba(100, 140, 190, 0.15);
        }

        #debug-overlay .d-tag-err {
            color: #ff5252;
            font-size: 10px;
            font-weight: 700;
        }

        #code-input {
            width: 100%;
            background: transparent;
            color: #e0f2fe;
            border: none;
            padding: 12px;
            font-family: Consolas, "SF Mono", Menlo, monospace;
            font-size: 13px;
            line-height: 1.6;
            resize: vertical;
            outline: none;
            tab-size: 2;
        }

        #code-input:focus {
            background: rgba(30, 50, 80, 0.2);
        }

        #debug-status {
            min-height: 22px;
            font-size: 11.5px;
            line-height: 1.45;
            margin-bottom: 14px;
            transition: color 0.2s;
        }

        #debug-status.err {
            color: #ff6b6b;
        }

        #debug-status.good {
            color: #4ade80;
            font-weight: 700;
            letter-spacing: 0.06em;
        }

        #debug-status.hint {
            color: #94a3b8;
        }

        .d-actions {
            display: flex;
            gap: 10px;
        }

        #repair-btn {
            flex: 1;
            padding: 10px 16px;
            border-radius: 6px;
            font-family: inherit;
            font-size: 12.5px;
            font-weight: 700;
            letter-spacing: 0.1em;
            background: linear-gradient(180deg, #1d4ed8, #1e40af);
            color: #ffffff;
            border: 1px solid #3b82f6;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
            transition: all 0.2s ease;
        }

        #repair-btn:hover {
            background: linear-gradient(180deg, #2563eb, #1d4ed8);
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.55);
            transform: translateY(-1px);
        }

        #repair-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        #reset-code-btn {
            padding: 10px 14px;
            border-radius: 6px;
            font-family: inherit;
            font-size: 11.5px;
            background: rgba(255, 255, 255, 0.05);
            color: #94a3b8;
            border: 1px solid rgba(255, 255, 255, 0.12);
            transition: background 0.2s;
        }

        #reset-code-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #f1f5f9;
        }'''
assert old_debug_css in content, "old_debug_css not found"
content = content.replace(old_debug_css, new_debug_css, 1)

# 5. Add id to cap and im SVG images
old_cap_img = '<image href="assets/cap_clean.png" xlink:href="assets/cap_clean.png" width="240" height="560" />'
new_cap_img = '<image id="cap-img" href="assets/cap_clean.png" xlink:href="assets/cap_clean.png" width="240" height="560" />'
assert old_cap_img in content, "old_cap_img not found"
content = content.replace(old_cap_img, new_cap_img, 1)

old_im_img = '<image href="assets/im_clean.png" xlink:href="assets/im_clean.png" width="260" height="560" />'
new_im_img = '<image id="im-img" href="assets/im_clean.png" xlink:href="assets/im_clean.png" width="260" height="560" />'
assert old_im_img in content, "old_im_img not found"
content = content.replace(old_im_img, new_im_img, 1)

# 6. Replace #debug-overlay HTML markup with the HTML debugging challenge markup
old_debug_markup = '''        <div id="debug-overlay">
            <div class="d-head"><span class="d-dot"></span>SHIELD IMPACT SYSTEM FAILURE</div>
            <div class="d-row"><span>ELEMENT</span><code>.shield-impact</code></div>
            <div class="d-row"><span>STATE</span><code>animation declared — NOT RUNNING</code></div>
            <div class="d-row"><span>KEYFRAMES</span><code>@keyframes shield-impact (defined)</code></div>
            <div class="d-row"><span>CAUSE</span><code>animation-name does not match @keyframes</code></div>
            <div class="d-hint">Open DevTools (<code>F12</code>) → inspect <code>.shield-impact</code> → repair its
                <code>animation</code> declaration so the impact shockwave runs.
            </div>
            <button id="bypass-btn">BYPASS TEST</button>
            <div class="d-note">dev bypass — resumes without fixing the CSS</div>
        </div>'''

new_debug_markup = '''        <div id="debug-overlay">
            <div class="d-head"><span class="d-dot"></span>SYSTEM FAILURE: TONY STARK — VITAL FUNCTIONS OFFLINE</div>
            <div class="d-sub">
                Critical error in armor life-support subroutine <code>&lt;recovery_core.html&gt;</code>.
                A malformed HTML tag has halted defibrillation and arc reactor restart.
            </div>
            <div class="d-instruction">
                <b>TASK:</b> Correct the mismatched HTML tags below to restore Tony Stark's life support.
            </div>
            <div class="d-code-box">
                <div class="d-code-header">
                    <span>ARMOR RECOVERY INTERFACE</span>
                    <span class="d-tag-err">HTML SYNTAX ERROR DETECTED</span>
                </div>
                <textarea id="code-input" spellcheck="false" rows="3">&lt;div class="reactor-status"&gt;
  &lt;p&gt;ARC REACTOR: OFFLINE&lt;/div&gt;</textarea>
            </div>
            <div id="debug-status" class="d-status hint">
                HINT: The &lt;p&gt; element is never closed before &lt;/div&gt;. Add the missing &lt;/p&gt; closing tag.
            </div>
            <div class="d-actions">
                <button id="repair-btn">⚡ INJECT CODE FIX</button>
                <button id="reset-code-btn">RESET CODE</button>
            </div>
        </div>'''
assert old_debug_markup in content, "old_debug_markup not found"
content = content.replace(old_debug_markup, new_debug_markup, 1)

# 7. Update #complete button to say "PLAY AGAIN"
old_restart = '<button id="restart-btn">RESTART SEQUENCE</button>'
new_restart = '<button id="restart-btn">PLAY AGAIN</button>'
assert old_restart in content, "old_restart not found"
content = content.replace(old_restart, new_restart, 1)

# 8. Update #start text
old_start_rules = '''                <div class="rules">
                    ▸ Watch the confrontation unfold — <b>SPACE</b> / click when prompted (block · throw · brace)<br>
                    ▸ At the critical impact, the shockwave animation will <i>fail</i><br>
                    ▸ Open real <b>Developer Tools (F12)</b>, inspect <code>.shield-impact</code>, and repair its
                    CSS<br>
                    ▸ A <i>BYPASS TEST</i> button is available for quick testing (it does not fix the bug)
                </div>'''

new_start_rules = '''                <div class="rules">
                    ▸ Watch the intense confrontation unfold — <b>SPACE</b> / click when prompted (block · throw · brace)<br>
                    ▸ Iron Man attacks with devastating chest-originating <b>Arc Reactor Unibeams</b><br>
                    ▸ Experience dynamic character visuals with distinct action poses throughout the fight<br>
                    ▸ After Iron Man is defeated, solve the critical <b>HTML bug</b> to revive Tony Stark and restore his vital functions!
                </div>'''
assert old_start_rules in content, "old_start_rules not found"
content = content.replace(old_start_rules, new_start_rules, 1)

# Save intermediate
with open('civilwar.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("First pass applied successfully: styles and markup updated!")
