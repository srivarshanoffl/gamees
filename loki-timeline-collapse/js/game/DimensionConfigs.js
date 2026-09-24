/**
 * DimensionConfigs.js
 * Comprehensive configuration for the 4 Dimensions × 3 Eras = 12 Level Layouts
 * in "Loki: The Last Timeline".
 */

const DIMENSION_CONFIGS = {
  // ==========================================
  // DIMENSION 1: ASGARD (Loki + Thor)
  // ==========================================
  asgard: {
    id: 'asgard',
    name: 'ASGARD: REALM OF THUNDER',
    subtitle: 'A God Out of Time',
    companion: 'thor',
    coreName: 'STORM CORE',
    coreColor: '#38bdf8',
    dialogues: {
      intro: [
        { speaker: 'loki', text: 'Brother. The golden towers of our home... they are flickering like dying embers.' },
        { speaker: 'thor', text: 'Loki! You returned? The temporal rifts have cracked the foundations of the Bifrost!' },
        { speaker: 'loki', text: 'Doom has planted a siphon here. We must search the Past, Present, and Future beneath the city.' },
        { speaker: 'thor', text: 'Then Mjolnir shall crack any barrier between us and Latverian trickery!' }
      ],
      coreRecovered: [
        { speaker: 'thor', text: 'The Storm Core is stabilized! By Odin’s beard, the realm holds for now.' },
        { speaker: 'loki', text: 'One Nexus Core restored. Three remain across the multiverse.' }
      ]
    },
    eras: {
      PAST: {
        theme: 'PAST',
        levelWidth: 2600,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 700, h: 80, type: 'asgard' },
          { x: 780, y: 410, w: 450, h: 80, type: 'asgard' },
          { x: 1300, y: 350, w: 400, h: 80, type: 'asgard' },
          { x: 1780, y: 460, w: 820, h: 80, type: 'asgard' },
          // Upper platforms
          { x: 300, y: 320, w: 180, h: 20, type: 'asgard' },
          { x: 920, y: 260, w: 220, h: 20, type: 'asgard' },
          { x: 1450, y: 220, w: 180, h: 20, type: 'asgard' }
        ],
        interactiveObjects: [
          {
            type: 'puzzle',
            puzzleId: 'asgard_runes',
            x: 1000,
            y: 350,
            width: 48,
            height: 60,
            label: 'ANCIENT RUNES',
            memoryKey: 'asgard_runes_solved'
          },
          {
            type: 'storm_switch',
            x: 1500,
            y: 290,
            width: 48,
            height: 60,
            requiredCompanion: 'thor',
            label: 'THOR LIGHTNING',
            memoryKey: 'asgard_conduit_active'
          },
          {
            type: 'portal',
            targetEra: 'PRESENT',
            x: 2350,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PRESENT'
          }
        ],
        enemies: [
          { type: 'corrupted_guard', x: 850, y: 350 },
          { type: 'corrupted_guard', x: 1400, y: 290 },
          { type: 'doom_machine', x: 1950, y: 400 }
        ]
      },
      PRESENT: {
        theme: 'PRESENT',
        levelWidth: 2600,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 550, h: 80, type: 'asgard' },
          // Gap requires rewindable bridge
          { x: 900, y: 420, w: 500, h: 80, type: 'asgard' },
          { x: 1500, y: 360, w: 420, h: 80, type: 'asgard' },
          { x: 2000, y: 460, w: 600, h: 80, type: 'asgard' },
          // Elevated platforms
          { x: 350, y: 330, w: 160, h: 20, type: 'asgard' },
          { x: 1100, y: 280, w: 200, h: 20, type: 'asgard' }
        ],
        interactiveObjects: [
          {
            type: 'rewindable',
            x: 580,
            y: 460,
            width: 300,
            height: 24,
            label: 'REWIND BRIDGE [E]',
            memoryKey: 'asgard_present_bridge'
          },
          {
            type: 'portal',
            targetEra: 'PAST',
            x: 120,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PAST'
          },
          {
            type: 'portal',
            targetEra: 'FUTURE',
            x: 2400,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO FUTURE'
          }
        ],
        enemies: [
          { type: 'doom_machine', x: 1050, y: 360 },
          { type: 'doom_machine', x: 1650, y: 300 },
          { type: 'corrupted_guard', x: 2150, y: 400 }
        ]
      },
      FUTURE: {
        theme: 'FUTURE',
        levelWidth: 2800,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 700, h: 80, type: 'asgard' },
          { x: 800, y: 430, w: 450, h: 80, type: 'asgard' },
          { x: 1350, y: 460, w: 1450, h: 80, type: 'asgard' }, // Boss arena
          { x: 1600, y: 330, w: 240, h: 20, type: 'asgard' },
          { x: 2050, y: 330, w: 240, h: 20, type: 'asgard' }
        ],
        boss: {
          type: 'asgard_guardian',
          x: 2100,
          y: 390
        },
        interactiveObjects: [
          {
            type: 'portal',
            targetEra: 'PRESENT',
            x: 120,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PRESENT'
          },
          {
            type: 'pedestal',
            x: 2600,
            y: 396,
            width: 60,
            height: 64,
            label: 'CLAIM CORE'
          }
        ],
        enemies: [
          { type: 'doom_machine', x: 900, y: 370 }
        ]
      }
    }
  },

  // ==========================================
  // DIMENSION 2: CAPTAIN AMERICA (Loki + Cap)
  // ==========================================
  cap: {
    id: 'cap',
    name: 'CAPTAIN AMERICA: ALTERED HISTORY',
    subtitle: 'History Has a Price',
    companion: 'cap',
    coreName: 'VALOR CORE',
    coreColor: '#ef4444',
    dialogues: {
      intro: [
        { speaker: 'cap', text: 'Hold it right there! Who are you—some kind of costumed saboteur?' },
        { speaker: 'loki', text: 'Captain Rogers. I am Loki of Asgard. And your history has been manipulated.' },
        { speaker: 'cap', text: 'Asgard? Thor’s brother? If you’re here, then Hydra isn’t behind these temporal rifts.' },
        { speaker: 'loki', text: 'Worse. Doctor Doom is rewriting your timeline from 1944 into a controlled future.' },
        { speaker: 'cap', text: 'Not on my watch. Let’s clean this mess up together.' }
      ],
      coreRecovered: [
        { speaker: 'cap', text: 'The Valor Core is secure. The timeline is re-aligning.' },
        { speaker: 'loki', text: 'Two cores gathered. Halfway to unraveling Doom’s tapestry.' }
      ]
    },
    eras: {
      PAST: {
        theme: 'PAST',
        levelWidth: 2600,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 800, h: 80, type: 'cap' },
          { x: 880, y: 400, w: 600, h: 80, type: 'cap' },
          { x: 1560, y: 460, w: 1040, h: 80, type: 'cap' },
          { x: 350, y: 330, w: 200, h: 20, type: 'cap' },
          { x: 1050, y: 270, w: 220, h: 20, type: 'cap' }
        ],
        interactiveObjects: [
          {
            type: 'puzzle',
            puzzleId: 'cap_components',
            x: 1100,
            y: 340,
            width: 48,
            height: 60,
            label: 'SSR BENCH',
            memoryKey: 'cap_regulator_fixed'
          },
          {
            type: 'shield_switch',
            x: 1800,
            y: 400,
            width: 48,
            height: 60,
            requiredCompanion: 'cap',
            label: 'CAP SHIELD',
            memoryKey: 'cap_vault_door'
          },
          {
            type: 'portal',
            targetEra: 'PRESENT',
            x: 2400,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PRESENT'
          }
        ],
        enemies: [
          { type: 'doom_soldier', x: 600, y: 400 },
          { type: 'doom_soldier', x: 1250, y: 340 },
          { type: 'doom_machine', x: 1950, y: 400 }
        ]
      },
      PRESENT: {
        theme: 'PRESENT',
        levelWidth: 2600,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 600, h: 80, type: 'cap' },
          { x: 950, y: 410, w: 550, h: 80, type: 'cap' },
          { x: 1580, y: 460, w: 1020, h: 80, type: 'cap' },
          { x: 400, y: 340, w: 180, h: 20, type: 'cap' },
          { x: 1150, y: 280, w: 180, h: 20, type: 'cap' }
        ],
        interactiveObjects: [
          {
            type: 'rewindable',
            x: 620,
            y: 460,
            width: 310,
            height: 24,
            label: 'REWIND ROAD [E]',
            memoryKey: 'cap_present_road'
          },
          {
            type: 'portal',
            targetEra: 'PAST',
            x: 120,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PAST'
          },
          {
            type: 'portal',
            targetEra: 'FUTURE',
            x: 2400,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO FUTURE'
          }
        ],
        enemies: [
          { type: 'doom_soldier', x: 1100, y: 350 },
          { type: 'doom_machine', x: 1750, y: 400 }
        ]
      },
      FUTURE: {
        theme: 'FUTURE',
        levelWidth: 2800,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 750, h: 80, type: 'cap' },
          { x: 850, y: 420, w: 450, h: 80, type: 'cap' },
          { x: 1400, y: 460, w: 1400, h: 80, type: 'cap' },
          { x: 1700, y: 340, w: 220, h: 20, type: 'cap' },
          { x: 2150, y: 340, w: 220, h: 20, type: 'cap' }
        ],
        boss: {
          type: 'doom_supersoldier',
          x: 2100,
          y: 390
        },
        interactiveObjects: [
          {
            type: 'portal',
            targetEra: 'PRESENT',
            x: 120,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PRESENT'
          },
          {
            type: 'pedestal',
            x: 2600,
            y: 396,
            width: 60,
            height: 64,
            label: 'CLAIM CORE'
          }
        ],
        enemies: [
          { type: 'doom_soldier', x: 950, y: 360 }
        ]
      }
    }
  },

  // ==========================================
  // DIMENSION 3: THE STARK FUTURE (Loki + Iron Man)
  // ==========================================
  stark: {
    id: 'stark',
    name: 'STARK FUTURE: CORRUPTED CITY',
    subtitle: 'The Future That Must Not Exist',
    companion: 'ironman',
    coreName: 'ARC CORE',
    coreColor: '#fbbf24',
    dialogues: {
      intro: [
        { speaker: 'ironman', text: 'Jarvis, who invited the horned god of mischief into my skyline?' },
        { speaker: 'loki', text: 'Stark. Look at your own city. Your Arc reactors are beating with green Latverian energy.' },
        { speaker: 'ironman', text: 'Wait... my diagnostics show an infection running through the sub-grid since the 90s!' },
        { speaker: 'loki', text: 'Doom planted the seed in your past, and it blossomed into this techno-dystopia.' },
        { speaker: 'ironman', text: 'Nobody hacks my legacy. Repulsors armed, let’s purge the system!' }
      ],
      coreRecovered: [
        { speaker: 'ironman', text: 'Arc Core retrieved and cleansed! Grid returning to Stark protocols.' },
        { speaker: 'loki', text: 'Three Nexus Cores in hand. Only the Mystic Temple remains.' }
      ]
    },
    eras: {
      PAST: {
        theme: 'PAST',
        levelWidth: 2600,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 850, h: 80, type: 'stark' },
          { x: 920, y: 400, w: 550, h: 80, type: 'stark' },
          { x: 1540, y: 460, w: 1060, h: 80, type: 'stark' },
          { x: 300, y: 320, w: 180, h: 20, type: 'stark' },
          { x: 1100, y: 260, w: 200, h: 20, type: 'stark' }
        ],
        interactiveObjects: [
          {
            type: 'puzzle',
            puzzleId: 'stark_frequency',
            x: 1050,
            y: 340,
            width: 48,
            height: 60,
            label: 'FREQ SYNC',
            memoryKey: 'stark_freq_synced'
          },
          {
            type: 'terminal',
            x: 1750,
            y: 400,
            width: 48,
            height: 60,
            requiredCompanion: 'ironman',
            label: 'STARK HACK',
            memoryKey: 'stark_laser_gate'
          },
          {
            type: 'portal',
            targetEra: 'PRESENT',
            x: 2400,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PRESENT'
          }
        ],
        enemies: [
          { type: 'doom_machine', x: 650, y: 400 },
          { type: 'doom_machine', x: 1200, y: 340 },
          { type: 'temporal_sentinel', x: 1950, y: 400 }
        ]
      },
      PRESENT: {
        theme: 'PRESENT',
        levelWidth: 2600,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 600, h: 80, type: 'stark' },
          { x: 950, y: 420, w: 500, h: 80, type: 'stark' },
          { x: 1550, y: 460, w: 1050, h: 80, type: 'stark' },
          { x: 400, y: 330, w: 180, h: 20, type: 'stark' },
          { x: 1100, y: 280, w: 200, h: 20, type: 'stark' }
        ],
        interactiveObjects: [
          {
            type: 'rewindable',
            x: 620,
            y: 460,
            width: 310,
            height: 24,
            label: 'REWIND SKYWAY [E]',
            memoryKey: 'stark_present_bridge'
          },
          {
            type: 'portal',
            targetEra: 'PAST',
            x: 120,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PAST'
          },
          {
            type: 'portal',
            targetEra: 'FUTURE',
            x: 2400,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO FUTURE'
          }
        ],
        enemies: [
          { type: 'doom_machine', x: 1100, y: 360 },
          { type: 'temporal_sentinel', x: 1800, y: 400 }
        ]
      },
      FUTURE: {
        theme: 'FUTURE',
        levelWidth: 2800,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 750, h: 80, type: 'stark' },
          { x: 850, y: 420, w: 450, h: 80, type: 'stark' },
          { x: 1400, y: 460, w: 1400, h: 80, type: 'stark' },
          { x: 1650, y: 330, w: 220, h: 20, type: 'stark' },
          { x: 2150, y: 330, w: 220, h: 20, type: 'stark' }
        ],
        boss: {
          type: 'doom_armor',
          x: 2100,
          y: 390
        },
        interactiveObjects: [
          {
            type: 'portal',
            targetEra: 'PRESENT',
            x: 120,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PRESENT'
          },
          {
            type: 'pedestal',
            x: 2600,
            y: 396,
            width: 60,
            height: 64,
            label: 'CLAIM CORE'
          }
        ],
        enemies: [
          { type: 'doom_machine', x: 950, y: 360 }
        ]
      }
    }
  },

  // ==========================================
  // DIMENSION 4: MYSTIC TEMPLE (Loki + Doctor Strange)
  // ==========================================
  mystic: {
    id: 'mystic',
    name: 'THE MYSTIC TEMPLE: NON-LINEAR',
    subtitle: 'Time Does Not Flow Linearly Here',
    companion: 'strange',
    coreName: 'MIND CORE',
    coreColor: '#ec4899',
    dialogues: {
      intro: [
        { speaker: 'strange', text: 'Loki. Walk carefully. In this sanctum, cause does not precede effect.' },
        { speaker: 'loki', text: 'I feel it. The timeline isn\'t branching here — it is being pulled taut toward a single center.' },
        { speaker: 'strange', text: 'Doctor Doom has woven temporal anchors into the temple. Unwind the Eye of Agamotto loop to reveal the Mind Core.' },
        { speaker: 'loki', text: 'Once we claim this final core, we can seal the rifts permanently.' }
      ],
      coreRecovered: [
        { speaker: 'loki', text: 'The Mind Core is in our hands. The Nexus is whole.' },
        { speaker: 'strange', text: 'Something is wrong, Loki. The Chrono Forge was waiting for this exact moment...' }
      ]
    },
    eras: {
      PAST: {
        theme: 'PAST',
        levelWidth: 2800,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 680, h: 80, type: 'mystic' },
          { x: 800, y: 410, w: 500, h: 80, type: 'mystic' },
          { x: 1420, y: 360, w: 480, h: 80, type: 'mystic' },
          { x: 2000, y: 460, w: 800, h: 80, type: 'mystic' },
          { x: 380, y: 320, w: 200, h: 20, type: 'mystic' },
          { x: 1050, y: 265, w: 210, h: 20, type: 'mystic' }
        ],
        interactiveObjects: [
          {
            type: 'puzzle',
            puzzleId: 'mystic_knot',
            x: 1080,
            y: 340,
            width: 48,
            height: 60,
            label: 'TIME LOOP',
            memoryKey: 'mystic_past_loop'
          },
          {
            type: 'portal',
            targetEra: 'PRESENT',
            x: 2550,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PRESENT'
          }
        ],
        enemies: [
          { type: 'temporal_sentinel', x: 900, y: 350 },
          { type: 'doom_machine', x: 1650, y: 300 }
        ]
      },
      PRESENT: {
        theme: 'PRESENT',
        levelWidth: 2800,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 700, h: 80, type: 'mystic' },
          { x: 900, y: 390, w: 550, h: 80, type: 'mystic' },
          { x: 1560, y: 430, w: 600, h: 80, type: 'mystic' },
          { x: 2260, y: 460, w: 540, h: 80, type: 'mystic' },
          { x: 430, y: 325, w: 180, h: 20, type: 'mystic' },
          { x: 1160, y: 255, w: 200, h: 20, type: 'mystic' }
        ],
        interactiveObjects: [
          {
            type: 'rewindable',
            x: 700,
            y: 460,
            width: 180,
            height: 24,
            label: 'REWIND PATH [E]',
            memoryKey: 'mystic_present_bridge'
          },
          {
            type: 'portal',
            targetEra: 'PAST',
            x: 120,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PAST'
          },
          {
            type: 'portal',
            targetEra: 'FUTURE',
            x: 2600,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO FUTURE'
          }
        ],
        enemies: [
          { type: 'temporal_sentinel', x: 1050, y: 330 },
          { type: 'doom_machine', x: 1750, y: 370 }
        ]
      },
      FUTURE: {
        theme: 'FUTURE',
        levelWidth: 3000,
        playerStart: { x: 100, y: 380 },
        platforms: [
          { x: 0, y: 460, w: 720, h: 80, type: 'mystic' },
          { x: 820, y: 420, w: 480, h: 80, type: 'mystic' },
          { x: 1400, y: 460, w: 1600, h: 80, type: 'mystic' }, // Boss arena
          { x: 1650, y: 330, w: 230, h: 20, type: 'mystic' },
          { x: 2150, y: 330, w: 230, h: 20, type: 'mystic' }
        ],
        boss: {
          type: 'mystic_guardian',
          x: 2200,
          y: 390
        },
        interactiveObjects: [
          {
            type: 'portal',
            targetEra: 'PRESENT',
            x: 120,
            y: 396,
            width: 56,
            height: 64,
            label: 'TO PRESENT'
          },
          {
            type: 'pedestal',
            x: 2800,
            y: 396,
            width: 60,
            height: 64,
            label: 'CLAIM MIND CORE'
          }
        ],
        enemies: [
          { type: 'doom_machine', x: 950, y: 360 }
        ]
      }
    }
  }
};

window.DIMENSION_CONFIGS = DIMENSION_CONFIGS;
