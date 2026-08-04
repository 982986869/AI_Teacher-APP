# Brand assets

Exports from the "Ai Learnnova" Figma file
(https://figma.com/design/FHiyZnCM8odZdGoMkwEyNA/Ai-Learnnova).

Referenced by `src/components/brand/` and the auth screens. React Native resolves
`require()` at bundle time, so a file must exist on disk before it can be imported —
adding an asset means dropping the file here *and* editing the file that points at
it, then restarting Metro with `npx expo start -c`.

| File | Used by | Figma node |
|---|---|---|
| `logo.png` | `SplashScreen.js` — 420x200 RGBA, drawn at 300x143 | image 20 |
| `welcome-hero.png` | `WelcomeHero.js` — welcome backdrop, scrim baked in | "1" |
| `welcome-scrim.png` | `OnboardingIntroScreen.js` — standalone scrim layer | Rectangle 17 |
| `onboarding-1.jpg` | `OnboardingIntroScreen.js` — intro page 1 | image 18 |
| `onboarding-2.jpg` | `OnboardingIntroScreen.js` — intro page 2 | image 18 |
| `onboarding-3-graph.png` | `OnboardingIntroScreen.js` — intro page 3 graphic | "image 21" |

Page 3's art ships as a small graphic (390x304), not a full 390x844 background —
see below.

## Notes

`welcome-hero.png` is fully flattened — photograph, floating cards, mascot and the
dark scrim are all in the one image. Nothing is composited on top of it in code.
The onboarding pages are the opposite: their art ships clean and `welcome-scrim.png`
is layered over it at runtime. Don't put the scrim over the welcome hero, or the
bottom third darkens twice and crushes the headline.

## Cropping the onboarding slides

`onboarding-1.jpg` and `onboarding-2.jpg` are cut from one source export,
`assets/64f36ffd0f3f62a80639f39fbbc6cbdffeb6d77c (1).png` — a 1536x1024 board with
three intro-screen cards side by side. Figma's `image 18` node is 466x1024 sitting
at left `-23`, top `-34` inside the 390x844 frame, i.e. the art bleeds off every
edge at **native scale, no resampling**. Aligning the already-approved page 1
against the board put its window at `(556, 36)`, which is 31px into the middle
card — so the rule is:

    x = <card left edge> + 31,  y = 36,  size 390x844

Card left edges on the board are 26 / 525 / 1020, giving x = 57 / 556 / 1051.
`scripts/` has no helper for this; it was a one-off PIL crop.

The board's own left-to-right order is **not** the slide order. The pairing below
is the user's call, made after seeing the slides rendered — keep `onboarding-N.jpg`
meaning "slide N" and re-cut the files if it changes again, rather than crossing
the `require()`s over in the screen.

| Slide | Copy | Board card (x) |
|---|---|---|
| 1 | Personalized Learning | card 2 — headphones, player bar, Ask Nova (556) |
| 2 | Interactive AI Lessons | card 3 — daily streak, achievements (1051) |

The board's third card (card 1 — today's goal, weekly progress, x=57) was used as a
placeholder for slide 3 early on, but slide 3's real reference turned out to be a
dark progress/achievement/streak graphic with no photo at all and no source on that
board — a separate, later Figma export (390x844, "image 21" node), delivered as a
full mockup screen (status bar, headline, body copy, dots and CTA all baked in, not
just the graphic). Since `OnboardingIntroScreen.js` draws its own title/body/dots/
button for every slide, using that mockup as-is would double them up, so only the
graphic portion is kept: cropped to `(0, 108)–(390, 412)`, saved as
`onboarding-3-graph.png` (390x304). It renders contained at the top of the frame
(`slide.graphic`), not as a `StyleSheet.absoluteFill` background like slides 1-2
(`slide.image`) — it's a small graphic, not full-bleed art — and skips
welcome-scrim.png, since it's already dark by construction.
`onboarding-3.jpg` (the old placeholder) is no longer referenced; it's left on disk
as history, not as an asset to reintroduce.

The peak dot on the graphic's trend line pulses — `OnboardingIntroScreen.js` finds
it by scanning the PNG for its brightest pixel (77.4%, 8.9%) and overlays an
`Animated.View` glow at that percentage position. `resizeMode="contain"` at the
image's own aspect ratio means no letterboxing, so the percentage lines up with the
rendered image with no separate scaling math. If `onboarding-3-graph.png` is
re-cropped, re-run the brightest-pixel scan and update `shineAt` in the slide's
data — the position is not derived automatically at runtime.

Each card has its own headline baked into the bottom of the artwork ("Learn with
AI Teacher Nova" and so on). That is fine — `welcome-scrim.png` is fully opaque
below y=700, so the baked captions are covered before the real title, dots and CTA
are drawn over them. Don't crop them out by zooming in; that breaks the 1:1 scale.
(The scrim is fully opaque from y=620 down, and the baked captions start at y~695.)
