/**
 * ParallaxCity - Cinematic Multi-Layer 2.5D New York Superhero Cityscape
 *
 * Implements Stage 1 Visual Foundation:
 * - Rich cinematic sunset sky with golden-hour horizon glow & sun bloom
 * - Layered volumetric sunset clouds with warm illuminated underbellies
 * - Multi-tiered architectural silhouettes with spires, pinnacles, and communication masts
 * - Living window illumination (warm amber, cool cyan, dim offices)
 * - Warm sunset rim lighting on rooftops and architectural cornices
 * - High-fidelity iconic neon signage (Daily Bugle, Oscorp, Stark Tech)
 * - Industrial rooftop dressing (banded water towers, HVAC exhaust, balustrades)
 * - Fully preserved collision coordinates for all 12 rooftops & emergency recovery platform
 */

class ParallaxCity {
  constructor(scene) {
    this.scene = scene;
    this.layers = [];
    this.rooftops = [];
    this.beacons = [];
    this.neonSigns = [];
    this.steamVents = [];

    this.createSky();
    this.createDistantSkyline();
    this.createMidSkyline();
    this.createMainBuildings();
    this.createRooftopStructures();
    this.createForegroundStructures();
    this.createColliders();
  }

  createSky() {
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;

    // Layer 0: Cinematic Sunset Sky Gradient (Deep Indigo -> Twilight Violet -> Sunset Crimson -> Golden Horizon)
    this.skyGfx = this.scene.add.graphics().setDepth(0).setScrollFactor(0);
    this.skyGfx.fillGradientStyle(0x0c071d, 0x1a0d30, 0x6e1b3b, 0xd45826, 1);
    this.skyGfx.fillRect(0, 0, W, H);

    // Warm Sun Bloom low on the western horizon
    const sunGfx = this.scene.add.graphics().setDepth(0).setScrollFactor(0.01, 0.02);
    // Outer atmospheric bloom
    sunGfx.fillStyle(0xff8c42, 0.22);
    sunGfx.fillCircle(W * 0.72, H * 0.48, 140);
    sunGfx.fillStyle(0xffbe53, 0.35);
    sunGfx.fillCircle(W * 0.72, H * 0.48, 85);
    // Core glowing sun disc
    sunGfx.fillStyle(0xfff3d1, 0.85);
    sunGfx.fillCircle(W * 0.72, H * 0.48, 42);

    // Photographic NYC Twilight Skyline blend (if texture exists and is valid, overlay with soft blend)
    if (this.scene.textures.exists('skyline_twilight')) {
      const tex = this.scene.textures.get('skyline_twilight');
      const isValid = tex && tex.key !== '__MISSING' && (!tex.source || !tex.source[0] || !tex.source[0].isMissing);
      if (isValid) {
        this.skylineBackdrop = this.scene.add.image(W * 0.5, H * 0.46, 'skyline_twilight')
          .setDepth(1)
          .setScrollFactor(0.02, 0.03)
          .setDisplaySize(W * 2.2, H * 0.78)
          .setAlpha(0.42);
      }
    }

    // Atmospheric Warm Horizon Haze Layer
    this.hazeGfx = this.scene.add.graphics().setDepth(1).setScrollFactor(0);
    this.hazeGfx.fillGradientStyle(0x000000, 0x000000, 0xd45826, 0x240d28, 0.38);
    this.hazeGfx.fillRect(0, H * 0.38, W, H * 0.62);

    // Layer 2: Drifting Volumetric Sunset Clouds
    this.cloudsGfx = this.scene.add.graphics().setDepth(2);
    this.clouds = [];
    const cloudCount = 16;
    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push({
        x: (i * 540) - 400,
        y: 60 + (i % 5) * 38,
        w: 280 + (i % 4) * 110,
        h: 55 + (i % 3) * 22,
        speed: 0.08 + (i % 3) * 0.04,
        tier: (i % 2 === 0) ? 'high' : 'low'
      });
    }
  }

  createDistantSkyline() {
    // Layer 3: Distant Skyline Silhouettes (Scroll Factor 0.10)
    const distGfx = this.scene.add.graphics().setDepth(2).setScrollFactor(CONFIG.PARALLAX.DISTANT_SKYLINE, 0.08);

    // Generate rich architectural silhouettes across the Manhattan distance
    for (let x = -400; x < 9500; x += 115) {
      const seed = Math.sin(x * 0.012);
      const h = 260 + seed * 130 + ((x * 17) % 95);
      const w = 95 + ((x * 7) % 35);
      const y = CONFIG.CANVAS_HEIGHT - h + 30;

      // Atmospheric deep slate-indigo
      distGfx.fillStyle(0x13192e, 0.92);
      distGfx.fillRect(x, y, w, h);

      // Subtle warm sunset edge reflection on west side of towers
      distGfx.fillStyle(0xd96838, 0.28);
      distGfx.fillRect(x, y, 2, h);

      // Architectural top profile variations
      const type = (x / 115) % 4;
      if (type === 0) {
        // Needle spire (Empire / Chrysler style)
        distGfx.fillStyle(0x13192e, 1.0);
        distGfx.fillTriangle(
          x + w / 2, y - 75,
          x + w / 2 - 8, y,
          x + w / 2 + 8, y
        );
        // Spire radio beacon
        this.beacons.push({
          x: x + w / 2,
          y: y - 75,
          factor: CONFIG.PARALLAX.DISTANT_SKYLINE,
          depth: 2,
          color: 0xff3344,
          period: 1400 + (x % 500)
        });
      } else if (type === 1) {
        // Stepped Art Deco crown
        distGfx.fillStyle(0x161e36, 0.95);
        distGfx.fillRect(x + 12, y - 24, w - 24, 24);
        distGfx.fillRect(x + 24, y - 44, w - 48, 20);
        distGfx.fillRect(x + w / 2 - 2, y - 68, 4, 24);
      } else if (type === 2) {
        // Angled modern monolith
        distGfx.fillStyle(0x13192e, 0.95);
        distGfx.fillTriangle(
          x, y,
          x + w, y,
          x + w, y - 32
        );
      }

      // Distant micro-windows
      distGfx.fillStyle(0xffbe6b, 0.35);
      for (let wy = y + 40; wy < y + h - 30; wy += 36) {
        if (((x + wy) % 9) > 3) {
          distGfx.fillRect(x + 16, wy, 4, 6);
          distGfx.fillRect(x + w - 20, wy, 4, 6);
        }
      }
    }
  }

  createMidSkyline() {
    // Layer 4: Mid Towers with dynamic illumination and architectural cornices (Scroll Factor 0.28)
    const midGfx = this.scene.add.graphics().setDepth(3).setScrollFactor(CONFIG.PARALLAX.MID_TOWERS, 0.18);

    for (let x = -400; x < 9800; x += 175) {
      const w = 145 + ((x * 11) % 65);
      const h = 390 + Math.cos(x * 0.005) * 150 + ((x * 23) % 120);
      const y = CONFIG.CANVAS_HEIGHT - h + 70;

      // Deep twilight graphite tower body with gradient-like structure
      midGfx.fillStyle(0x151e33, 0.98);
      midGfx.fillRect(x, y, w, h);

      // Sunset western edge rim highlight
      midGfx.fillStyle(0xff8c42, 0.55);
      midGfx.fillRect(x, y, 3, h);

      // Top architectural cornice
      midGfx.fillStyle(0x283858, 1.0);
      midGfx.fillRect(x - 4, y, w + 8, 10);
      midGfx.fillStyle(0xffaa55, 0.65);
      midGfx.fillRect(x - 4, y, w + 8, 2); // Rim gleam

      // Vertical architectural mullions
      midGfx.fillStyle(0x11182a, 0.85);
      const colStep = 22;
      for (let mx = x + 10; mx < x + w - 8; mx += colStep) {
        midGfx.fillRect(mx - 2, y + 10, 4, h - 10);
      }

      // Rich living window matrix (Amber, warm white, cyan terminal, and dark off windows)
      for (let wx = x + 12; wx < x + w - 14; wx += 22) {
        for (let wy = y + 26; wy < y + h - 35; wy += 26) {
          const hash = (wx * 13 + wy * 19 + x) % 17;
          if (hash > 4) { // Only ~70% lit
            if (hash === 5 || hash === 6) {
              // High-tech Cyan terminal office
              midGfx.fillStyle(0x00f0ff, 0.65);
              midGfx.fillRect(wx, wy, 8, 13);
            } else if (hash > 13) {
              // Warm incandescent golden office
              midGfx.fillStyle(0xffda79, 0.85);
              midGfx.fillRect(wx, wy, 8, 13);
            } else {
              // Standard warm amber
              midGfx.fillStyle(0xf39c12, 0.60);
              midGfx.fillRect(wx, wy, 8, 13);
            }
          }
        }
      }

      // Antenna mast with blinking aviation beacon
      if (x % 350 === 0) {
        midGfx.lineStyle(2, 0x485a7e, 1);
        midGfx.lineBetween(x + w / 2, y, x + w / 2, y - 65);
        midGfx.lineBetween(x + w / 2 - 10, y - 25, x + w / 2 + 10, y - 25);
        this.beacons.push({
          x: x + w / 2,
          y: y - 65,
          factor: CONFIG.PARALLAX.MID_TOWERS,
          depth: 4,
          color: 0xff2a45,
          period: 1200 + (x % 400)
        });
      }
    }
  }

  createMainBuildings() {
    // Layer 5: Main play buildings (Scroll Factor 0.55)
    // Features distinct architectural facings, masonry balustrades, spandrel panels, and deep window reveals
    const mainGfx = this.scene.add.graphics().setDepth(5).setScrollFactor(CONFIG.PARALLAX.MAIN_BUILDINGS, 0.35);

    for (let x = -300; x < 9800; x += 340) {
      const w = 290 + ((x * 5) % 80);
      const h = 480 + Math.sin(x * 0.0035) * 130 + ((x * 13) % 85);
      const y = CONFIG.CANVAS_HEIGHT - h + 90;

      // Base facade: rich slate navy
      mainGfx.fillStyle(0x17223b, 1.0);
      mainGfx.fillRect(x, y, w, h);

      // Deep shadow base for grounding
      mainGfx.fillStyle(0x0a101f, 0.65);
      mainGfx.fillRect(x, y + h - 180, w, 180);

      // Western rim lighting from sunset
      mainGfx.fillStyle(0xff8c42, 0.70);
      mainGfx.fillRect(x, y, 4, h);

      // Heavy classic architectural cornice with ornamental tiers
      mainGfx.fillStyle(0x283a5e, 1.0);
      mainGfx.fillRect(x - 12, y, w + 24, 18);
      mainGfx.fillStyle(0x384d7a, 1.0);
      mainGfx.fillRect(x - 8, y + 18, w + 16, 8);
      // Golden coping highlight on roofline
      mainGfx.fillStyle(0xffbe6b, 0.85);
      mainGfx.fillRect(x - 12, y, w + 24, 3);

      // Architectural pilasters (vertical columns)
      mainGfx.fillStyle(0x1f2e4e, 0.9);
      for (let colX = x + 15; colX < x + w - 15; colX += 68) {
        mainGfx.fillRect(colX, y + 26, 12, h - 26);
      }

      // Multi-paned detailed windows with recessed sills
      for (let wx = x + 34; wx < x + w - 30; wx += 34) {
        for (let wy = y + 42; wy < y + h - 50; wy += 42) {
          // Window recess shadow
          mainGfx.fillStyle(0x0c1322, 0.95);
          mainGfx.fillRect(wx - 2, wy - 2, 18, 26);

          const winHash = (wx * 7 + wy * 17 + x) % 11;
          if (winHash > 2) {
            // Lit office
            if (winHash === 3 || winHash === 4) {
              mainGfx.fillStyle(0x00f0ff, 0.75); // Cyan work monitor
            } else if (winHash > 8) {
              mainGfx.fillStyle(0xfff1c5, 0.95); // Bright white-gold
            } else {
              mainGfx.fillStyle(0xffb94d, 0.80); // Warm amber glow
            }
            mainGfx.fillRect(wx, wy, 14, 22);

            // Window cross-mullion pane divider
            mainGfx.fillStyle(0x17223b, 0.7);
            mainGfx.fillRect(wx + 6, wy, 2, 22);
            mainGfx.fillRect(wx, wy + 10, 14, 2);
          } else {
            // Unlit window glass reflection
            mainGfx.fillStyle(0x141f35, 0.9);
            mainGfx.fillRect(wx, wy, 14, 22);
            // Subtle sky reflection diagonal
            mainGfx.fillStyle(0x3a517d, 0.35);
            mainGfx.fillRect(wx + 2, wy + 2, 6, 8);
          }

          // Window sill
          mainGfx.fillStyle(0x283a5e, 1.0);
          mainGfx.fillRect(wx - 3, wy + 23, 20, 3);
        }
      }
    }

    // Iconic Neon Billboards & Prop Signs
    this.createNeonSigns();
  }

  createNeonSigns() {
    // Stage 1 Upgrade: Authentic High-Resolution Neon Billboards with Structural Steel Trusses
    const signs = [
      {
        id: 'bugle',
        text: 'THE DAILY BUGLE',
        sub: 'NEW YORK EDITION',
        x: 740,
        y: 180,
        color: 0xff2a45,
        accent: 0xffd000,
        w: 240,
        h: 62
      },
      {
        id: 'oscorp',
        text: 'OSCORP INDUSTRIES',
        sub: 'ADVANCED GENETICS & AEROSPACE',
        x: 2340,
        y: 175,
        color: 0x00ff88,
        accent: 0x00f0ff,
        w: 250,
        h: 56
      },
      {
        id: 'stark',
        text: 'STARK R&D',
        sub: 'CLEAN ENERGY INITIATIVE',
        x: 5260,
        y: 170,
        color: 0x00d2ff,
        accent: 0xff3b30,
        w: 220,
        h: 58
      }
    ];

    for (const sign of signs) {
      const container = this.scene.add.container(sign.x, sign.y).setDepth(6);
      container.setScrollFactor(CONFIG.PARALLAX.MAIN_BUILDINGS, 0.35);

      const halfW = sign.w / 2;
      const halfH = sign.h / 2;

      // Steel girder structural truss supports below the sign
      const trussGfx = this.scene.add.graphics();
      trussGfx.lineStyle(2, 0x3d4e6d, 0.9);
      // Legs down to roofline
      trussGfx.lineBetween(-halfW + 20, halfH, -halfW + 20, halfH + 45);
      trussGfx.lineBetween(halfW - 20, halfH, halfW - 20, halfH + 45);
      // Diagonal cross-bracing
      trussGfx.lineBetween(-halfW + 20, halfH, halfW - 20, halfH + 45);
      trussGfx.lineBetween(halfW - 20, halfH, -halfW + 20, halfH + 45);
      container.add(trussGfx);

      // Heavy industrial metal housing backplate
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x0a0f1d, 0.96);
      bg.fillRoundedRect(-halfW, -halfH, sign.w, sign.h, 6);
      bg.lineStyle(2, 0x1e2c47, 1.0);
      bg.strokeRoundedRect(-halfW, -halfH, sign.w, sign.h, 6);

      // Outer Glowing Neon Marquee Border
      bg.lineStyle(3, sign.color, 0.95);
      bg.strokeRoundedRect(-halfW + 3, -halfH + 3, sign.w - 6, sign.h - 6, 4);

      // Neon corner tabs
      bg.fillStyle(sign.accent, 1);
      bg.fillCircle(-halfW + 8, -halfH + 8, 3);
      bg.fillCircle(halfW - 8, -halfH + 8, 3);
      bg.fillCircle(-halfW + 8, halfH - 8, 3);
      bg.fillCircle(halfW - 8, halfH - 8, 3);
      container.add(bg);

      // Primary Luminous Neon Text
      const mainTxt = this.scene.add.text(0, -6, sign.text, {
        fontFamily: "'Impact', 'Trebuchet MS', 'Arial Black', sans-serif",
        fontSize: '18px',
        fontWeight: '900',
        letterSpacing: 2,
        color: Phaser.Display.Color.IntegerToColor(sign.color).rgba
      }).setOrigin(0.5);

      // Neon subtitle
      const subTxt = this.scene.add.text(0, 14, sign.sub, {
        fontFamily: 'monospace',
        fontSize: '8px',
        letterSpacing: 1,
        color: Phaser.Display.Color.IntegerToColor(sign.accent).rgba
      }).setOrigin(0.5);

      container.add(mainTxt);
      container.add(subTxt);

      this.neonSigns.push({
        container,
        mainTxt,
        color: sign.color,
        baseAlpha: 1.0,
        flickerTimer: Math.random() * 5
      });
    }
  }

  createRooftopStructures() {
    // Layer 6: Authentic Manhattan Rooftop Equipment (Scroll Factor 0.75)
    // Banded cedar water towers, HVAC compressor housings, ventilation fan louvers, satellite arrays
    const roofGfx = this.scene.add.graphics().setDepth(7).setScrollFactor(CONFIG.PARALLAX.ROOFTOP_EQUIP, 0.6);

    for (let x = 160; x < 9200; x += 480) {
      const y = 375 + ((x * 11) % 85);

      // Water Tower with banded wood staves & steel legs
      const twX = x + 40;
      const twY = y - 35;

      // Steel truss support tower
      roofGfx.lineStyle(2, 0x3d4b66, 1);
      roofGfx.lineBetween(twX - 25, twY + 28, twX - 18, twY);
      roofGfx.lineBetween(twX + 25, twY + 28, twX + 18, twY);
      roofGfx.lineBetween(twX - 22, twY + 14, twX + 22, twY + 14);
      roofGfx.lineBetween(twX - 25, twY + 28, twX + 18, twY);
      roofGfx.lineBetween(twX + 25, twY + 28, twX - 18, twY);

      // Cedar wood cylinder barrel
      roofGfx.fillStyle(0x3a2416, 1.0);
      roofGfx.fillRect(twX - 20, twY - 32, 40, 32);
      // Steel barrel hoops/bands
      roofGfx.fillStyle(0x1e150f, 1.0);
      roofGfx.fillRect(twX - 21, twY - 26, 42, 3);
      roofGfx.fillRect(twX - 21, twY - 14, 42, 3);
      roofGfx.fillRect(twX - 21, twY - 2, 42, 3);

      // Conical wooden roof
      roofGfx.fillStyle(0x28190f, 1.0);
      roofGfx.fillTriangle(
        twX, twY - 50,
        twX - 23, twY - 32,
        twX + 23, twY - 32
      );
      // Sunset highlight on cone
      roofGfx.fillStyle(0x5a361e, 0.8);
      roofGfx.fillTriangle(
        twX, twY - 50,
        twX - 23, twY - 32,
        twX, twY - 32
      );

      // Heavy industrial HVAC compressor unit
      const hvacX = x + 155;
      const hvacY = y - 10;
      roofGfx.fillStyle(0x222e44, 1.0);
      roofGfx.fillRect(hvacX, hvacY - 26, 62, 26);
      roofGfx.fillStyle(0x32425e, 1.0);
      roofGfx.fillRect(hvacX - 2, hvacY - 28, 66, 4);

      // Exhaust fan grill
      roofGfx.fillStyle(0x131a29, 1.0);
      roofGfx.fillCircle(hvacX + 20, hvacY - 14, 8);
      roofGfx.lineStyle(1, 0x475e87, 0.8);
      roofGfx.strokeCircle(hvacX + 20, hvacY - 14, 8);

      // Side ventilation louvers
      roofGfx.fillStyle(0x111726, 1.0);
      roofGfx.fillRect(hvacX + 36, hvacY - 22, 20, 3);
      roofGfx.fillRect(hvacX + 36, hvacY - 16, 20, 3);
      roofGfx.fillRect(hvacX + 36, hvacY - 10, 20, 3);

      // Register steam vent position for atmospheric smoke motes
      if (x % 960 === 0) {
        this.steamVents.push({
          x: hvacX + 20,
          y: hvacY - 24,
          scrollFactor: CONFIG.PARALLAX.ROOFTOP_EQUIP
        });
      }
    }
  }

  createForegroundStructures() {
    // Layer 7: Unobstructed foreground - keeps traversal paths clear while adding cinematic edge vignetting
    this.fgGfx = this.scene.add.graphics().setDepth(11);
    this.steamParticles = [];

    for (let i = 0; i < 18; i++) {
      this.steamParticles.push({
        x: Math.random() * 8000,
        y: 350 + Math.random() * 120,
        vx: 12 + Math.random() * 18,
        vy: -15 - Math.random() * 20,
        alpha: 0.15 + Math.random() * 0.25,
        radius: 6 + Math.random() * 14
      });
    }
  }

  createColliders() {
    // Comprehensive rooftop platform course spanning the entire progression
    // EXACT COORDINATES PRESERVED FOR 100% GAMEPLAY COMPATIBILITY
    this.rooftops = [
      { id: 'start-rooftop', x: -100, y: 450, width: 620, height: 400, label: 'STARTING ROOFTOP' },
      { id: 'tribeca-lofts', x: 680, y: 520, width: 440, height: 350, label: 'TRIBECA LOFTS' },
      { id: 'midtown-roof', x: 1300, y: 480, width: 460, height: 350, label: 'MIDTOWN TOWER' },
      { id: 'baxter-balcony', x: 1950, y: 530, width: 420, height: 300, label: 'BAXTER PLAZA' },
      { id: 'oscorp-roof', x: 2550, y: 470, width: 480, height: 350, label: 'OSCORP TOWER ROOF' },
      { id: 'chelsea-lofts', x: 3250, y: 510, width: 440, height: 350, label: 'CHELSEA WAREHOUSE' },
      { id: 'stark-helipad', x: 3950, y: 450, width: 520, height: 350, label: 'STARK TOWER HELIPAD' },
      { id: 'theater-roof', x: 4700, y: 500, width: 460, height: 350, label: 'BROADWAY THEATER' },
      { id: 'herald-square', x: 5400, y: 470, width: 480, height: 350, label: 'HERALD SQUARE' },
      { id: 'recovery-perch', x: 6350, y: 440, width: 480, height: 400, isRecoveryPlatform: true, label: 'EMERGENCY FIRE ESCAPE' },
      { id: 'broadway-tower', x: 7000, y: 480, width: 460, height: 350, label: 'BROADWAY TOWER' },
      { id: 'oscorp-summit', x: 7650, y: 410, width: 720, height: 440, isSummit: true, label: 'OSCORP SUMMIT HELIPAD' }
    ];

    // Render physical rooftops with high-fidelity concrete textures, coping, and lights
    this.platGfx = this.scene.add.graphics().setDepth(8);
    this.beaconGfx = this.scene.add.graphics().setDepth(9);
    this.renderRooftops();

    // Dedicated graphic layer for the dynamic recovery platform
    this.recPlatformGfx = this.scene.add.graphics().setDepth(9);
  }

  renderRooftops() {
    this.platGfx.clear();

    for (const roof of this.rooftops) {
      // Base structural facade: Rich deep slate navy with gradient-like floor bands
      this.platGfx.fillStyle(0x131d30, 1.0);
      this.platGfx.fillRect(roof.x, roof.y, roof.width, roof.height);

      // Deep shadow beneath rooftop ledge
      this.platGfx.fillStyle(0x0a101c, 0.90);
      this.platGfx.fillRect(roof.x, roof.y + 14, roof.width, 18);

      // Architectural Corbel brackets under the cornice
      this.platGfx.fillStyle(0x22324e, 1.0);
      for (let bx = roof.x + 12; bx < roof.x + roof.width - 10; bx += 28) {
        this.platGfx.fillRect(bx, roof.y + 14, 10, 12);
        this.platGfx.fillStyle(0x0e1624, 0.8);
        this.platGfx.fillRect(bx + 10, roof.y + 14, 3, 12); // Shadow
        this.platGfx.fillStyle(0x22324e, 1.0);
      }

      // Heavy parapet coping stone trim
      this.platGfx.fillStyle(0x2c3e5e, 1.0);
      this.platGfx.fillRect(roof.x - 6, roof.y, roof.width + 12, 14);

      // Golden Sunset Coping Edge Highlight (Crucial 2.5D Rim Light)
      this.platGfx.fillStyle(0xffbe6b, 0.92);
      this.platGfx.fillRect(roof.x - 6, roof.y, roof.width + 12, 3);

      // Western Edge Rim Highlight
      this.platGfx.fillStyle(0xff8c42, 0.75);
      this.platGfx.fillRect(roof.x - 6, roof.y, 4, roof.height);

      // Architectural vertical pilasters dividing facade into columns
      this.platGfx.fillStyle(0x18253d, 0.95);
      const bayStep = 70;
      for (let px = roof.x + 20; px < roof.x + roof.width - 15; px += bayStep) {
        this.platGfx.fillRect(px, roof.y + 32, 14, roof.height - 32);
        this.platGfx.fillStyle(0x253655, 0.85);
        this.platGfx.fillRect(px, roof.y + 32, 2, roof.height - 32); // Left highlight
        this.platGfx.fillStyle(0x0d1522, 0.85);
        this.platGfx.fillRect(px + 12, roof.y + 32, 2, roof.height - 32); // Right shadow
        this.platGfx.fillStyle(0x18253d, 0.95);
      }

      // Large Manhattan multi-pane windows with detailed fenestration
      const winW = 28;
      const winH = 40;
      for (let wx = roof.x + 44; wx < roof.x + roof.width - 40; wx += bayStep) {
        for (let wy = roof.y + 48; wy < roof.y + roof.height - 50; wy += 58) {
          // Window lintel (stone header)
          this.platGfx.fillStyle(0x2a3d5e, 1.0);
          this.platGfx.fillRect(wx - 3, wy - 4, winW + 6, 4);

          // Deep recessed frame shadow
          this.platGfx.fillStyle(0x080d17, 0.98);
          this.platGfx.fillRect(wx, wy, winW, winH);

          // Window interior illumination hash
          const winSeed = (wx * 17 + wy * 31 + roof.x) % 13;
          if (winSeed > 3) {
            // Lit window
            if (winSeed === 4 || winSeed === 5) {
              this.platGfx.fillStyle(0x00f0ff, 0.85); // High-tech cyan
            } else if (winSeed > 9) {
              this.platGfx.fillStyle(0xfff3cf, 0.95); // Bright warm white
            } else {
              this.platGfx.fillStyle(0xffb545, 0.85); // Warm glowing amber
            }
            this.platGfx.fillRect(wx + 2, wy + 2, winW - 4, winH - 4);

            // Window muntin / mullion cross-frame
            this.platGfx.fillStyle(0x131d30, 0.85);
            this.platGfx.fillRect(wx + winW / 2 - 1, wy + 2, 2, winH - 4);
            this.platGfx.fillRect(wx + 2, wy + winH / 2 - 1, winW - 4, 2);
          } else {
            // Dark window with dusk sky reflection
            this.platGfx.fillStyle(0x111c2e, 0.9);
            this.platGfx.fillRect(wx + 2, wy + 2, winW - 4, winH - 4);
            this.platGfx.fillStyle(0x2d436a, 0.45);
            this.platGfx.fillTriangle(
              wx + 3, wy + 3,
              wx + winW - 6, wy + 3,
              wx + 3, wy + winH - 6
            );
          }

          // Window sill (stone ledge)
          this.platGfx.fillStyle(0x2e4266, 1.0);
          this.platGfx.fillRect(wx - 4, wy + winH, winW + 8, 4);
        }
      }

      // Rooftop gravel surface details & drainage lines
      this.platGfx.fillStyle(0x1f2c45, 0.75);
      for (let rx = roof.x + 35; rx < roof.x + roof.width - 30; rx += 55) {
        this.platGfx.fillRect(rx, roof.y + 18, 28, 4);
      }

      if (roof.isRecoveryPlatform) {
        // High-visibility Industrial Emergency Fire Escape Platform
        this.platGfx.lineStyle(3, 0xffaa00, 0.95);
        this.platGfx.strokeRect(roof.x + 8, roof.y - 34, roof.width - 16, 34);

        // Heavy-gauge steel safety railing balusters
        for (let rx = roof.x + 20; rx < roof.x + roof.width - 20; rx += 24) {
          this.platGfx.lineBetween(rx, roof.y - 34, rx, roof.y);
        }

        // Industrial hazard stripes on landing deck
        for (let sx = roof.x + 12; sx < roof.x + roof.width - 20; sx += 32) {
          this.platGfx.fillStyle(0xffaa00, 0.85);
          this.platGfx.fillRect(sx, roof.y, 16, 7);
          this.platGfx.fillStyle(0x1a1208, 0.95);
          this.platGfx.fillRect(sx + 16, roof.y, 16, 7);
        }
      }

      if (roof.isSummit) {
        // High-Tech Illuminated Oscorp Summit Helipad
        const cx = roof.x + roof.width / 2;
        const cy = roof.y + 44;

        // Helipad landing circle with hazard rim
        this.platGfx.lineStyle(6, 0xffd700, 0.95);
        this.platGfx.strokeCircle(cx, cy, 44);
        this.platGfx.lineStyle(3, 0x00f0ff, 0.85);
        this.platGfx.strokeCircle(cx, cy, 58);

        // Helipad 'H' lettermark
        this.platGfx.fillStyle(0xffd700, 0.98);
        this.platGfx.fillRect(cx - 20, cy - 24, 7, 48);
        this.platGfx.fillRect(cx + 13, cy - 24, 7, 48);
        this.platGfx.fillRect(cx - 16, cy - 5, 32, 10);

        // High-intensity perimeter landing beacons
        this.platGfx.fillStyle(0x00f0ff, 1.0);
        this.platGfx.fillCircle(roof.x + 24, roof.y, 7);
        this.platGfx.fillCircle(roof.x + roof.width - 24, roof.y, 7);

        // Perimeter floodlight glow
        this.platGfx.fillStyle(0x00f0ff, 0.35);
        this.platGfx.fillCircle(roof.x + 24, roof.y, 16);
        this.platGfx.fillCircle(roof.x + roof.width - 24, roof.y, 16);
      }
    }
  }

  positionRecoveryPlatform(x, y) {
    let rec = this.rooftops.find(r => r.isRecoveryPlatform);
    if (!rec) {
      rec = {
        id: 'recovery-perch',
        x: x,
        y: y,
        width: 480,
        height: 400,
        isRecoveryPlatform: true,
        label: 'EMERGENCY FIRE ESCAPE'
      };
      this.rooftops.push(rec);
    } else {
      rec.x = x;
      rec.y = y;
    }

    if (this.recPlatformGfx) {
      this.recPlatformGfx.clear();
      // Draw prominent illuminated emergency fire escape
      this.recPlatformGfx.fillStyle(0x140e06, 0.98);
      this.recPlatformGfx.fillRect(rec.x, rec.y, rec.width, rec.height);

      // High-contrast industrial hazard warning surface
      for (let sx = rec.x; sx < rec.x + rec.width; sx += 32) {
        this.recPlatformGfx.fillStyle(0xffaa00, 0.92);
        this.recPlatformGfx.fillRect(sx, rec.y, 16, 9);
      }

      // Heavy industrial safety cage railing
      this.recPlatformGfx.lineStyle(3, 0xffaa00, 1.0);
      this.recPlatformGfx.strokeRect(rec.x + 6, rec.y - 38, rec.width - 12, 38);
      for (let rx = rec.x + 18; rx < rec.x + rec.width - 18; rx += 22) {
        this.recPlatformGfx.lineBetween(rx, rec.y - 38, rx, rec.y);
      }

      // Warning Strobe beacons with radial halo
      this.recPlatformGfx.fillStyle(0xff2a45, 0.4);
      this.recPlatformGfx.fillCircle(rec.x + 14, rec.y - 44, 14);
      this.recPlatformGfx.fillCircle(rec.x + rec.width - 14, rec.y - 44, 14);

      this.recPlatformGfx.fillStyle(0xff2a45, 1.0);
      this.recPlatformGfx.fillCircle(rec.x + 14, rec.y - 44, 7);
      this.recPlatformGfx.fillCircle(rec.x + rec.width - 14, rec.y - 44, 7);

      this.recPlatformGfx.fillStyle(0xffffff, 0.95);
      this.recPlatformGfx.fillCircle(rec.x + 14, rec.y - 44, 3);
      this.recPlatformGfx.fillCircle(rec.x + rec.width - 14, rec.y - 44, 3);
    }
  }

  update(cameraX, cameraY) {
    const time = this.scene.time.now * 0.001;

    // 1. Animate Layered Volumetric Sunset Clouds with seamless wrapping
    this.cloudsGfx.clear();
    const wrapWidth = 8500;

    for (const cloud of this.clouds) {
      const rawX = cloud.x + time * cloud.speed * 42 - cameraX * CONFIG.PARALLAX.CLOUDS;
      const cx = ((rawX % wrapWidth + wrapWidth) % wrapWidth) - 400;

      // Cloud body: soft dusty twilight violet
      this.cloudsGfx.fillStyle(0x321a3e, 0.28);
      this.cloudsGfx.fillRoundedRect(cx, cloud.y, cloud.w, cloud.h, 24);

      // Cloud puffs for organic shape
      this.cloudsGfx.fillCircle(cx + cloud.w * 0.35, cloud.y + cloud.h * 0.2, cloud.h * 0.7);
      this.cloudsGfx.fillCircle(cx + cloud.w * 0.65, cloud.y + cloud.h * 0.25, cloud.h * 0.6);

      // Golden sunset rim on cloud underbelly
      this.cloudsGfx.fillStyle(0xff9944, 0.22);
      this.cloudsGfx.fillRoundedRect(cx + 6, cloud.y + cloud.h - 10, cloud.w - 12, 10, 5);
    }

    // 2. Animate Aviation Radio Beacons with realistic pulsing glow
    if (this.beaconGfx) {
      this.beaconGfx.clear();
      for (const b of this.beacons) {
        const pulse = (Math.sin(time * 4.5 + b.x * 0.01) + 1) * 0.5;
        const bx = b.x - cameraX * b.factor;
        const by = b.y - cameraY * (b.factor * 0.5);

        // Draw only if within viewport bounds + margin
        if (bx >= -50 && bx <= CONFIG.CANVAS_WIDTH + 50) {
          // Soft outer strobe halo
          this.beaconGfx.fillStyle(b.color, pulse * 0.45);
          this.beaconGfx.fillCircle(bx, by, 9 + pulse * 4);
          // Core bright pinprick
          this.beaconGfx.fillStyle(0xffffff, pulse * 0.95);
          this.beaconGfx.fillCircle(bx, by, 3);
        }
      }
    }

    // 3. Realistic Electrical Neon Tube Flicker
    for (const sign of this.neonSigns) {
      if (sign.container) {
        sign.flickerTimer -= 0.016;
        if (sign.flickerTimer <= 0) {
          // Occasional organic tube flicker
          sign.container.setAlpha(0.65 + Math.random() * 0.35);
          if (Math.random() < 0.25) {
            sign.flickerTimer = 0.08 + Math.random() * 0.15; // Rapid micro-stutter
          } else {
            sign.flickerTimer = 2.5 + Math.random() * 4.0; // Steady burn
            sign.container.setAlpha(1.0);
          }
        }
      }
    }

    // 4. Subtle Foreground Steam / Exhaust Particles
    if (this.fgGfx) {
      this.fgGfx.clear();
      for (const p of this.steamParticles) {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.alpha -= 0.002;
        p.radius += 0.06;

        if (p.alpha <= 0.02 || p.y < 200) {
          p.x = cameraX + Math.random() * CONFIG.CANVAS_WIDTH;
          p.y = 380 + Math.random() * 100;
          p.alpha = 0.18 + Math.random() * 0.22;
          p.radius = 6;
        }

        const sx = p.x - cameraX * 0.9;
        const sy = p.y - cameraY * 0.9;
        if (sx >= -40 && sx <= CONFIG.CANVAS_WIDTH + 40) {
          this.fgGfx.fillStyle(0xffbe6b, p.alpha * 0.45);
          this.fgGfx.fillCircle(sx, sy, p.radius);
        }
      }
    }
  }

  // Check if player stands on any rooftop (100% PRESERVED COLLISION LOGIC)
  checkRooftopCollision(px, py, prevY) {
    for (const roof of this.rooftops) {
      if (px >= roof.x - 15 && px <= roof.x + roof.width + 15) {
        // Did player fall onto roof surface this frame?
        if (prevY <= roof.y + 10 && py >= roof.y - 4) {
          return roof;
        }
      }
    }
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.ParallaxCity = ParallaxCity;
}
