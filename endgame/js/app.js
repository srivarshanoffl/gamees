(function () {
            'use strict';
            var $ = function (s) { return document.querySelector(s); };
            var stage = $('#stage'), pusher = $('#pusher'), shaker = $('#shaker'), hero = $('#hero'),
                enemy = $('#enemy'), cosmic = $('.cosmic-energy'), flash = $('#flash'), shock = $('#shock'),
                hudEl = $('#hud'), capEl = $('#caption'), dbg = $('#debug'), toast = $('#toast'), endOv = $('#end'),
                titleOv = $('#title'), diss = $('#dissolve');

            /* Explicit state machine */
            var S = { TITLE: 0, ESTABLISH: 1, RIVAL: 2, FAIL: 3, REVEAL: 4, PREP: 5, IMPACT: 6, DEBUG: 7, SUCCESS: 8, ENERGY: 9, DISSOLVE: 10, AFTERMATH: 11, COMPLETE: 12 };
            var state = S.TITLE, timers = [], poll = null;
            var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

            function wait(ms, fn) { var id = setTimeout(fn, ms); timers.push(id); return id; }
            function setState(s) { state = s; }
            function hud(t) {
                hudEl.textContent = t; hudEl.classList.remove('on');
                void hudEl.offsetWidth; hudEl.classList.add('on');
            }
            function caption(t) { capEl.textContent = t; capEl.classList.add('on'); }
            function captionOff() { capEl.classList.remove('on'); }

            /* ---------------- Minimal synthesized audio (no assets) ---------------- */
            var AC = null;
            function ac() { if (AC === null) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = false; } } return AC || null; }
            function tone(o) {
                var c = ac(); if (!c) return;
                try {
                    var t = c.currentTime + (o.at || 0), a = o.a || 0.02, d = o.dur || 1;
                    var os = c.createOscillator(), g = c.createGain();
                    os.type = o.type || 'sine'; os.frequency.setValueAtTime(o.f, t);
                    if (o.f2) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + d);
                    g.gain.setValueAtTime(0.0001, t);
                    g.gain.exponentialRampToValueAtTime(o.v || 0.12, t + a);
                    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
                    os.connect(g); g.connect(c.destination);
                    os.start(t); os.stop(t + a + d + 0.05);
                } catch (e) { }
            }
            function noiseBurst(dur, vol, at) {
                var c = ac(); if (!c) return;
                try {
                    var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
                    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.6);
                    var s = c.createBufferSource(); s.buffer = b;
                    var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 750;
                    var g = c.createGain(); g.gain.value = vol;
                    s.connect(f); f.connect(g); g.connect(c.destination);
                    s.start(c.currentTime + (at || 0));
                } catch (e) { }
            }
            function sfxBegin() { tone({ f: 52, f2: 104, dur: 3.6, a: 1.1, v: .07 }); tone({ f: 208, dur: 3.4, a: 1.4, v: .025, type: 'triangle' }); }
            function sfxDrone() { tone({ f: 44, dur: 4.4, a: 1.4, v: .06 }); tone({ f: 88, f2: 66, dur: 4, a: 1.2, v: .03, type: 'triangle' }); }
            function sfxFail() { noiseBurst(.06, .28); tone({ f: 1300, f2: 420, dur: .09, a: .004, v: .07, type: 'square' }); }
            function sfxReveal() { [392, 523.25, 659.25].forEach(function (f, i) { tone({ f: f, dur: 2.8, a: .7, v: .028, at: i * .05 }); }); tone({ f: 156, f2: 312, dur: 3, a: 1, v: .035 }); }
            function sfxSnap() { noiseBurst(.28, .55); tone({ f: 150, f2: 36, dur: 1.7, a: .012, v: .35 }); tone({ f: 560, f2: 70, dur: .5, a: .006, v: .09, type: 'sawtooth' }); }
            function sfxFix() { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone({ f: f, dur: 1.5, a: .04, v: .05, at: i * .09 }); }); tone({ f: 130, f2: 262, dur: 2.6, a: .5, v: .04 }); }
            function sfxDissolve() { noiseBurst(1.1, .1); tone({ f: 420, f2: 1150, dur: 2, a: .3, v: .025 }); }

            /* ---------------- Capped ambient particles (created once) ---------------- */
            function spawnAmbient() {
                var mk = function (host, n, cls) {
                    for (var i = 0; i < n; i++) {
                        var p = document.createElement('i'); p.className = cls;
                        p.style.setProperty('--x', (Math.random() * 100).toFixed(2) + '%');
                        p.style.setProperty('--y', (52 + Math.random() * 44).toFixed(2) + '%');
                        p.style.setProperty('--t', (7 + Math.random() * 11).toFixed(2) + 's');
                        p.style.setProperty('--dl', (-Math.random() * 18).toFixed(2) + 's');
                        p.style.setProperty('--sz', (1 + Math.random() * 2.2).toFixed(2) + 'px');
                        p.style.setProperty('--dx', (Math.random() * 90 - 45).toFixed(0) + 'px');
                        host.appendChild(p);
                    }
                };
                mk($('#embers'), 32, 'ember'); mk($('#ash'), 18, 'ash');
            }
            /* Traveling sparks + one mote per stone, inside .cosmic-energy only */
            function spawnEnergy() {
                var host = $('#sparks'), i, s;
                for (i = 0; i < 12; i++) {
                    s = document.createElement('i'); s.className = 'spark';
                    s.style.setProperty('--t', (1.3 + Math.random() * .7).toFixed(2) + 's');
                    s.style.setProperty('--dl', (-i * .16).toFixed(2) + 's');
                    host.appendChild(s);
                }
                var cols = ['#a06bff', '#54c8ff', '#ff4e5e', '#ffa03c', '#57e07a', '#ffd24a'];
                for (i = 0; i < cols.length; i++) {
                    s = document.createElement('i'); s.className = 'mote';
                    s.style.setProperty('--c', cols[i]);
                    s.style.setProperty('--t', (2.3 + i * .18).toFixed(2) + 's');
                    s.style.setProperty('--dl', (-i * .5).toFixed(2) + 's');
                    host.appendChild(s);
                }
            }
            /* Dissolve burst at the Titan's chest, spawned only at disintegration time */
            function burst() {
                for (var i = 0; i < 26; i++) {
                    var p = document.createElement('i'); p.className = 'dp';
                    var a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 54;
                    p.style.left = (1280 + Math.cos(a) * r * .8).toFixed(0) + 'px';
                    p.style.top = (500 + Math.sin(a) * r * .55).toFixed(0) + 'px';
                    p.style.setProperty('--dx', (Math.cos(a) * 70 + Math.random() * 30 - 15).toFixed(0) + 'px');
                    p.style.setProperty('--dy', (-(70 + Math.random() * 170)).toFixed(0) + 'px');
                    p.style.setProperty('--t', (1.1 + Math.random() * 1.3).toFixed(2) + 's');
                    p.style.setProperty('--sz', (2 + Math.random() * 2.4).toFixed(1) + 'px');
                    p.style.animationDelay = (Math.random() * .45).toFixed(2) + 's';
                    diss.appendChild(p);
                }
            }
            function shake() {
                if (RM) return;
                shaker.classList.remove('go'); void shaker.offsetWidth; shaker.classList.add('go');
            }

            /* ---------------- Timeline ---------------- */
            function begin() {
                if (state !== S.TITLE) return;
                var c = ac(); if (c && c.state === 'suspended') { try { c.resume(); } catch (e) { } }
                sfxBegin();
                setState(S.ESTABLISH);
                titleOv.classList.add('gone'); titleOv.setAttribute('aria-hidden', 'true');
                hud('somewhere on the field — the sky is burning out');
                wait(2400, function () { if (state === S.ESTABLISH) hud('the dust has not settled in years'); });
                /* Beat 1 — the Titan believes victory is certain */
                wait(4800, function () {
                    setState(S.RIVAL);
                    pusher.classList.add('pan', 'toEnemy');
                    hud('across the field — the Titan raises an empty gauntlet');
                });
                wait(5800, function () { if (state === S.RIVAL) { enemy.classList.add('raised'); sfxDrone(); } });
                wait(7200, function () {
                    if (state === S.RIVAL) { caption('“I am inevitable.”'); pusher.classList.add('creep'); }
                });
                wait(10200, rivalSnap);
            }
            function rivalSnap() {
                if (state !== S.RIVAL) return;
                setState(S.FAIL);
                captionOff();
                enemy.classList.add('snapE'); sfxFail();
                wait(160, function () { enemy.classList.remove('snapE'); });
                wait(900, function () {
                    enemy.classList.remove('raised');
                    hud('…nothing. the gauntlet is empty');
                    enemy.classList.add('confused');
                });
                wait(4000, heroReveal);
            }
            /* Beat 2 — the stones answer to another hand */
            function heroReveal() {
                if (state !== S.FAIL) return;
                setState(S.REVEAL);
                pusher.classList.remove('toEnemy', 'creep'); pusher.classList.add('toHero');
                wait(1400, function () {
                    if (state !== S.REVEAL) return;
                    hero.classList.add('focus', 'reveal', 'lean');   /* the lean begins */
                    sfxReveal();
                    hud('the stones found another hand');
                });
                wait(2600, function () {
                    if (state === S.REVEAL) { caption('“And I… am… Iron Man.”'); pusher.classList.add('creep'); }
                });
                wait(6600, function () {
                    if (state !== S.REVEAL) return;
                    captionOff();
                    setState(S.PREP);
                    hero.classList.add('charging');
                    pusher.classList.remove('pan', 'creep', 'toHero'); pusher.classList.add('in');
                    hud('one snap remains');
                });
                wait(9400, doSnap);
            }
            function doSnap() {
                setState(S.IMPACT); hero.classList.add('snapped', 'deep');
                flash.classList.add('go'); shock.classList.add('go');
                shake(); sfxSnap();
                hud('the snap');
                wait(1400, function () { if (state === S.IMPACT) hud('… nothing comes'); });
                wait(3300, enterDebug);
            }
            function enterDebug() {
                setState(S.DEBUG);
                hud('energy pathway offline — awaiting correction');
                dbg.classList.add('shown');
                try { dbg.focus({ preventScroll: true }); } catch (e) { dbg.focus(); }
                startPoll();
            }
            /* Poll the REAL rendering state; success is never assumed or simulated */
            function stopPoll() { if (poll) { clearInterval(poll); poll = null; } }
            function startPoll() {
                stopPoll();
                poll = setInterval(function () {
                    if (state !== S.DEBUG) { stopPoll(); return; }
                    var el = null;
                    try { el = document.querySelector('.cosmic-energy'); } catch (e) { }
                    if (!el || !el.isConnected) return;
                    var disp = '';
                    try { disp = getComputedStyle(el).display; } catch (e) { return; }
                    if (disp === 'none') return;
                    var r;
                    try { r = el.getBoundingClientRect(); } catch (e) { return; }
                    if (!(r.width > 0 && r.height > 0)) return;
                    stopPoll();
                    onFixVerified();
                }, 250);
            }
            function onFixVerified() {
                if (state !== S.DEBUG) return;            /* cannot fire twice */
                setState(S.SUCCESS);
                dbg.classList.remove('shown');
                hud('pathway restored — energy propagating');
                toast.classList.add('on'); sfxFix();
                cosmic.classList.add('active');        /* animations only — never touches display */
                stage.classList.add('energized');
                wait(3200, startDisintegrate);
            }
            function startDisintegrate() {
                if (state !== S.SUCCESS) return;
                setState(S.DISSOLVE);
                toast.classList.remove('on');
                enemy.classList.add('dissolve');
                burst(); sfxDissolve();
                hud('the field falls silent');
                wait(2700, aftermath);
            }
            function aftermath() {
                if (state !== S.DISSOLVE) return;
                setState(S.AFTERMATH);
                stage.classList.add('calm');
                hud('dawn, at last');
                wait(3200, complete);
            }
            function complete() {
                if (state !== S.AFTERMATH) return;
                setState(S.COMPLETE);
                endOv.classList.add('shown');
                var b = $('#restart');
                try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); }
            }

            /* ---------------- BYPASS (temporary testing aid — remove for the final build) ----------------
               Clicking applies an inline display:block to .cosmic-energy (overriding the stylesheet fault),
               stops the computed-style poll, and resumes the timeline via the same verified path. */
            function bypassFix() {
                if (state !== S.DEBUG) return;
                stopPoll();
                try { cosmic.style.display = 'block'; } catch (e) { }
                onFixVerified();
            }
            $('#bypass').addEventListener('click', bypassFix);

            /* ---------------- Input, layout, boot ---------------- */
            document.addEventListener('keydown', function (e) {
                if (state === S.TITLE && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); begin(); }
            });
            addEventListener('mousemove', function (e) {
                if (RM) return;
                var x = (e.clientX / innerWidth) * 2 - 1, y = (e.clientY / innerHeight) * 2 - 1;
                stage.style.setProperty('--px', x.toFixed(3));
                stage.style.setProperty('--py', y.toFixed(3));
            });
            function fit() {
                var s = Math.max(innerWidth / 1600, innerHeight / 900);
                stage.style.setProperty('--s', s.toFixed(4));
            }
            addEventListener('resize', fit);

            $('#begin').addEventListener('click', begin);
            $('#restart').addEventListener('click', function () { location.reload(); });

            spawnAmbient();
            spawnEnergy();
            fit();
        })();