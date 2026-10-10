/**
 * SpiderHero - 4-Image Dynamic Motion Character Engine
 *
 * Implements a high-performance 2D sprite motion system reusing 4 core
 * Spider-Man action images with procedural secondary kinematics:
 * 1. Grounded 3-Point Perch (spiderman_idle / spiderman_recovery_grab)
 * 2. Dynamic Rooftop Sprint Leap & Vault (spiderman_sprint)
 * 3. High-Tension Web-Line Swing Arc (spiderman_swing)
 * 4. Aerodynamic Aerial Dive & Traversal Kick (spiderman_dive)
 * Contextual: spiderman_malfunction_stagger & spiderman_wrist_examine
 *
 * Kinematic features:
 * - Velocity-driven multi-beat run cycle (alternating sprint vault & contact perch)
 * - Rhythmic idle breathing respiration
 * - Pendulum angular banking along web swing trajectories
 * - Velocity vector alignment & aerodynamic stretch during freefall dives
 * - Rooftop landing impact squash & stretch recovery
 * - Multi-layer afterimage speed trails with Marvel red & Stark cyan aura
 */
class SpiderHero {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    // Dimensions & Pose
    this.width = 36;
    this.height = 54;
    this.scaleX = 1;
    this.scaleY = 1;
    this.heroScale = 1.25; // Cinematic hero proportion factor
    this.rotation = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.isGrounded = false;
    this.wasGrounded = false;

    // Pose states: IDLE, RUN, DIVE, SWING, RELEASE_AERIAL, MALFUNCTION_STAGGER, RECOVERY_GRAB, WRIST_EXAMINE
    this.pose = 'IDLE';
    this.currentTextureKey = 'spiderman_idle';
    this.animTimer = 0;

    // Multi-beat run cycle clock & parameters
    this.runCycleTimer = 0;
    this.runBeat = 0; // 0=vault, 1=contact, 2=extension, 3=pass
    this.verticalBobY = 0;
    this.dynamicTilt = 0;
    this.landingSquash = 0;

    // Motion Trail / Ghost system
    this.trailHistory = [];
    this.trailGfx = scene.add.graphics().setDepth(11);

    // Main character graphics container
    this.container = scene.add.container(x, y).setDepth(12);

    // Ensure 4 core character textures are registered in TextureManager
    this.ensureValidTexture('spiderman_idle');
    this.ensureValidTexture('spiderman_sprint');
    this.ensureValidTexture('spiderman_swing');
    this.ensureValidTexture('spiderman_dive');
    this.ensureValidTexture('spiderman_recovery_grab');
    this.ensureValidTexture('spiderman_malfunction_stagger');
    this.ensureValidTexture('spiderman_wrist_examine');

    // Primary High-Fidelity Character Sprite
    this.sprite = scene.add.image(0, -6, 'spiderman_idle')
      .setOrigin(0.5, 0.54)
      .setDisplaySize(94, 94);
    this.container.add(this.sprite);

    // Compatibility shim: Keep animator instance for any external telemetry or state queries
    if (typeof SpiderManAnimator !== 'undefined') {
      this.animator = new SpiderManAnimator(this, scene);
    } else {
      this.animator = {
        state: 'IDLE',
        joints: { torsoY: 0, torsoTilt: 0, torsoScaleX: 1, torsoScaleY: 1 },
        setState: () => {},
        update: () => {},
        triggerShoot: () => {},
        triggerRelease: () => {}
      };
    }

