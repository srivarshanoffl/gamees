# Project Context: Spider-Man Web Chase Visual Upgrade

## Overview
Spider-Man: Web Chase is a high-speed 2.5D momentum pursuit browser game built on Phaser (WebGL/Canvas) with vanilla JavaScript, HTML5, and CSS3. Spider-Man pursues a Golden Cyber-Falcon across the Manhattan skyline, encounters an unexpected web-shooter event-handler failure at 450 PSI, recovers on an emergency fire escape, diagnoses and rectifies the hardware/DOM defect in an interactive J.A.R.V.I.S.-style workbench, and resumes the chase to Oscorp Summit.

## Architecture & Systems Audit
- **Entry Point**: `spiderman/index.html` (hosted on `http://127.0.0.1:8085/spiderman/index.html`)
- **Root Launcher**: `index.html` (hosted on `http://127.0.0.1:8085/`)
- **Server**: `server.js` (Node HTTP server serving mime types and static assets)
- **Engine**: Phaser v3.87.0 (loaded locally via `spiderman/js/phaser.min.js`)
- **Core Orchestrator**: `spiderman/game.js` (14-state machine: BOOT -> TITLE -> CHASE_INTRO -> CHASE -> WEB_MALFUNCTION -> RECOVERY -> WEB_SHOOTER_INSPECTION -> DIAGNOSTICS -> DEBUGGING -> REPAIR -> SYSTEM_TEST -> CHASE_RESUME -> BIRD_CAUGHT -> MISSION_COMPLETE)
- **City & Environment**: `spiderman/js/ParallaxCity.js` (Multi-layer parallax backdrop, distant skyline, mid towers, main buildings, rooftop structures, neon signs, colliders)
- **Hero & Kinematics**: `spiderman/js/SpiderHero.js` and `spiderman/js/SpiderManAnimator.js` (Kinematic joint hierarchy and state transitions)
- **Target AI**: `spiderman/js/BirdTarget.js`, `spiderman/js/BirdAnimator.js`, and `spiderman/js/ChaseController.js`
- **Web-Swinging & Anchors**: `spiderman/js/SwingSystem.js`, `spiderman/js/AnchorSystem.js`
- **Diagnostics & Repair**: `spiderman/js/WebShooterDiagnostic.js` and `spiderman/js/DebugInterface.js`
- **Camera & FX**: `spiderman/js/CameraController.js` and `spiderman/js/FXManager.js`
- **Audio**: `spiderman/js/AudioManager.js` (Web Audio API synthesizers and dynamic wind/tension pitch)
- **Styles & Overlays**: `spiderman/styles.css`

---

## Stage 1 Audit: 5 Major Visual Weaknesses Identified & Addressed

1. **Weakness 1: Giant Flat Monochromatic Building Blocks**
   - *File*: `spiderman/js/ParallaxCity.js` (`renderRooftops`, `createMainBuildings`)
   - *Fix*: Upgraded foreground buildings and mid-ground skyscrapers with multi-tiered masonry facades, stone corbel brackets, vertical architectural pilasters dividing walls into bays, deep recessed window frames with lintels and sills, and warm/cool interior illumination.

2. **Weakness 2: Disconnected Twilight Backdrop & Lack of Sunset Lighting**
   - *File*: `spiderman/js/ParallaxCity.js` (`createSky`, `createDistantSkyline`)
   - *Fix*: Engineered a rich 4-stage sunset gradient (deep indigo -> dusk violet -> sunset wine -> warm golden-hour amber), radiant sun bloom low on the horizon, warm atmospheric haze layer, and crisp golden-hour 2.5D rim lighting on all western coping stones, parapets, and cornices.

3. **Weakness 3: Monotonous Window Grids**
   - *File*: `spiderman/js/ParallaxCity.js` (`createMidSkyline`, `createMainBuildings`, `renderRooftops`)
   - *Fix*: Replaced rigid yellow square grids with organic fenestration featuring warm incandescent offices (`0xffb545`), bright white-gold lofts (`0xfff3cf`), high-tech cyan work terminals (`0x00f0ff`), and unlit glass panes reflecting twilight purple skies with authentic window mullion dividers.

