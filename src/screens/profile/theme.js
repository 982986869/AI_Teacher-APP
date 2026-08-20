// src/screens/profile/theme.js
// The palette and type scale for the three Profile screens — Profile, Edit Profile and
// Learning Preferences. They came from one Figma flow and share every token, so they
// share one file; nothing outside src/screens/profile/ imports it.
//
// A palette of its own rather than dayTheme or aiTeacherTheme: this flow's greys are
// #111111 / #666666 / #E5E7EB / #F5F5F5, where the Student Home is #1C1C1E / #6B7280 /
// #E5E5EA and the AI Teacher landing differs again. Folding them together would have
// one screen quietly re-skinning another — the same reasoning dayTheme.js records.
//
// Every value marked "Figma" is lifted verbatim from a property panel. Do not "improve"
// them. Values marked "derived" had no panel and were matched to the design screenshot.

export const P = {
  // surfaces — Figma
  page: '#FFFFFF',
  fieldBg: '#F5F5F5',        // input-container, chip-inactive, style card (inactive)
  hair: '#E5E7EB',           // every 1px border and divider on the flow

  // type — Figma
  ink: '#111111',            // headings, values, active labels, the primary CTA fill
  inkSoft: '#666666',        // subtitles, field labels, inactive chip labels

  // the brand yellow — Figma. The avatar ring, and the selected state of every chip
  // and style card on Learning Preferences.
  ring: '#FFC629',           // 3px avatar ring, 1px selected border
  chipOnBg: '#FFF4CC',       // selected chip / card fill

  // derived — no panel covers these.
  danger: '#EF4444',         // "Log Out" on the Profile screen
  inkFaint: '#9CA3AF',       // the app version line, disabled field text
  camera: '#111111',         // the camera badge disc on the Edit Profile avatar

  // Figma: X0 Y2, blur 8, spread -2, #000000 at 5.1%. Identical on every selected chip
  // and style card, so it lives here rather than being retyped per style.
  //
  // RN cannot express a negative spread. `shadowRadius` alone renders a slightly wider
  // halo than the design's -2 would; at 5.1% opacity the difference is not visible.
  selectedShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.051,
    shadowRadius: 8,
    elevation: 2,
  },
};

// Inter throughout — the whole flow is set in it, and App.js already loads these four
// weights. There is no 800 here: no node in any of the three designs asks for one.
export const F = {
  reg:  'Inter_400Regular',
  med:  'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

// The horizontal gutter every one of the three screens uses. Figma: 24 on
// profile-header-container, profile-body, edit-profile-body and screen-body alike.
export const PAD = 24;

// Figma reports the uppercase labels' letter-spacing as "50%", which on 13px would be
// 6.5px and on 17px 8.5px — far wider than the same labels look in the design's own
// screenshots. Read as 0.5px, which does match them.
export const TRACK = 0.5;

export default P;
