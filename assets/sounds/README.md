# BrainGym sound effects

All effects live in [`brainGym/`](./brainGym) and are wired automatically through
`src/utils/sound.js` (the SoundManager). They are **original synthesized sounds**
(soft bell chimes + gentle noise textures) — no third-party audio — so they are
fully royalty-free and commercially usable. Style: soft, clean, minimal, premium,
educational (never loud/arcade).

Format: MP3, mono, 44.1 kHz, trimmed + peak-normalized. Total ≈ 44 KB.

| File | Event(s) |
|------|----------|
| `tap.mp3` | button / keypad press |
| `pop.mp3` | question appears · memory match |
| `correct.mp3` | correct answer |
| `wrong.mp3` | wrong answer |
| `flip.mp3` | card flip |
| `xp.mp3` | XP / points burst |
| `achievement.mp3` | achievement unlocked · quiz "All Done!" |
| `tick.mp3` | timer — final 5 seconds (one per second) |
| `timeout.mp3` | time up |
| `spin_loop.mp3` | wheel spin (looping, seamless) |
| `whoosh.mp3` | screen enter · arena start |
| `victory.mp3` | arena win |
| `fail.mp3` | arena lose |

Playback is 100% automatic (event-driven). The single global switch
**Profile → Sound Effects (ON/OFF)** gates everything and is saved in local storage.
