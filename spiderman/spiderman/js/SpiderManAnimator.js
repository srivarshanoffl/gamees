/**
 * SpiderManAnimator - High-Fidelity Comic Superhero Character Engine
 *
 * Implements iconic Marvel comic-accurate Spider-Man aesthetics:
 * - High-Resolution HTML5 2D Canvas rendering with smooth bezier curves (zero polygonal blockiness!)
 * - Todd McFarlane & Mark Bagley signature teardrop eyes with sharp winged tips & cyan specular glints
 * - Athletic, heroic gymnast anatomy (broad shoulders, V-taper waist, sculpted limbs)
 * - Zero bipedal walking: iconic 3-point spider perch (IDLE) & acrobatic knuckle-vault spider dash (RUN)
 * - Razor-sharp comic black ink keylines with rounded anatomical joints (no floating circles)
 * - Needle-sharp 8-legged black spider chest insignia
 * - Radial spider-web grid on cowl and chest
 * - Stark MK-IV web-shooter wrist gauntlet with active cyan diode & "THWIP" fingers
 * - Articulated gripping spider fingers on rooftop coping stones
 */
class SpiderManAnimator {
  constructor(hero, scene) {
    this.hero = hero;
    this.scene = scene;

    // Active Animation State
    this.state = 'IDLE';
    this.previousState = 'IDLE';
    this.stateTime = 0;
    this.transitionProgress = 1.0;
    this.transitionDuration = 0.15;

    // Kinematic Joint Hierarchy (radians & offsets in 2x canvas space)
    this.joints = {
      torsoY: 0,
      torsoTilt: 0,
      torsoScaleX: 1.0,
      torsoScaleY: 1.0,
      headAngle: 0,
      headY: -44,
      leftArmAngle: 0,
      leftForearmAngle: 0.2,
      rightArmAngle: 0,
      rightForearmAngle: 0.2,
      leftThighAngle: 0,
      leftKneeAngle: 0,
      rightThighAngle: 0,
      rightKneeAngle: 0,
      lensSquint: 0, // 0 = normal, 1 = narrow/intense, -1 = surprised/wide
      cowlTiltX: 0
    };

    // Target Joint Angles for Blending
    this.targetJoints = { ...this.joints };

    // Sub-sequence timers
    this.shootSequenceTime = 0;
    this.isShooting = false;
    this.shootAngle = 0;
    this.attachShockTime = 0;
    this.landingTime = 0;
    this.releaseFlipAngle = 0;

    // Secondary motion trackers
    this.gaitPhase = 0;
    this.breathingPhase = 0;
    this.speedTrailTimer = 0;
  }

  setState(newState, force = false) {
    if (this.state === newState && !force) return;
    this.previousState = this.state;
    this.state = newState;
    this.stateTime = 0;
    this.transitionProgress = 0;

    if (newState === 'WEB_SHOOT') {
      this.shootSequenceTime = 0;
      this.isShooting = true;
    } else if (newState === 'WEB_ATTACH') {
      this.attachShockTime = 0;
    } else if (newState === 'LAND') {
      this.landingTime = 0;
    } else if (newState === 'SWING_RELEASE') {
      this.releaseFlipAngle = 0;
    }
  }

  triggerShoot(targetAngle = -0.6) {
    this.shootAngle = targetAngle;
    this.setState('WEB_SHOOT', true);
  }

  triggerAttach() {
    this.setState('WEB_ATTACH', true);
  }

  triggerRelease() {
    this.setState('SWING_RELEASE', true);
  }

  triggerLand() {
    this.setState('LAND', true);
  }

