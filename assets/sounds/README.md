# Quiz / Challenge sounds

Drop your audio files here (replace the placeholder files of the same name).
Supported formats: `.mp3`, `.wav`, `.m4a`.

| File          | When it plays                                    |
| ------------- | ------------------------------------------------ |
| `tick.mp3`    | Looping countdown tick (for a timed quiz)        |
| `success.mp3` | All challenges complete / success                |
| `wrong.mp3`   | Wrong answer                                     |
| `correct.mp3` | Correct answer (optional)                        |

Keep the **exact same file names** — `src/utils/sound.js` `require()`s them by name.
If you change a name, update the `SOURCES` map in `src/utils/sound.js` too.

The placeholder files in this folder are empty stand-ins so the bundler resolves
the imports. The sound manager loads each file independently and silently skips
any that are missing or invalid, so the app works fine before you add real audio.

Setup: `npx expo install expo-av`
