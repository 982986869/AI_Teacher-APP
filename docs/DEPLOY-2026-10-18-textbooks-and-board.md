# Deploy note: textbook lessons, landscape board, doubt board (2026-10-18)

For whoever deploys the backend and builds the app. Pushed to `main` from `feat/landscape-board`.

## What this release adds

- **Learn from your textbook.** The AI Teacher teaches from NCERT books (Classes 6 to 12): pick a book, a chapter and a topic, and the lesson is generated from the book's own text.
- **Landscape lesson board.** Turning the phone sideways opens a full-screen board with short notes written in step with the voice.
- **Doubt board.** While answering a doubt, the teacher draws on the board in step with speech.

## Server: do these in this order

The order matters. If the code goes live before step 1, every lesson request returns a 500, because lesson creation now writes new columns.

1. **Run the SQL on the production database, before deploying code.**
   ```bash
   cd server
   npx prisma db execute --file prisma/sql/textbooks.sql --schema prisma/schema.prisma
   ```
   Also run `prisma/sql/books.sql` if it has never been run in production. That one is Komal's uploaded-books feature, already on main. Both files are safe to run more than once.
2. **Confirm pgvector is on:** `CREATE EXTENSION IF NOT EXISTS vector;`
3. **Deploy the server code from `main`**, then `npx prisma generate`.
4. **Load the books into the database**, on the server:
   ```bash
   node scripts/textbooks/seed-textbooks.js
   ```
5. **Embed the books for doubts and Ask the Material.** Needs `VOYAGE_API_KEY`. About 2,800 topics, so it takes a while.
   ```bash
   node scripts/textbooks/embed-textbooks.js
   ```
6. **Load balancer / proxy idle timeout must be at least 180 seconds.** A first-time lesson can take that long to generate. Shorter timeouts cut it off.

No new environment variables. It uses the existing `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY` and `ELEVENLABS_*`.

## Check it worked

- `GET /api/textbooks?class=10` with a full-access account returns 2 books (Science, Mathematics).
- Open one lesson in the app and let it play.
- `GET /api/books` still works. It is the separate uploaded-books feature.

Textbooks are behind the paid gate. A free account gets `403 LOCKED`, which is expected.

## App: needs a new build

This release adds the native package `expo-screen-orientation`. An over-the-air update is not enough. Build and ship a new app binary with EAS.

## Naming, so nobody "fixes" it back

The NCERT textbooks use `/api/textbooks` and the tables `textbooks`, `textbook_chapters`, `textbook_topics`, `textbook_lessons`. The names `/api/books`, `books` and `book_chapters` belong to the uploaded-books feature. Do not rename either side; they would collide.

## Not done yet

- Not yet checked on a real phone end to end. Tested locally: server tests pass except 2 failures that already existed on main.
- Komal's whiteboard zoom buttons do not appear in the new classroom board yet.
