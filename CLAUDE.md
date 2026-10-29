@AGENTS.md

# Deploy routine (AWS EC2, since cutover 2026-10-26)

`main` is live: the EC2 server (`api.ailernova.in`, `admin.ailernova.in`) runs `main`. Render is suspended.

Push to `main`, then on the server: `cd ~/app && git pull`, then rebuild/restart (cheat sheet in `.claude/MIGRATION.md`).

Mobile app JS changes reach users via `npx eas-cli@latest update --channel production --platform android` (needs `EXPO_TOKEN`; all-platform uploads time out on the 44 MB bundle).

Claude: remind the user of this routine whenever code is going to the AWS server.