4. **Weakness 4: Flat Translucent Cloud Capsules & Static Sky**
   - *File*: `spiderman/js/ParallaxCity.js` (`createSky`, `update`)
   - *Fix*: Implemented volumetric sunset cloud clusters with multi-circle puff geometry, warm golden underbelly highlights, seamless wrapping, pulsing aviation safety beacons on distant spires, and drifting rooftop exhaust particulates.

5. **Weakness 5: Low-Fidelity Signage & Rooftop Dressing**
   - *File*: `spiderman/js/ParallaxCity.js` (`createNeonSigns`, `createRooftopStructures`)
   - *Fix*: Redesigned The Daily Bugle, Oscorp Industries, and Stark R&D billboards with high-impact neon letterforms, structural steel truss legs, glowing marquee borders, subtle electrical tube flicker, banded cedar water towers, and industrial HVAC exhaust grills.

---

## Stage 2: Hero Readability, Traversal Effects & Target Visibility

1. **Hero Character Visual Overhaul**
   - *Files*: `spiderman/js/SpiderManAnimator.js`, `spiderman/js/SpiderHero.js`
   - *Upgrades*:
     - Muscular, athletic proportions with heroic silhouette (tapered waist, defined chest/shoulders, quad & calf definition).
     - Iconic suit detailing: web grid lines, back spider emblem, front spider chest emblem with arachnid legs.
     - Expressive comic/cinematic angled cowl lenses: white reflective lens surface, inner gradient glint, bold black framing rim.
     - **Warm golden-hour sunset rim lighting** drawn along the hero's back contour (`0xffbe6b`), providing immediate visual separation against dark buildings.
     - Web-shooter gauntlets with active cyan LED and palm trigger stud.
     - Aerodynamic motion blur trails with cyan speed streaks and trailing red suit afterimages.
     - Ground contact ambient occlusion shadow beneath the hero's feet when grounded on rooftops.

2. **Web-Swinging & Energy Effects Elevation**
   - *Files*: `spiderman/game.js` (`renderWebString`), `spiderman/js/AnchorSystem.js`
   - *Upgrades*:
     - Multi-layer braided web strand: outer cyan tensile energy aura (`0x00f0ff`), braided high-tensile white silk core (`0xf5f9ff`), and core cyan tensile thread (`0x80f5ff`).
     - Dynamic catenary sag when slack and high-frequency harmonic string vibration (42 Hz) during high-speed swings.
     - Travelling photon energy pulse racing along the web line from wrist to anchor.
     - Anchor attachment impact point: glowing cyan energy node with multi-directional silk splatters adhering to building cornices.
     - Upgraded anchor reticles in `AnchorSystem.js`: precision corner chevrons `⌜ ⌝ ⌞ ⌟`, concentric pulse rings, and tether guidance lines.

3. **Golden Cyber-Falcon Target & Visibility**
   - *Files*: `spiderman/js/BirdAnimator.js`, `spiderman/js/BirdTarget.js`
   - *Upgrades*:
     - High-contrast metallic gold plumage (`0xffc324`, `0xffe875`, `0x945f03` shadows) and solar feather vanes.
     - Luminous emerald optical sensor with bright specular glint.
     - Aerodynamic twin wingtip vortex slipstream particles streaming behind the falcon during flight.
     - Tactical HUD proximity target-lock bracket indicating optimal capture distance when Spider-Man closes in (< 350m).

---

## Stage 3: Diagnostic Workbench, Telemetry Rails & HUD Elevation