  update(dt, heroSpeed, isSwinging, swingAngle, angularVelocity = 0) {
    this.stateTime += dt;
    this.breathingPhase += dt * 2.8;

    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + dt / this.transitionDuration);
    }

    // Determine state automatically based on physics
    this.evaluateAutomaticState(heroSpeed, isSwinging);

    // Compute joint angles for current state
    switch (this.state) {
      case 'IDLE':
        this.updateIdle(dt);
        break;
      case 'RUN':
        this.updateRun(dt, heroSpeed);
        break;
      case 'JUMP':
        this.updateJump(dt);
        break;
      case 'FALL':
        this.updateFall(dt);
        break;
      case 'WEB_SHOOT':
        this.updateWebShoot(dt);
        break;
      case 'WEB_ATTACH':
        this.updateWebAttach(dt);
        break;
      case 'SWING_START':
        this.updateSwingStart(dt, swingAngle);
        break;
      case 'SWING_LOOP':
        this.updateSwingLoop(dt, swingAngle, angularVelocity);
        break;
      case 'SWING_FAST':
        this.updateSwingFast(dt, swingAngle, angularVelocity, heroSpeed);
        break;
      case 'SWING_RELEASE':
        this.updateSwingRelease(dt);
        break;
      case 'RECOVERY':
        this.updateRecovery(dt);
        break;
      case 'LAND':
        this.updateLand(dt);
        break;
      case 'CATCH':
        this.updateCatch(dt);
        break;
    }

    // Smoothly interpolate current joints toward targets
    const lerpSpeed = Math.min(1.0, dt * 20);
    for (const key in this.joints) {
      if (typeof this.joints[key] === 'number' && typeof this.targetJoints[key] === 'number') {
        this.joints[key] = Phaser.Math.Linear(this.joints[key], this.targetJoints[key], lerpSpeed);
      }
    }
  }

  evaluateAutomaticState(speed, isSwinging) {
    if (this.state === 'WEB_SHOOT' && this.isShooting) return;
    if (this.state === 'RECOVERY') return;
    if (this.state === 'CATCH') return;
    if (this.state === 'LAND' && this.stateTime < 0.22) return;

    if (isSwinging) {
      if (this.state === 'WEB_ATTACH' && this.stateTime < 0.16) return;
      if (speed > 520) {
        this.setState('SWING_FAST');
      } else if (this.stateTime < 0.28 && this.previousState !== 'SWING_LOOP') {
        this.setState('SWING_START');
      } else {
        this.setState('SWING_LOOP');
      }
      return;
    }

    // Grounded vs Airborne
    if (this.hero.isGrounded) {
      if (Math.abs(this.hero.vx) > 30) {
        this.setState('RUN');
      } else {
        this.setState('IDLE');
      }
    } else {
      if (this.state === 'SWING_RELEASE' && this.stateTime < 0.28) {
        return;
      }
      if (this.hero.vy < -60) {
        this.setState('JUMP');
      } else {
        this.setState('FALL');
      }
    }
  }

  // =========================================================================
  // 1. IDLE: Iconic Low 3-Point Spider Perch / Gargoyle Crouch (ZERO WALKING/STANDING)
  // =========================================================================
  updateIdle(dt) {
    const breath = Math.sin(this.breathingPhase * 1.5);

    // Deep predatory arachnid crouch coiled low over the rooftop
    this.targetJoints.torsoY = 24 + breath * 1.8;
    this.targetJoints.torsoScaleY = 0.94 + breath * 0.03;
    this.targetJoints.torsoScaleX = 1.06 - breath * 0.02;
    this.targetJoints.torsoTilt = 0.52; // Forward predatory lean

    // Head raised, chin up scanning the Manhattan skyline
    this.targetJoints.headAngle = -0.52;
    this.targetJoints.headY = -24 + breath * 1.0;
    this.targetJoints.lensSquint = 0.35; // Sharp, focused, calculating eyes

    // Leading arm planted flat on roof with 5 splayed gripping spider fingers
    this.targetJoints.leftArmAngle = -0.75;
    this.targetJoints.leftForearmAngle = 1.35;

    // Trailing arm cocked back near hip, web shooter ready
    this.targetJoints.rightArmAngle = 0.45;
    this.targetJoints.rightForearmAngle = 0.85;

    // Deep arachnid crouch legs: front knee tucked high, rear leg braced
    this.targetJoints.leftThighAngle = -1.25;
    this.targetJoints.leftKneeAngle = 2.25;
    this.targetJoints.rightThighAngle = 0.72;
    this.targetJoints.rightKneeAngle = 1.42;
  }

  // =========================================================================
  // 2. RUN: Acrobatic Spider-Dash / Knuckle-Vault Bound (ABSOLUTELY NO WALKING)
  // =========================================================================
  updateRun(dt, speed) {
    const strideFreq = Math.max(10, Math.min(26, speed * 0.032));
    this.gaitPhase += dt * strideFreq;

    const phase = this.gaitPhase;
    const sin1 = Math.sin(phase);
    const cos1 = Math.cos(phase);
    const boundBounce = Math.abs(Math.sin(phase));

    // Low aerodynamic hunting posture - chest parallel and low to the rooftop
    const sprintLean = Math.min(0.72, Math.max(0.55, speed / 800));
    this.targetJoints.torsoTilt = sprintLean;
    this.targetJoints.torsoY = 18 + boundBounce * 6.0;
    this.targetJoints.torsoScaleY = 0.92 + boundBounce * 0.08;
    this.targetJoints.torsoScaleX = 1.08 - boundBounce * 0.08;

    // Head locked horizontally ahead into sprint vector
    this.targetJoints.headAngle = -sprintLean * 0.90;
    this.targetJoints.headY = -28 + boundBounce * 3.5;
    this.targetJoints.lensSquint = 0.85; // Razor-sharp predatory slit

    // Alternating ground-brush knuckle-vault plants
    this.targetJoints.leftArmAngle = -0.90 + sin1 * 0.55;
    this.targetJoints.leftForearmAngle = 1.40 + cos1 * 0.35;
    this.targetJoints.rightArmAngle = 0.95 - sin1 * 0.55;
    this.targetJoints.rightForearmAngle = 0.60 - cos1 * 0.35;

    // Explosive bounding spider kicks driving backward
    this.targetJoints.leftThighAngle = sin1 * 1.30;
    this.targetJoints.leftKneeAngle = Math.max(0.4, 1.45 - cos1 * 1.25);
    this.targetJoints.rightThighAngle = -sin1 * 1.30;
    this.targetJoints.rightKneeAngle = Math.max(0.4, 1.45 + cos1 * 1.25);
  }

  // =========================================================================
  // 3. JUMP: Explosive Acrobatic Tuck Launch
  // =========================================================================
  updateJump(dt) {
    this.targetJoints.torsoTilt = -0.18;
    this.targetJoints.torsoScaleY = 1.15;
    this.targetJoints.torsoScaleX = 0.90;
    this.targetJoints.headAngle = -0.32;
    this.targetJoints.headY = -42;
    this.targetJoints.lensSquint = 0.45;

    this.targetJoints.leftArmAngle = -1.25;
    this.targetJoints.leftForearmAngle = 0.35;
    this.targetJoints.rightArmAngle = -1.05;
    this.targetJoints.rightForearmAngle = 0.45;

    this.targetJoints.leftThighAngle = -0.45;
    this.targetJoints.leftKneeAngle = 0.95;
    this.targetJoints.rightThighAngle = -0.25;
    this.targetJoints.rightKneeAngle = 0.75;
  }

  // =========================================================================
  // 4. FALL: Aerodynamic Headfirst Pike Dive
  // =========================================================================
  updateFall(dt) {
    this.targetJoints.torsoTilt = 0.38;
    this.targetJoints.torsoScaleY = 1.12;
    this.targetJoints.torsoScaleX = 0.92;
    this.targetJoints.headAngle = 0.22;
    this.targetJoints.headY = -38;
    this.targetJoints.lensSquint = 0.55;

    this.targetJoints.leftArmAngle = 0.95;
    this.targetJoints.leftForearmAngle = 0.35;
    this.targetJoints.rightArmAngle = 0.95;
    this.targetJoints.rightForearmAngle = 0.35;

    this.targetJoints.leftThighAngle = 0.32;
    this.targetJoints.leftKneeAngle = 0.35;
    this.targetJoints.rightThighAngle = 0.42;
    this.targetJoints.rightKneeAngle = 0.25;
  }

  // =========================================================================
  // 5. WEB_SHOOT: Classic "THWIP" Fire Sequence
  // =========================================================================
  updateWebShoot(dt) {
    this.shootSequenceTime += dt;
    const t = this.shootSequenceTime;

    if (t < 0.08) {
      this.targetJoints.leftArmAngle = this.shootAngle * 0.9;
      this.targetJoints.leftForearmAngle = -0.1;
      this.targetJoints.lensSquint = 0.95;
    } else if (t < 0.18) {
      this.targetJoints.leftArmAngle = this.shootAngle * 0.85 + 0.12;
      this.targetJoints.leftForearmAngle = 0.18;
      this.targetJoints.torsoTilt = -0.12;
    } else {
      this.isShooting = false;
    }
  }

  // =========================================================================
  // 6. WEB_ATTACH: Dynamic Tension Arc
  // =========================================================================
  updateWebAttach(dt) {
    this.attachShockTime += dt;
    this.targetJoints.leftArmAngle = -1.45;
    this.targetJoints.leftForearmAngle = 0.15;
    this.targetJoints.rightArmAngle = 0.65;
    this.targetJoints.torsoTilt = -0.22;
    this.targetJoints.torsoScaleY = 1.14;
    this.targetJoints.lensSquint = 0.75;
  }

  // =========================================================================
  // 7. SWING_START: Pendulum Dive Inception
  // =========================================================================
  updateSwingStart(dt, swingAngle) {
    this.targetJoints.leftArmAngle = -1.55 - swingAngle * 0.4;
    this.targetJoints.leftForearmAngle = 0.15;
    this.targetJoints.rightArmAngle = 0.75;
    this.targetJoints.rightForearmAngle = 0.35;
    this.targetJoints.torsoTilt = swingAngle * 0.65;
    this.targetJoints.headAngle = -swingAngle * 0.4;
    this.targetJoints.leftThighAngle = -0.35 + swingAngle * 0.3;
    this.targetJoints.leftKneeAngle = 0.85;
    this.targetJoints.rightThighAngle = 0.25 - swingAngle * 0.3;
    this.targetJoints.rightKneeAngle = 0.55;
  }

  // =========================================================================
  // 8. SWING_LOOP: Fluid Comic Web-Swing
  // =========================================================================
  updateSwingLoop(dt, swingAngle, angularVelocity) {
    this.targetJoints.leftArmAngle = -1.58 - swingAngle * 0.35;
    this.targetJoints.leftForearmAngle = 0.18;
    this.targetJoints.rightArmAngle = 0.65 + swingAngle * 0.25;
    this.targetJoints.rightForearmAngle = 0.45;
    this.targetJoints.torsoTilt = swingAngle * 0.75;
    this.targetJoints.headAngle = -swingAngle * 0.45;
    this.targetJoints.lensSquint = 0.45;

    this.targetJoints.leftThighAngle = -0.55 + swingAngle * 0.6;
    this.targetJoints.leftKneeAngle = Math.max(0.2, 0.95 - swingAngle * 0.4);
    this.targetJoints.rightThighAngle = 0.45 - swingAngle * 0.6;
    this.targetJoints.rightKneeAngle = Math.max(0.2, 0.65 + swingAngle * 0.4);
  }

  // =========================================================================
  // 9. SWING_FAST: High-G Speed Streamlining
  // =========================================================================
  updateSwingFast(dt, swingAngle, angularVelocity, speed) {
    this.targetJoints.leftArmAngle = -1.62 - swingAngle * 0.25;
    this.targetJoints.leftForearmAngle = 0.12;
    this.targetJoints.rightArmAngle = 1.15;
    this.targetJoints.rightForearmAngle = 0.25;
    this.targetJoints.torsoTilt = swingAngle * 0.85;
    this.targetJoints.torsoScaleX = 0.88;
    this.targetJoints.torsoScaleY = 1.18;
    this.targetJoints.lensSquint = 0.90;

    this.targetJoints.leftThighAngle = -0.75 + swingAngle * 0.4;
    this.targetJoints.leftKneeAngle = 0.45;
    this.targetJoints.rightThighAngle = 0.55 - swingAngle * 0.4;
    this.targetJoints.rightKneeAngle = 0.35;
  }

  // =========================================================================
  // 10. SWING_RELEASE: Aerial Acrobatic Somersault
  // =========================================================================
  updateSwingRelease(dt) {
    this.releaseFlipAngle += dt * 9.5;
    this.targetJoints.torsoTilt = -0.35;
    this.targetJoints.torsoScaleX = 0.92;
    this.targetJoints.torsoScaleY = 1.12;
    this.targetJoints.leftArmAngle = -1.25;
    this.targetJoints.leftForearmAngle = 0.45;
    this.targetJoints.rightArmAngle = -1.15;
    this.targetJoints.rightForearmAngle = 0.45;
    this.targetJoints.leftThighAngle = -0.85;
    this.targetJoints.leftKneeAngle = 1.45;
    this.targetJoints.rightThighAngle = -0.65;
    this.targetJoints.rightKneeAngle = 1.25;
  }

  // =========================================================================
  // 11. RECOVERY: Emergency Platform Grab / Wrist Inspect
  // =========================================================================
  updateRecovery(dt) {
    this.targetJoints.torsoTilt = 0.35;
    this.targetJoints.torsoY = 14;
    this.targetJoints.headAngle = 0.45;
    this.targetJoints.lensSquint = 0.85;

    this.targetJoints.leftArmAngle = -0.65;
    this.targetJoints.leftForearmAngle = 1.65;
    this.targetJoints.rightArmAngle = -0.25;
    this.targetJoints.rightForearmAngle = 1.35;

    this.targetJoints.leftThighAngle = -0.85;
    this.targetJoints.leftKneeAngle = 1.65;
    this.targetJoints.rightThighAngle = 0.45;
    this.targetJoints.rightKneeAngle = 0.85;
  }

  // =========================================================================
  // 12. LAND: Superhero 3-Point Ground Impact
  // =========================================================================
  updateLand(dt) {
    this.landingTime += dt;
    this.targetJoints.torsoTilt = 0.58;
    this.targetJoints.torsoY = 28;
    this.targetJoints.torsoScaleX = 1.15;
    this.targetJoints.torsoScaleY = 0.85;
    this.targetJoints.headAngle = -0.45;

    this.targetJoints.leftArmAngle = -0.75;
    this.targetJoints.leftForearmAngle = 1.45;
    this.targetJoints.rightArmAngle = 0.65;
    this.targetJoints.rightForearmAngle = 0.85;

    this.targetJoints.leftThighAngle = -1.35;
    this.targetJoints.leftKneeAngle = 2.45;
    this.targetJoints.rightThighAngle = 0.85;
    this.targetJoints.rightKneeAngle = 1.55;
  }

  // =========================================================================
  // 13. CATCH: Victorious Summit Perch
  // =========================================================================
  updateCatch(dt) {
    this.targetJoints.torsoTilt = 0.15;
    this.targetJoints.torsoY = 8;
    this.targetJoints.headAngle = -0.22;
    this.targetJoints.leftArmAngle = -0.85;
    this.targetJoints.leftForearmAngle = 0.45;
    this.targetJoints.rightArmAngle = 0.25;
    this.targetJoints.rightForearmAngle = 0.35;
  }

  // =========================================================================
  // HIGH-RESOLUTION 2D CANVAS RENDERER: RAZOR-SHARP MARVEL COMIC SPIDER-MAN
  // =========================================================================
  renderCanvas(ctx) {
    if (!ctx) return;

    // Clear 256x256 2x Retina canvas
    ctx.clearRect(0, 0, 256, 256);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const j = this.joints;

    // High-Definition Comic Superhero Palette
    const INK = '#020509';          // Crisp comic-book black ink keyline
    const RED = '#d9172b';          // Cinematic rich scarlet
    const RED_HI = '#ff4258';       // Muscular crest highlight
    const RED_SH = '#7a0815';       // Anatomical shadow
    const RED_DARK = '#40020a';     // Crease occlusion
    const BLUE = '#102a5c';         // Midnight royal navy
    const BLUE_HI = '#2052a2';      // Quad & latissimus crest
    const BLUE_SH = '#06132d';      // Shadowed navy
    const BLACK = '#020407';        // Carbon emblem & lens bezel
    const WHITE = '#ffffff';        // Pure optical reflection
    const LENS_CYAN = '#6eedff';    // Skyline specular glint
    const TECH_CYAN = '#00f0ff';    // Stark repulsor LED
    const RIM_GOLD = '#ffbe6b';     // Sunset rim lighting
    const WEB_LINE = '#0a0204';     // Web line ink
    const SOLE_COLOR = '#080e1a';   // Athletic rubber sole

    // Canvas Center Coordinates (2x coordinate space)
    const cx = 128;
    const cy = 128 + j.torsoY;

    // Helper: Draw continuous, organic muscle limbs with smooth bezier curves (ZERO polygon blockiness)
    const drawSmoothMuscle = (x1, y1, x2, y2, w1, wMid, w2, baseColor, hiColor, shColor, addRim = false) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.001) return;
      const nx = -dy / len;
      const ny = dx / len;

      const midX = (x1 + x2) * 0.5;
      const midY = (y1 + y2) * 0.5;

      const p1a = { x: x1 + nx * w1 * 0.5, y: y1 + ny * w1 * 0.5 };
      const p1b = { x: x1 - nx * w1 * 0.5, y: y1 - ny * w1 * 0.5 };
      const pMa = { x: midX + nx * wMid * 0.56, y: midY + ny * wMid * 0.56 };
      const pMb = { x: midX - nx * wMid * 0.56, y: midY - ny * wMid * 0.56 };
      const p2a = { x: x2 + nx * w2 * 0.5, y: y2 + ny * w2 * 0.5 };
      const p2b = { x: x2 - nx * w2 * 0.5, y: y2 - ny * w2 * 0.5 };

      // Base anatomical muscle shape with organic bezier curve
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.moveTo(p1a.x, p1a.y);
      ctx.quadraticCurveTo(pMa.x, pMa.y, p2a.x, p2a.y);
      ctx.lineTo(p2b.x, p2b.y);
      ctx.quadraticCurveTo(pMb.x, pMb.y, p1b.x, p1b.y);
      ctx.closePath();
      ctx.fill();

      // Shadow underside contour with smooth curve
      ctx.fillStyle = shColor;
      ctx.beginPath();
      ctx.moveTo(p1b.x, p1b.y);
      ctx.quadraticCurveTo(pMb.x, pMb.y, p2b.x, p2b.y);
      ctx.lineTo(midX, midY);
      ctx.closePath();
      ctx.fill();

      // Muscular crest highlight along top ridge
      ctx.strokeStyle = hiColor;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(p1a.x, p1a.y);
      ctx.quadraticCurveTo(pMa.x, pMa.y, p2a.x, p2a.y);
      ctx.stroke();

      // Golden sunset rim light
      if (addRim) {
        ctx.strokeStyle = RIM_GOLD;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(p1b.x, p1b.y);
        ctx.quadraticCurveTo(pMb.x, pMb.y, p2b.x, p2b.y);
        ctx.stroke();
      }

      // Razor-Sharp Comic Black Ink Outline
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(p1a.x, p1a.y);
      ctx.quadraticCurveTo(pMa.x, pMa.y, p2a.x, p2a.y);
      ctx.lineTo(p2b.x, p2b.y);
      ctx.quadraticCurveTo(pMb.x, pMb.y, p1b.x, p1b.y);
      ctx.closePath();
      ctx.stroke();
    };

    // =========================================================================
    // LAYER 1: BACK LIMBS (DEPTH & SHADOW LAYER)
    // =========================================================================

    // 1A. Back Arm (Right Arm)
    const rShoulderX = cx - 14;
    const rShoulderY = cy - 24;
    const rArmLen = 32;
    const rForeLen = 30;

    const rElbowX = rShoulderX + Math.sin(j.rightArmAngle) * rArmLen;
    const rElbowY = rShoulderY + Math.cos(j.rightArmAngle) * rArmLen;
    const rHandX = rElbowX + Math.sin(j.rightArmAngle + j.rightForearmAngle) * rForeLen;
    const rHandY = rElbowY + Math.cos(j.rightArmAngle + j.rightForearmAngle) * rForeLen;

    // Muscular Back Deltoid & Bicep
    drawSmoothMuscle(rShoulderX, rShoulderY, rElbowX, rElbowY, 15, 18, 13, RED_SH, RED, RED_DARK, false);
    // Back Forearm
    drawSmoothMuscle(rElbowX, rElbowY, rHandX, rHandY, 13, 15, 10, RED_SH, RED, RED_DARK, false);

    // Back Hand (Flexed Claw)
    ctx.fillStyle = RED_SH;
    ctx.beginPath();
    ctx.arc(rHandX, rHandY, 6.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // 1B. Back Leg (Right Leg)
    const rHipX = cx - 8;
    const rHipY = cy + 16;
    const thighLen = 38;
    const calfLen = 38;

    const rKneeX = rHipX + Math.sin(j.rightThighAngle) * thighLen;
    const rKneeY = rHipY + Math.cos(j.rightThighAngle) * thighLen;
    const rFootX = rKneeX + Math.sin(j.rightThighAngle + j.rightKneeAngle) * calfLen;
    const rFootY = rKneeY + Math.cos(j.rightThighAngle + j.rightKneeAngle) * calfLen;

    // Shadowed Navy Thigh
    drawSmoothMuscle(rHipX, rHipY, rKneeX, rKneeY, 19, 23, 15, BLUE_SH, BLUE, '#030916', true);
    // Shadowed Red Boot
    drawSmoothMuscle(rKneeX, rKneeY, rFootX, rFootY, 16, 18, 11, RED_SH, RED, RED_DARK, true);

    // Back Boot Foot & Sole
    ctx.fillStyle = RED_SH;
    ctx.beginPath();
    ctx.moveTo(rFootX - 8, rFootY - 5);
    ctx.lineTo(rFootX + 14, rFootY - 3);
    ctx.lineTo(rFootX + 18, rFootY + 5);
    ctx.lineTo(rFootX - 8, rFootY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = SOLE_COLOR;
    ctx.fillRect(rFootX - 8, rFootY + 5, 26, 4.0);

    // =========================================================================
    // LAYER 2: TORSO & SUIT ANATOMY (ATHLETIC V-TAPER)
    // =========================================================================

    // Golden Sunset Rim on Hero Back
    ctx.fillStyle = RIM_GOLD;
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 32);
    ctx.lineTo(cx - 16, cy - 32);
    ctx.lineTo(cx - 12, cy + 16);
    ctx.lineTo(cx - 20, cy + 16);
    ctx.closePath();
    ctx.fill();

    // Blue Hips & Athletic Pelvis
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 4);
    ctx.lineTo(cx + 18, cy + 4);
    ctx.lineTo(cx + 14, cy + 22);
    ctx.lineTo(cx - 14, cy + 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Sculpted Superhero Red Torso (Athletic V-Taper: Broad chest, tapered waist)
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 34); // Left shoulder
    ctx.lineTo(cx + 24, cy - 34); // Right shoulder
    ctx.quadraticCurveTo(cx + 20, cy - 12, cx + 14, cy + 6); // Right waist taper
    ctx.lineTo(cx - 14, cy + 6); // Lower waist
    ctx.quadraticCurveTo(cx - 20, cy - 12, cx - 24, cy - 34); // Left waist taper
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Muscular Pectoral Highlight Plates with Curved Cleavage
    ctx.fillStyle = RED_HI;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 30);
    ctx.lineTo(cx + 20, cy - 30);
    ctx.quadraticCurveTo(cx + 16, cy - 14, cx, cy - 10);
    ctx.quadraticCurveTo(cx - 16, cy - 14, cx - 20, cy - 30);
    ctx.closePath();
    ctx.fill();

    // Pectoral cleavage line
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 12);
    ctx.quadraticCurveTo(cx - 4, cy - 9, cx, cy - 9);
    ctx.quadraticCurveTo(cx + 4, cy - 9, cx + 18, cy - 12);
    ctx.stroke();

    // Defined Abdominal Divides
    ctx.strokeStyle = RED_DARK;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx, cy + 4);
    ctx.moveTo(cx - 10, cy - 4);
    ctx.lineTo(cx + 10, cy - 4);
    ctx.moveTo(cx - 8, cy + 1);
    ctx.lineTo(cx + 8, cy + 1);
    ctx.stroke();

    // Midnight Royal Blue Latissimus Ergonomic Side Panels
    ctx.fillStyle = BLUE;
    // Left lat panel
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 20);
    ctx.quadraticCurveTo(cx - 12, cy - 14, cx - 10, cy + 4);
    ctx.lineTo(cx - 14, cy + 6);
    ctx.quadraticCurveTo(cx - 20, cy - 10, cx - 24, cy - 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Right lat panel
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.moveTo(cx + 24, cy - 20);
    ctx.quadraticCurveTo(cx + 12, cy - 14, cx + 10, cy + 4);
    ctx.lineTo(cx + 14, cy + 6);
    ctx.quadraticCurveTo(cx + 20, cy - 10, cx + 24, cy - 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Fine Web Lattice across Chest
    ctx.strokeStyle = WEB_LINE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 24);
    ctx.quadraticCurveTo(cx, cy - 22, cx + 16, cy - 24);
    ctx.moveTo(cx - 14, cy - 16);
    ctx.quadraticCurveTo(cx, cy - 14, cx + 14, cy - 16);
    ctx.moveTo(cx - 12, cy - 2);
    ctx.quadraticCurveTo(cx, cy, cx + 12, cy - 2);
    ctx.moveTo(cx, cy - 34);
    ctx.lineTo(cx, cy - 10);
    ctx.stroke();

    // ICONIC NEEDLE-SHARP BLACK SPIDER CHEST EMBLEM
    ctx.fillStyle = BLACK;
    // Cephalothorax & abdomen
    ctx.beginPath();
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx + 5.5, cy - 15);
    ctx.lineTo(cx + 3.5, cy - 9);
    ctx.lineTo(cx, cy - 5);
    ctx.lineTo(cx - 3.5, cy - 9);
    ctx.lineTo(cx - 5.5, cy - 15);
    ctx.closePath();
    ctx.fill();

    // Razor-Sharp Arachnid Legs (Slicing gracefully across the chest)
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    // Upper legs
    ctx.moveTo(cx - 3, cy - 18);
    ctx.quadraticCurveTo(cx - 11, cy - 26, cx - 19, cy - 29);
    ctx.moveTo(cx + 3, cy - 18);
    ctx.quadraticCurveTo(cx + 11, cy - 26, cx + 19, cy - 29);
    // Middle upper legs
    ctx.moveTo(cx - 4, cy - 15);
    ctx.quadraticCurveTo(cx - 14, cy - 19, cx - 21, cy - 21);
    ctx.moveTo(cx + 4, cy - 15);
    ctx.quadraticCurveTo(cx + 14, cy - 19, cx + 21, cy - 21);
    // Lower middle legs
    ctx.moveTo(cx - 3, cy - 11);
    ctx.quadraticCurveTo(cx - 14, cy - 7, cx - 19, cy - 5);
    ctx.moveTo(cx + 3, cy - 11);
    ctx.quadraticCurveTo(cx + 14, cy - 7, cx + 19, cy - 5);
    // Bottom legs
    ctx.moveTo(cx - 2.5, cy - 8);
    ctx.quadraticCurveTo(cx - 10, cy - 2, cx - 14, cy + 3);
    ctx.moveTo(cx + 2.5, cy - 8);
    ctx.quadraticCurveTo(cx + 10, cy - 2, cx + 14, cy + 3);
    ctx.stroke();

    // =========================================================================
    // LAYER 3: FRONT LEG (FULL MUSCULAR ANATOMY)
    // =========================================================================

    const lHipX = cx + 8;
    const lHipY = cy + 16;
    const lKneeX = lHipX + Math.sin(j.leftThighAngle) * thighLen;
    const lKneeY = lHipY + Math.cos(j.leftThighAngle) * thighLen;
    const lFootX = lKneeX + Math.sin(j.leftThighAngle + j.leftKneeAngle) * calfLen;
    const lFootY = lKneeY + Math.cos(j.leftThighAngle + j.leftKneeAngle) * calfLen;

    // Muscular Sculpted Front Quadriceps (Midnight Navy)
    drawSmoothMuscle(lHipX, lHipY, lKneeX, lKneeY, 20, 25, 16, BLUE, BLUE_HI, BLUE_SH, false);

    // Anatomical Knee Patella Cap
    ctx.fillStyle = BLUE_HI;
    ctx.beginPath();
    ctx.arc(lKneeX, lKneeY, 8.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Athletic Red Boot (Curved calf sweep)
    drawSmoothMuscle(lKneeX, lKneeY, lFootX, lFootY, 17, 19, 12, RED, RED_HI, RED_SH, false);

    // Boot Heel Counter & Pointed Athletic Toe
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(lFootX - 8, lFootY - 5);
    ctx.lineTo(lFootX + 12, lFootY - 4);
    ctx.lineTo(lFootX + 20, lFootY + 2); // Pointed athletic toe!
    ctx.lineTo(lFootX + 16, lFootY + 6.4);
    ctx.lineTo(lFootX - 8, lFootY + 6.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // High-Traction Rubber Boot Tread
    ctx.fillStyle = SOLE_COLOR;
    ctx.fillRect(lFootX - 8, lFootY + 6.0, 26, 4.0);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(lFootX - 8, lFootY + 6.0, 26, 4.0);

    // =========================================================================
    // LAYER 4: HEAD & AERODYNAMIC COWL (HEROIC PROPORTIONS)
    // =========================================================================

    // Realistic head position & size (proportional 32px height in 2x space = 16px on screen)
    const hx = cx + Math.sin(j.headAngle) * 8;
    const hy = cy + j.headY;

    // Sunset Rim Lighting on Back of Cowl
    ctx.fillStyle = RIM_GOLD;
    ctx.beginPath();
    ctx.moveTo(hx - 4, hy - 22);
    ctx.quadraticCurveTo(hx - 18, hy - 10, hx - 20, hy + 4);
    ctx.lineTo(hx - 10, hy + 18);
    ctx.closePath();
    ctx.fill();

    // Sleek Aerodynamic Cowl (Curved cranium, athletic cheekbones, tapered chin)
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 22); // Cranial apex
    ctx.quadraticCurveTo(hx + 15, hy - 20, hx + 15, hy - 12); // Front temple
    ctx.quadraticCurveTo(hx + 17, hy + 3, hx + 6, hy + 21);   // Cheekbone to chin point
    ctx.quadraticCurveTo(hx - 8, hy + 18, hx - 16, hy + 3);   // Chin to jawline
    ctx.quadraticCurveTo(hx - 16, hy - 12, hx - 14, hy - 16); // Back temple
    ctx.quadraticCurveTo(hx - 10, hy - 22, hx, hy - 22);      // Crown curve
    ctx.closePath();
    ctx.fill();

    // Crisp Comic Black Ink Outline on Cowl
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Subtle Cowl Cranial Highlight
    ctx.fillStyle = RED_HI;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 19);
    ctx.quadraticCurveTo(hx + 11, hy - 10, hx + 10, hy - 3);
    ctx.lineTo(hx, hy - 6);
    ctx.closePath();
    ctx.fill();

    // Radial Web Grid on Mask
    ctx.strokeStyle = WEB_LINE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    // Radial spokes radiating from nose bridge
    ctx.moveTo(hx + 2, hy);
    ctx.lineTo(hx, hy - 22);
    ctx.moveTo(hx + 2, hy);
    ctx.lineTo(hx + 15, hy - 12);
    ctx.moveTo(hx + 2, hy);
    ctx.lineTo(hx + 17, hy + 3);
    ctx.moveTo(hx + 2, hy);
    ctx.lineTo(hx + 6, hy + 21);
    ctx.moveTo(hx + 2, hy);
    ctx.lineTo(hx - 16, hy + 3);
    ctx.moveTo(hx + 2, hy);
    ctx.lineTo(hx - 14, hy - 16);
    ctx.stroke();

    // Concentric web arches on mask
    ctx.beginPath();
    ctx.arc(hx, hy, 9.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx, hy, 17.0, 0, Math.PI * 2);
    ctx.stroke();

    // =========================================================================
    // LAYER 4B: SIGNATURE McFARLANE / BAGLEY TEARDROP LENSES
    // =========================================================================

    const eyeSquint = j.lensSquint; // -1 to 1
    const eyeH = Math.max(5.0, 15.0 - eyeSquint * 7.0);
    const eyeW = Math.max(11.0, 20.0 + eyeSquint * 3.0);

    const fEyeX = hx + 5.0;
    const bEyeX = hx - 8.0;
    const eyeY = hy - 1.0;

    // FRONT EYE LENS: Iconic comic teardrop with razor-sharp upward wing
    // 1. Bold Jet-Black Carbon Bezel Frame
    ctx.fillStyle = BLACK;
    ctx.beginPath();
    ctx.moveTo(fEyeX - 5.0, eyeY + 1.6); // Inner notch
    ctx.quadraticCurveTo(fEyeX - 1.0, eyeY - eyeH * 0.6 - 2.4, fEyeX + 11.6, eyeY - eyeH * 0.45 - 3.6); // Sharp wing!
    ctx.quadraticCurveTo(fEyeX + 3.6, eyeY + eyeH * 0.65 + 2.4, fEyeX - 5.0, eyeY + 1.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // 2. Pure Glowing White Reflective Lens Interior
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(fEyeX - 3.6, eyeY + 1.2);
    ctx.quadraticCurveTo(fEyeX - 0.4, eyeY - eyeH * 0.55, fEyeX + 9.6, eyeY - eyeH * 0.42);
    ctx.quadraticCurveTo(fEyeX + 2.4, eyeY + eyeH * 0.55, fEyeX - 3.6, eyeY + 1.2);
    ctx.closePath();
    ctx.fill();

    // 3. Diagonal Electric Cyan Specular Skyline Streak
    ctx.fillStyle = LENS_CYAN;
    ctx.beginPath();
    ctx.moveTo(fEyeX + 0.4, eyeY - eyeH * 0.45);
    ctx.lineTo(fEyeX + 8.4, eyeY - eyeH * 0.35);
    ctx.lineTo(fEyeX + 2.0, eyeY + 0.4);
    ctx.closePath();
    ctx.fill();

    // 4. Razor White Diamond Glints
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(fEyeX + 6.4, eyeY - eyeH * 0.35, 2.0, 0, Math.PI * 2);
    ctx.arc(fEyeX + 2.0, eyeY - eyeH * 0.45, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // BACK EYE LENS (Perspective Depth Layer)
    ctx.fillStyle = BLACK;
    ctx.beginPath();
    ctx.moveTo(bEyeX - 4.0, eyeY + 1.6);
    ctx.quadraticCurveTo(bEyeX - 0.8, eyeY - eyeH * 0.5 - 2.0, bEyeX + eyeW * 0.35 + 3.0, eyeY - eyeH * 0.35 - 3.0);
    ctx.quadraticCurveTo(bEyeX + 3.6, eyeY + eyeH * 0.55 + 2.0, bEyeX - 4.0, eyeY + 1.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(bEyeX - 2.8, eyeY + 1.2);
    ctx.quadraticCurveTo(bEyeX - 0.4, eyeY - eyeH * 0.45, bEyeX + eyeW * 0.35, eyeY - eyeH * 0.3);
    ctx.quadraticCurveTo(bEyeX + 2.4, eyeY + eyeH * 0.45, bEyeX - 2.8, eyeY + 1.2);
    ctx.closePath();
    ctx.fill();

    // Brow Crease above Lenses
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(fEyeX - 7.0, eyeY - eyeH * 0.55);
    ctx.lineTo(fEyeX + 6.0, eyeY - eyeH * 0.80);
    ctx.stroke();

    // =========================================================================
    // LAYER 5: FRONT ARM & STARK MK-IV WEB-SHOOTER GAUNTLET
    // =========================================================================

    const lShoulderX = cx + 14;
    const lShoulderY = cy - 24;

    const lElbowX = lShoulderX + Math.sin(j.leftArmAngle) * rArmLen;
    const lElbowY = lShoulderY + Math.cos(j.leftArmAngle) * rArmLen;
    const lHandX = lElbowX + Math.sin(j.leftArmAngle + j.leftForearmAngle) * rForeLen;
    const lHandY = lElbowY + Math.cos(j.leftArmAngle + j.leftForearmAngle) * rForeLen;

    // Muscular Deltoid & Bicep (Left Arm)
    drawSmoothMuscle(lShoulderX, lShoulderY, lElbowX, lElbowY, 17, 20, 14, RED, RED_HI, RED_SH, false);
    // Sculpted Forearm
    drawSmoothMuscle(lElbowX, lElbowY, lHandX, lHandY, 14, 16, 11, RED, RED_HI, RED_SH, false);

    // Stark MK-IV Web-Shooter Wrist Gauntlet
    ctx.fillStyle = '#141e2e';
    ctx.beginPath();
    ctx.roundRect(lHandX - 7.0, lHandY - 9.0, 14.0, 14.0, 3.0);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Silver Guide Rails
    ctx.fillStyle = '#c0d2e8';
    ctx.fillRect(lHandX - 6.0, lHandY - 7.6, 12.0, 2.4);
    ctx.fillRect(lHandX - 6.0, lHandY + 3.0, 12.0, 2.4);

    // Active Stark Diode (Glowing Cyan LED)
    const ledPulse = 0.85 + Math.sin(this.stateTime * 14) * 0.15;
    ctx.fillStyle = TECH_CYAN;
    ctx.beginPath();
    ctx.arc(lHandX + 1.6, lHandY - 2.0, 4.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(lHandX + 1.6, lHandY - 2.0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // =========================================================================
    // ARTICULATED HAND & SPIDER FINGERS
    // =========================================================================

    if (this.state === 'WEB_SHOOT') {
      // Classic "THWIP" Web Shooting Gesture:
      // Middle & ring depressed to palm trigger, index & pinky extended!
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(lHandX, lHandY, 7.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Depressed fingers on trigger stud
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.arc(lHandX + 3.0, lHandY, 3.6, 0, Math.PI * 2);
      ctx.fill();

      // Extended Razor Index Finger
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(lHandX, lHandY - 5.0);
      ctx.lineTo(lHandX + 14.0, lHandY - 9.0);
      ctx.stroke();
      ctx.strokeStyle = RED_HI;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Extended Razor Pinky Finger
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(lHandX, lHandY + 5.0);
      ctx.lineTo(lHandX + 12.0, lHandY + 9.0);
      ctx.stroke();
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Web Muzzle Burst Flash if firing
      if (this.shootSequenceTime < 0.16) {
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(lHandX + 10, lHandY, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = TECH_CYAN;
        ctx.beginPath();
        ctx.arc(lHandX + 16, lHandY, 19, 0, Math.PI * 2);
        ctx.fill();
        // Spark needles
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(lHandX, lHandY);
        ctx.lineTo(lHandX + 30, lHandY - 12);
        ctx.moveTo(lHandX, lHandY);
        ctx.lineTo(lHandX + 36, lHandY);
        ctx.moveTo(lHandX, lHandY);
        ctx.lineTo(lHandX + 30, lHandY + 12);
        ctx.stroke();
      }
    } else if (this.state === 'IDLE') {
      // 3-POINT SPIDER PERCH GROUND PLANT:
      // 5 Distinct Articulated Spider Fingers Gripping the Rooftop Coping Stone!
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.moveTo(lHandX - 5.0, lHandY - 5.0);
      ctx.lineTo(lHandX + 7.0, lHandY - 3.6);
      ctx.lineTo(lHandX + 5.0, lHandY + 3.6);
      ctx.lineTo(lHandX - 5.0, lHandY + 3.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      const drawSpiderFinger = (fx1, fy1, fx2, fy2) => {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(fx1, fy1);
        ctx.lineTo(fx2, fy2);
        ctx.stroke();
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.arc(fx2, fy2, 1.6, 0, Math.PI * 2);
        ctx.fill();
      };

      // Thumb braced backward
      drawSpiderFinger(lHandX - 3.0, lHandY, lHandX - 10.0, lHandY + 5.0);
      // Index finger arched forward
      drawSpiderFinger(lHandX + 3.0, lHandY - 1.6, lHandX + 12.0, lHandY + 5.0);
      // Middle finger longest grasp
      drawSpiderFinger(lHandX + 5.0, lHandY, lHandX + 15.0, lHandY + 7.0);
      // Ring finger angled grasp
      drawSpiderFinger(lHandX + 3.6, lHandY + 1.6, lHandX + 13.0, lHandY + 8.4);
      // Pinky finger outer grip
      drawSpiderFinger(lHandX + 1.6, lHandY + 3.2, lHandX + 10.0, lHandY + 10.0);
    } else {
      // DYNAMIC CLAW / SPRINT GRASP HAND
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(lHandX, lHandY, 7.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.fillStyle = RED_HI;
      ctx.beginPath();
      ctx.arc(lHandX + 3.0, lHandY - 2.4, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.arc(lHandX, lHandY + 0.8, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Flexed claw fingers
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(lHandX + 3.0, lHandY - 3.0);
      ctx.lineTo(lHandX + 10.0, lHandY - 5.0);
      ctx.moveTo(lHandX + 4.4, lHandY);
      ctx.lineTo(lHandX + 11.6, lHandY + 2.0);
      ctx.stroke();
      ctx.strokeStyle = RED_HI;
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }
  }

  // Fallback legacy vector renderer
  render(gfx) {
    // Handled by renderCanvas via dynamic texture
  }
}

if (typeof window !== 'undefined') {
  window.SpiderManAnimator = SpiderManAnimator;
}