    // Set initial pose
    this.setPose('IDLE');
  }

  ensureValidTexture(key) {
    if (this.scene.textures.exists(key)) {
      const tex = this.scene.textures.get(key);
      if (tex && tex.key !== '__MISSING' && (!tex.source || !tex.source[0] || !tex.source[0].isMissing)) {
        return true;
      }
      this.scene.textures.remove(key);
    }
    if (typeof window !== 'undefined' && window.SPIDERMAN_ASSETS) {
      const uri = window.SPIDERMAN_ASSETS[key] || window.SPIDERMAN_ASSETS['spiderman_idle'] || window.SPIDERMAN_ASSETS['spiderman_recovery_grab'];
      if (uri) {
        const img = new Image();
        img.src = uri;
        this.scene.textures.addImage(key, img);
        return true;
      }
    }
    return false;
  }

  setPose(pose) {
    if (this.pose !== pose) {
      this.pose = pose;
      this.animTimer = 0;

      // Sync compatibility animator
      if (this.animator && this.animator.setState) {
        if (pose === 'IDLE') this.animator.setState('IDLE');
        else if (pose === 'RUN') this.animator.setState('RUN');
        else if (pose === 'SWING') this.animator.setState('SWING_LOOP');
        else if (pose === 'DIVE') this.animator.setState('FALL');
        else if (pose === 'RELEASE_AERIAL') this.animator.setState('SWING_RELEASE');
        else if (pose === 'MALFUNCTION_STAGGER') this.animator.setState('RECOVERY');
        else if (pose === 'RECOVERY_GRAB') this.animator.setState('LAND');
        else if (pose === 'WRIST_EXAMINE') this.animator.setState('RECOVERY');
      }

      this.resolveSpriteTexture();
    }
  }

  resolveSpriteTexture() {
    let key = 'spiderman_' + this.pose.toLowerCase();

    // Map semantic states to the 4 core images
    if (this.pose === 'RELEASE_AERIAL' || this.pose === 'DIVE') {
      key = 'spiderman_dive';
    } else if (this.pose === 'SWING') {
      key = 'spiderman_swing';
    } else if (this.pose === 'RUN') {
      // Run uses dynamic cycling between sprint and perch/contact
      key = (this.runBeat === 0 || this.runBeat === 2) ? 'spiderman_sprint' : 'spiderman_idle';
    } else if (this.pose === 'IDLE') {
      key = 'spiderman_idle';
    } else if (this.pose === 'RECOVERY_GRAB') {
      key = 'spiderman_recovery_grab';
    } else if (this.pose === 'MALFUNCTION_STAGGER') {
      key = 'spiderman_malfunction_stagger';
    } else if (this.pose === 'WRIST_EXAMINE') {
      key = 'spiderman_wrist_examine';
    }

    this.ensureValidTexture(key);

    if (this.sprite) {
      this.currentTextureKey = key;
      this.sprite.setTexture(key);
      this.sprite.setVisible(true);
    }
  }

  update(dt, input, isSwinging, swingAngle) {
    this.animTimer += dt;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    // Failsafe: if sprite texture is missing or invalid, re-bind immediately
    if (this.sprite && this.sprite.texture && (this.sprite.texture.key === '__MISSING' || (this.sprite.texture.source && this.sprite.texture.source[0] && this.sprite.texture.source[0].isMissing))) {
      this.ensureValidTexture(this.currentTextureKey);
      this.sprite.setTexture(this.currentTextureKey);
    }

    // Detect fresh landing impact for squash & stretch response
    if (this.isGrounded && !this.wasGrounded) {
      const impactVelocity = Math.abs(this.vy);
      this.landingSquash = Math.min(0.24, Math.max(0.08, impactVelocity / 1800));
    }
    this.wasGrounded = this.isGrounded;

    // Smoothly decay landing compression
    if (this.landingSquash > 0.005) {
      this.landingSquash = Phaser.Math.Linear(this.landingSquash, 0, dt * 12);
    } else {
      this.landingSquash = 0;
    }

    // Determine facing direction
    if (this.vx > 25) this.facing = 1;
    else if (this.vx < -25) this.facing = -1;

    // Reset base procedural offsets
    this.verticalBobY = 0;
    this.dynamicTilt = 0;
    let targetScaleX = 1.0;
    let targetScaleY = 1.0;

    // -------------------------------------------------------------
    // STATE MOTION CALCULATIONS (4-IMAGE REUSE ENGINE)
    // -------------------------------------------------------------
    if (this.pose === 'SWING' || isSwinging) {
      // 1. HIGH-TENSION WEB-LINE SWING ARC (Pose 3)
      this.currentTextureKey = 'spiderman_swing';
      if (this.sprite && this.scene.textures.exists('spiderman_swing')) {
        this.sprite.setTexture('spiderman_swing');
      }

      // Smooth centrifugal banking along pendulum arc
      const targetRotation = swingAngle * 0.85;
      this.rotation = Phaser.Math.Linear(this.rotation, targetRotation, dt * 10);

      // Centrifugal web line tension stretch
      targetScaleX = 0.94;
      targetScaleY = 1.08;

      // High-speed harmonic vibration along web
      if (speed > 420) {
        this.verticalBobY = Math.sin(this.animTimer * 40) * 1.6;
      }
    } else if (this.pose === 'DIVE' || this.pose === 'RELEASE_AERIAL' || (!this.isGrounded && this.vy > 60)) {
      // 2. AERODYNAMIC AERIAL DIVE & FREEFALL (Pose 4)
      this.currentTextureKey = 'spiderman_dive';
      if (this.sprite && this.scene.textures.exists('spiderman_dive')) {
        this.sprite.setTexture('spiderman_dive');
      }

      // Bank along flight trajectory vector
      const targetAngle = Math.atan2(this.vy, Math.max(90, Math.abs(this.vx) * 0.85)) * this.facing;
      this.rotation = Phaser.Math.Linear(this.rotation, targetAngle, dt * 8);

      // Aerodynamic elongation proportional to terminal velocity
      const diveStretch = Math.min(0.22, Math.max(0, (speed - 260) / 1200));
      targetScaleX = 1.0 + diveStretch;
      targetScaleY = 1.0 - diveStretch;
    } else if (this.isGrounded && Math.abs(this.vx) > 30) {
      // 3. MULTI-BEAT ROOFTOP SPRINT & VAULT (Pose 2 <-> Pose 1 Cycle)
      this.runCycleTimer += dt;
      // Step cadence scales dynamically with horizontal speed
      const speedFactor = Math.min(2.6, Math.max(0.6, Math.abs(this.vx) / 300));
      const stepInterval = Math.max(0.06, 0.13 / speedFactor);

      if (this.runCycleTimer >= stepInterval) {
        this.runCycleTimer = 0;
        this.runBeat = (this.runBeat + 1) % 4;
        this.resolveSpriteTexture();
      }

      // Kinematic 4-beat vault & contact dynamics
      if (this.runBeat === 0) {
        // Vault Leap (spiderman_sprint)
        this.verticalBobY = -5;
        this.dynamicTilt = 0.12 * this.facing;
        targetScaleX = 1.06;
        targetScaleY = 0.94;
      } else if (this.runBeat === 1) {
        // Contact Landing (spiderman_idle)
        this.verticalBobY = 3;
        this.dynamicTilt = 0.04 * this.facing;
        targetScaleX = 1.09;
        targetScaleY = 0.91;
      } else if (this.runBeat === 2) {
        // High Vault Extension (spiderman_sprint)
        this.verticalBobY = -7;
        this.dynamicTilt = 0.15 * this.facing;
        targetScaleX = 1.08;
        targetScaleY = 0.92;
      } else {
        // Passing Stride (spiderman_idle)
        this.verticalBobY = 2;
        this.dynamicTilt = 0.06 * this.facing;
        targetScaleX = 1.02;
        targetScaleY = 0.98;
      }
      this.rotation = Phaser.Math.Linear(this.rotation, this.dynamicTilt, dt * 14);
    } else if (this.pose === 'MALFUNCTION_STAGGER') {
      // 4. ELECTRICAL MALFUNCTION ERRATIC JITTER
      const key = this.scene.textures.exists('spiderman_malfunction_stagger') ? 'spiderman_malfunction_stagger' : 'spiderman_idle';
      if (this.sprite && this.currentTextureKey !== key) {
        this.currentTextureKey = key;
        this.sprite.setTexture(key);
      }
      this.rotation = Math.sin(this.animTimer * 34) * 0.22;
      targetScaleX = 0.94 + Math.cos(this.animTimer * 26) * 0.08;
      targetScaleY = 1.06 - Math.cos(this.animTimer * 26) * 0.08;
    } else if (this.pose === 'WRIST_EXAMINE') {
      // 5. WORKBENCH / FIRE ESCAPE INSPECTION
      const key = this.scene.textures.exists('spiderman_wrist_examine') ? 'spiderman_wrist_examine' : 'spiderman_idle';
      if (this.sprite && this.currentTextureKey !== key) {
        this.currentTextureKey = key;
        this.sprite.setTexture(key);
      }
      this.rotation = 0;
      targetScaleX = 1.0;
      targetScaleY = 1.0;
    } else {
      // 6. GROUNDED 3-POINT SPIDER PERCH (Pose 1: Idle)
      if (this.currentTextureKey !== 'spiderman_idle') {
        this.resolveSpriteTexture();
      }
      this.rotation = Phaser.Math.Linear(this.rotation, 0, dt * 12);

      // Subtle breathing respiration oscillation
      const breathPhase = Math.sin(this.animTimer * 2.8);
      targetScaleY = 1.0 + breathPhase * 0.035;
      targetScaleX = 1.0 - breathPhase * 0.02;
      this.verticalBobY = breathPhase * 1.5;
    }

    // Apply landing impact compression
    if (this.landingSquash > 0) {
      targetScaleY -= this.landingSquash;
      targetScaleX += this.landingSquash * 1.2;
      this.verticalBobY += this.landingSquash * 18;
    }

    // Smooth scale updates
    this.scaleX = Phaser.Math.Linear(this.scaleX, targetScaleX, dt * 14);
    this.scaleY = Phaser.Math.Linear(this.scaleY, targetScaleY, dt * 14);

    // Apply kinematics to container & sprite
    const groundAlignOffset = this.isGrounded ? -22 : 0;
    this.container.setPosition(this.x, this.y + groundAlignOffset + this.verticalBobY);
    this.container.setRotation(this.rotation);
    this.container.setScale(this.facing * this.scaleX * this.heroScale, this.scaleY * this.heroScale);

    // Motion Trail & Afterimages when moving at high speeds
    if (speed > 430) {
      this.trailHistory.unshift({
        x: this.x,
        y: this.y + groundAlignOffset + this.verticalBobY,
        rotation: this.rotation,
        textureKey: this.currentTextureKey,
        scaleX: this.scaleX,
        scaleY: this.scaleY,
        facing: this.facing,
        alpha: 0.50
      });
      if (this.trailHistory.length > 5) this.trailHistory.pop();
    } else {
      if (this.trailHistory.length > 0) this.trailHistory.shift();
    }
    this.renderTrail();

    // Sync compatibility animator if present
    if (this.animator && this.animator.update) {
      this.animator.update(dt, speed, isSwinging, swingAngle);
    }
  }

  renderTrail() {
    this.trailGfx.clear();

    // 1. Ground Contact Ambient Occlusion Shadow when on rooftop
    if (this.isGrounded) {
      const shadowWidth = 38 * Math.abs(this.scaleX) * this.heroScale;
      const shadowHeight = 8 * this.heroScale;
      this.trailGfx.fillStyle(0x060b14, 0.55);
      this.trailGfx.fillEllipse(this.x, this.y + 4, shadowWidth, shadowHeight);
      this.trailGfx.fillStyle(0x060b14, 0.30);
      this.trailGfx.fillEllipse(this.x, this.y + 4, shadowWidth * 1.3, shadowHeight * 1.4);
    }

    // 2. High-speed cinematic afterimage speed streaks
    for (let i = 0; i < this.trailHistory.length; i++) {
      const ghost = this.trailHistory[i];
      ghost.alpha *= 0.78;
      if (ghost.alpha < 0.04) continue;

      const gScale = 1.0 - (i * 0.09);

      // Stark cyan tech velocity streak
      this.trailGfx.fillStyle(CONFIG.COLORS.TECH_CYAN, ghost.alpha * 0.40);
      this.trailGfx.fillEllipse(ghost.x - 10 * ghost.facing, ghost.y - 10, 26 * gScale, 10 * gScale);

      // Trailing Marvel crimson suit afterimage silhouette
      this.trailGfx.fillStyle(CONFIG.COLORS.SPIDER_RED, ghost.alpha * 0.50);
      this.trailGfx.fillCircle(ghost.x - 4 * ghost.facing, ghost.y - 8, 16 * gScale);
      this.trailGfx.fillStyle(CONFIG.COLORS.SPIDER_BLUE, ghost.alpha * 0.40);
      this.trailGfx.fillCircle(ghost.x - 6 * ghost.facing, ghost.y + 6, 12 * gScale);
    }
  }

  renderPose() {
    // Kept for backward compatibility with state machine calls
    this.resolveSpriteTexture();
  }

  destroy() {
    if (this.trailGfx) this.trailGfx.destroy();
    if (this.container) this.container.destroy();
  }
}

if (typeof window !== 'undefined') {
  window.SpiderHero = SpiderHero;
}
