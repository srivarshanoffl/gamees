# INFINITY: The Final Snap — Debug the Universe

A cinematic web experience recreating the climax of *Avengers: Endgame*.

---

## Folder Structure

```
endgame/
├── index.html                   # Standard entrypoint
├── endgame.html                 # Preserved entrypoint for backward compatibility
├── css/
│   └── style.css                # Full cinematic design system, keyframes, and layout
├── js/
│   └── app.js                   # Timeline sequence, Web Audio synthesizer & polling engine
├── assets/
│   └── images/                  # High-resolution production visual assets
│       ├── endgame_bg.jpg       # Authentic matte battlefield crater background
│       ├── tony.png             # Iron Man with nano-gauntlet and mapped Infinity Stones
│       ├── thanos.png           # Thanos confident with raised gauntlet
│       └── thanos_shocked.png   # Thanos stunned/shocked reaction face
├── docs/
│   └── screenshots/             # Verification and walkthrough captures
│       ├── walkthrough_title.png
│       ├── walkthrough_reaction.png
│       └── walkthrough_complete.png
└── backup/
    └── endgame.html.bak         # Legacy single-file backup
```

---

## Running Locally

Open either `index.html` or `endgame.html` in any modern web browser:
```bash
start index.html
```
No build steps or package managers required.