1. **J.A.R.V.I.S. Diagnostic Workbench & Hardware Rails**
   - *Files*: `spiderman/styles.css`, `spiderman/js/DebugInterface.js`
   - *Upgrades*:
     - Eliminated horizontal and vertical layout overflow in `.orbital-bay-right`, `.orbital-tabs`, and `.tab-pane`.
     - Restyled `#btn-apply-repair` into an electric cyan Stark Industries tactical action button with glowing pulse states, animated hover shifts, and instant nominal telemetry feedback.
     - Sequential 7-point self-test visual progression: custom cyan glowing markers transitioning smoothly to green checkmarks upon diagnostic verification.
     - Dynamic HUD status banner with real DOM binding (`#web-fire-trigger` -> `fireWeb()`, unjammed solenoid core, 450 PSI nominal climb).
     - Subsystem telemetry list, target tracker radar card, and code inspection tabs aligned cleanly with zero scrollbar glitches.

---

## Spider-Man Ultra-High-Definition Cinematic Model Upgrade

1. **Anatomical Musculature & Superhero Proportions**
   - *Files*: `spiderman/js/SpiderManAnimator.js`, `spiderman/js/SpiderHero.js`
   - *Upgrades*:
     - Transitioned from primitive vector line strokes to **contoured anatomical muscle segment geometry**: sculpted deltoids, bicep bellies, forearm brachioradialis tapers, vastus lateralis quadriceps sweeps, anatomical patella knee caps, and gastrocnemius calf contours.
     - Upgraded hero scale by 25% (`heroScale = 1.25`) with matching ground ambient occlusion contact shadows for commanding on-screen presence and cinematic readability.
     - Two-tone muscular volumetric shading: sunlit crimson highlight crests along top edges, deep anatomical crease shadows along muscle underbellies.

2. **Suit Materiality & Stark MK-IV Details**
   - *Iconic Chest & Back*: Sharp black spider emblem with 8 angular arachnid legs arching dynamically over pectorals and down the ribs; deep midnight-navy latissimus panels with carbon piping seams; 6-pack abdominal grid.
   - *High-Tech Stark MK-IV Gauntlets*: Matte composite chassis with silver chrome guide rails, brass spinneret aperture, and pulsing cyan Repulsor LED diode with white core.
   - *Expressive Comic Teardrop Eye Lenses*: Bold black carbon-fiber bezels with sharp outer wings, pure white reflective lenses, skyline cyan specular glints, and dynamic emotion squinting (`lensSquint`).
   - *Articulated Footwear & Hands*: Sculpted red boots with treaded rubber traction soles and calf chevron cuffs; authentic "THWIP" web shooting finger gesture (index and pinky extended, middle fingers depressed to palm stud).
   - *Golden-Hour Rim Lighting*: Radiant golden contour rim (`0xffc47d`) hugging the crown of the cowl, spine, and shoulders, perfectly matching the 4-stage sunset Manhattan backdrop.

---

## Verification & QA Results
- **Engine Logs**: 0 console errors; Phaser v3.87.0 WebGL running at 60 FPS.
- **Rooftop Colliders**: All 12 platform coordinates, widths, and collision checks preserved with 100% fidelity.
- **State Progression Verified**:
  - `BOOT` -> `TITLE`: Briefing card and launcher functional.
  - `CHASE_INTRO` -> `CHASE`: Hero and Falcon pursuit across multi-layer parallax depth; web swing attachment and release verified.
  - `WEB_MALFUNCTION` -> `RECOVERY`: Emergency platform positioning, fire escape anchor lock, and wrist inspection verified.
  - `DIAGNOSTICS` -> `REPAIR`: J.A.R.V.I.S. workbench opens, `#web-fire-trigger` repair and 7-point self-test verified.
  - `CHASE_RESUME` -> `BIRD_CAUGHT` -> `MISSION_COMPLETE`: Falcon intercepted at Oscorp Summit, helipad runway lighting verified, mission complete screen and replay cycle verified.
- **Viewports Tested**:
  - `1920x1080` (Full HD Desktop) - Verified
  - `1366x768` (Standard Laptop) - Verified
  - `1280x720` (HD 720p) - Verified

