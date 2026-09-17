# Marvel Mini-Game Development Invariants

1. **Dual-Launch Architecture**:
   - Every game must run both as a standalone URL (`games/<slug>.html`) and embedded in the Multiverse Hub (`index.html`).
   - All shared logic must reside cleanly in `js/games/<slug>.js` inheriting from `GameEngine.js`.

2. **Pointer Event Management**:
   - Canvas wrapper and HUD layers must specify `pointer-events: none` on passive overlays.
   - Interactive buttons (Thunder, Pause, Fullscreen, Mute) must have `pointer-events: auto` and `z-index >= 15`.

3. **Visual & Character Rendering Standards**:
   - Avoid plain geometric circles/rectangles for heroes or villains. Render recognizable silhouettes, emblems, costumes, and particle FX directly via Canvas2D.
   - Dynamic lighting mechanics (flash, darkness, laser scan) must use vignette layers and radial gradients with smooth lerp transitions.

4. **Audio & Sound Synthesis**:
   - Audio must be fully procedural via `SoundFX.js` (Web Audio API) without external audio file dependencies.
   - AudioContext must resume cleanly on the first user interaction.
