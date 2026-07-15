# Ailernova Admin Portal — Product Audit & Architecture

> Status: **architecture for approval — no implementation past the existing foundation.**
> Once approved, modules are built one at a time against real backend APIs. No placeholder
> pages, no fake APIs, no duplicated business logic.

---

# PART 1 — Product Audit

Every student- and parent-facing feature, mapped to its backend APIs and database tables,
with the concrete admin gaps. "Gaps" = what an operations team needs but the platform does
not expose today.

Legend: 🟢 real & server-backed · 🟡 real but read-only / partial · 🔴 mock / coming-soon / unrouted

## Domain A — Identity, Auth, Onboarding & Roles

| Feature | Purpose | Backend APIs | DB tables | State |
|---|---|---|---|---|
| Email login / register | Account creation + sign-in | `POST /api/auth/login`, `POST /api/auth/register` | `users` | 🟢 |
| Google login | Social sign-in | `POST /api/auth/google` | `users` | 🔴 mocked client-side (MOCK_MODE) |
| Phone OTP (send/verify/complete) | Phone sign-up | `/api/auth/send-otp`, `/verify-otp`, `/complete-phone-signup` | `phone_otps`, `users` | 🔴 mocked (accepts `123456`) |
| Complete Profile | Role + class/stream/board/language gate | `PATCH /api/auth/profile`, `GET /api/auth/me` | `users` (grade/board/stream/language/school/account_type) | 🟢 |
| Onboarding survey | Goals/subjects capture | `PATCH /api/auth/profile` + local flag | `users` | 🟢 |
| Role/scope engine | Student/parent/teacher/admin + dual-view | `deriveScope`, `req.scope` | `users.account_type`, `linked_student_id` | 🟢 |

**Admin gaps:** no user CRUD; no role management UI; no way to see real auth channel per user; Google/OTP are mocked so signups are email-only in practice; no session/token revocation; no email verification / bounce visibility; no bulk import of users; no impersonation for support.

## Domain B — AI Teacher (Lessons · Doubts · Ask/RAG · Study Insights)

| Feature | Purpose | Backend APIs | DB tables | State |
|---|---|---|---|---|
| Lesson generation (Learn mode) | Opus generates a multi-slide guided lesson | `POST /api/ai/lesson/generate`, `GET /api/ai/lesson/:id`, `GET /api/ai/lessons`, `GET /api/ai/lessons/progress`, `DELETE /api/ai/lesson/:id` | `lessons`, `slides`, `lesson_progress` | 🟢 |
| Live player + progress | Lip-sync avatar, whiteboard, TTS, telemetry | `POST /api/ai/lesson/:id/progress`, TTS `GET/POST /api/tts` | `lesson_progress`, `slides` | 🟢 |
| Doubts (in-lesson) | Ask a doubt on a slide | `POST /api/ai/lesson/:id/doubt`, `GET /api/ai/lesson/:id/doubts` | `doubt_sessions`, `messages` | 🟢 |
| Ask / agent (RAG) | Grounded free-form Q&A | `POST /api/ai/ask`, `POST /api/ai/ask/stream` | `knowledge_sources`, `knowledge_chunks`, `student_events` | 🟢 |
| Knowledge Ask + upload | Q&A over uploaded material; teacher upload | `POST /api/ai/knowledge-answer`, `GET/POST/DELETE /api/knowledge/*` | `knowledge_sources`, `knowledge_chunks` | 🔴 **router not mounted** in `routes/index.js` |
| Study Insights | Plan / revise / progress | `GET /api/ai/plan`, `POST /api/ai/revision`, `GET /api/ai/memory/summary`, `GET /api/ai/chapters/progress` | `student_memory`, `student_concepts`, `concepts` | 🟢 |
| Resume / continuity | "Welcome back" snapshot | `GET /api/ai/session/resume` | `student_events`, `lessons` | 🟢 |
| Memory event log | doubt/mistake/quiz telemetry | `POST /api/ai/memory/event` | `student_events`, `student_memory` | 🟢 |

**Admin gaps** — *this is the largest AI ops gap.* No visibility into: lessons generated (volume, model, latency, failures), per-lesson slide quality, flagged/failed lessons review queue, doubt/ask transcripts moderation, RAG grounding/confidence monitoring, knowledge-source management (the whole `knowledge` module is **unrouted**), prompt inventory/versioning, model configuration surface, or **AI cost/token tracking**. Prompts live in code (`server/src/prompts/*.prompt.js`) with no version store.

## Domain C — Brain Gym (Adaptive Question Intelligence)

| Feature | Purpose | Backend APIs | DB tables | State |
|---|---|---|---|---|
| Timed numeric quiz | 60s adaptive skill quiz | `GET /api/brain-gym/adaptive/questions`, `POST /api/brain-gym/adaptive/submit`, `POST /api/brain-gym/results`, `POST /api/brain-gym/attempts` | `brain_gym_sessions`, `question_attempts`, `student_mastery` | 🟢 (offline seed fallback) |
| Adaptive question bank | LLM-grown question bank w/ dedup + quality | (served by adaptive endpoints) | `generated_questions`, `question_embeddings`, `generation_history` | 🟢 |
| Progress / mastery | Per-category mastery + difficulty ladder | `GET /api/brain-gym/progress`, `GET /api/brain-gym/recommend` | `student_mastery` | 🟢 |
| Leaderboard | Weekly/monthly/all-time ranks | `GET /api/brain-gym/leaderboard` | `brain_gym_sessions` | 🟢 |
| Practice mini-games | Dartboard/tile games | none (local) | — | 🟢 local |

**Admin gaps:** `generated_questions.status` (ACTIVE/DRAFT/REJECTED/ARCHIVED) exists but has **no review/moderation UI or endpoint**; no view of the generation pipeline health (`generation_history`: requested/accepted/rejected-validation/duplicate/guardrail, cost, latency); no way to trigger/batch generation; no ambiguity-flag review; no per-question performance (served/correct/wrong) analytics; no seed-bank vs generated-bank coverage view; no manual question authoring/editing.

## Domain D — Arena (Async 1v1 Battles)

| Feature | Purpose | Backend APIs | DB tables | State |
|---|---|---|---|---|
| Matchmaking + duel | Async vs bot/ghost, authoritative scoring | `POST /api/arena/matchmake`, `GET /api/arena/active`, `POST /api/arena/result`, `POST /api/arena/abandon` | `arena_matches` | 🟢 |
| History / leaderboard | Rating, W/L, ranks | `GET /api/arena/history`, `GET /api/arena/leaderboard` | `arena_matches` | 🟢 |

**Admin gaps:** no arena analytics (matches/day, win-rate, rating distribution, abandonment), no leaderboard moderation (reset/ban a cheater), no puzzle/game configuration, no bot-difficulty tuning surface.

## Domain E — Practice / MCQ

| Feature | Purpose | Backend APIs | DB tables | State |
|---|---|---|---|---|
| MCQ practice | subject→chapter→subtopic MCQ tests | `GET /api/mcq-practice/:subject/chapters`, `/:subject/:chapter/subtopics`, `/subtopic/:id`, `/:subject/:chapter/test`, `/:subject/:chapter/progress`, `POST /api/mcq-practice/submit` | `mcq_questions`, `subtopics`, `chapters`, `subjects` | 🟢 |
| Important Qs / PYQ | Question docs in WebView | `GET /api/resources/content/:s/:c/:type` | `questions`, `sections` | 🟢 |

**Admin gaps:** no MCQ authoring/editing/bulk-import; no per-question analytics (attempt/accuracy/difficulty calibration); no coverage report (which chapters/subtopics have MCQs vs empty); MCQ attempts aren't a first-class stored table (submit scores client-side — persistence via mcqPractice.service).

## Domain F — Mock Tests

| Feature | Purpose | Backend APIs | DB tables | State |
|---|---|---|---|---|
| DB mock tests | Sectioned timed mocks + result | `GET /api/mock-tests`, `/attempts`, `/:id`, `/:id/questions`, `POST /api/mock-tests/:id/submit` | `mock_tests`, `mock_test_questions`, `mock_test_attempts` | 🟢 |

**Admin gaps:** no mock CRUD (created only by seed scripts); no attempt analytics (avg score, completion, section difficulty); no publish/schedule; no per-mock leaderboard.

## Domain G — Online Tests

| Feature | Purpose | Backend APIs | DB tables | State |
|---|---|---|---|---|
| Online tests | Timed examin8 test-papers | `GET /api/online-tests/:s/chapters`, `/:s/:c/tests`, `/test/:id` | `ot_tests`, `ot_questions` | 🟢 |

**Admin gaps:** no CRUD/import UI; attempts are **not stored server-side** (graded client-side, saved to device only) → **no online-test analytics possible without a new attempts table**; no coverage report.

## Domain H — Resources / Content Catalog

| Feature | Purpose | Backend APIs | DB tables | State |
|---|---|---|---|---|
| Subject/chapter/section browse | Class-aware catalog | `GET /api/resources/classes`, `/class-subjects`, `/subjects`, `/subjects/:s/chapters`, `/chapters/:id/sections`, `/sections/:id/questions`, `/menu/:s` | `subjects`, `chapters`, `sections`, `section_types`, `subtopics` | 🟢 |
| Revision notes | Flashcard notes per chapter | `GET /api/resources/notes/:s/:c` | `notes` | 🟢 |
| NCERT / Exemplar | Solutions per section | `GET /api/resources/ncert`, `/ncert/chapters`, `/exemplar` (legacy) + section content | `ncert_solutions`, `exemplar_solutions`, `sections` | 🟢 |
| Last Year Papers | PYQ papers | `GET /api/resources/papers/:s`, `/paper/:s`; **`POST`/`DELETE` (requireAdmin)** | `papers` (not in Prisma schema) | 🟢 (papers is the ONLY existing admin write) |

**Admin gaps** — *the biggest content gap.* No create/update/delete/reorder for subjects, chapters, sections, notes, questions, MCQs, NCERT, Exemplar (only Papers has admin writes). No draft/publish/archive workflow. No bulk import UI (imports are CLI scripts). No content-coverage matrix (class × subject × chapter × resource-type readiness — currently hardcoded gates in the app). No media/PDF management (`/pdfs` is static files).

## Domain I — Results, Learning Analytics & Mistake Book

| Feature | Purpose | Backend APIs | DB tables | State |
|---|---|---|---|---|
| My Progress | Overview, hours, subjects, recent tests | `GET /api/learning/results`, `/results/attempt/:id` | `mock_test_attempts`, `question_attempts`, `student_events` | 🟢 |
| Learning profile | Mastery states, weak/strong, revision | `GET /api/learning/profile`, `/timeline`, `/weak`, `/strong`, `/revision`, `/revision-calendar`, `/analytics` | `student_concepts`, `student_mastery`, `concepts`, `concept_prereqs` | 🟢 |
| Mistake book | Personal mistakes, resolve | `GET /api/learning/mistakes`, `POST /api/learning/mistakes/:id/resolve` | `mistake_book` | 🟢 |

**Admin gaps:** all analytics are **per-student, student-scoped** — there is no aggregate/cohort/platform-level analytics endpoint. No knowledge-graph (`concepts`/`concept_prereqs`) management. No cross-student weak-topic rollups for content decisions. No export.

## Domain J — Parent Experience

| Feature | Purpose | Backend APIs | DB tables | State |
|---|---|---|---|---|
| Link child | Link one student by email/phone | `POST /api/parent/link-child` | `users.linked_student_id` | 🟢 |
| Parent report | Aggregated child progress (huge payload) | `GET /api/parent/report` | `brain_gym_sessions`, `arena_matches`, `student_events`, `lessons`, `mistake_book`, `student_memory` | 🟢 |
| Offline events | Event carousel/store/skills/gallery | `GET /api/parent/report` (events arrays) | `offline_events`, `event_store_slides`, `event_skills`, `event_gallery` | 🟢 (DB-driven, **not in Prisma schema**) |
| Sessions / Chat / Classes tabs | Live class hub, mentor chat, classes | none | — | 🔴 coming-soon (`features.*` = false) |
| Book Demo / Trial | Booking flow + device calendar | none (local state only) | — | 🔴 mock; no persistence |

**Admin gaps:** no management of `offline_events`/store/skills/gallery (seeded via `seed-offline-events.js`, no CRUD UI); no demo/trial booking backend at all → no leads pipeline, no session scheduling; `learningTimeline`, `recommendedNextStep`, `aiTeacher`, `achievements`, `weeklyGoals`, `notifications`, `growth` are computed in the report but **unused by the UI**; no parent↔child linkage management/audit.

## Cross-cutting: what has NO admin surface at all today

- **Only 2 admin-gated endpoints exist** in the whole backend: papers import + delete.
- **Unrouted/orphaned:** the entire `knowledge` router; `offline_events` family & `papers` are not modelled in `schema.prisma`.
- **No tables for:** audit logging, announcements, app settings/feature flags, admin roles, user reports/moderation, online-test attempts, demo/session bookings, notifications.
- **Device-only state** (not server-authoritative): practice streak, practice/online-test completion badges, active lesson/match — invisible to any admin.

---

# PART 2 — Admin Portal Architecture

## 1. Principles

1. **Separate app, shared backend.** `admin/` (Next.js 14 + TS) calls a new, RBAC-guarded `/api/admin/*` namespace. The student runtime is never touched.
2. **Reuse services, never duplicate logic.** Admin controllers call existing services (`resources`, `mockTest`, `braingym`, `memory`, `learning`, `parent/insights`) for reads and thin new services only where none exist (content writes, aggregates, audit).
3. **Honesty over placeholders.** A module with no real backend is shown as **Pending** with a banner, never faked.
4. **Every mutation is audited** (actor, module, action, before/after).
5. **Design parity** with the Student system (Nunito, indigo `#4F46E5`, soft shadows, 20px cards, lucide) but tuned for density/speed.

## 2. User Roles

RBAC key = `users.admin_role` (nullable; separate from the STUDENT/TEACHER/ADMIN enum so elevation never disturbs learner data).

| Role | Intent |
|---|---|
| `super_admin` | Full control incl. managing admins, settings, destructive ops |
| `admin` | Everything except managing other admins |
| `content_manager` | Curriculum, question banks, AI Teacher config, announcements, read reports |
| `support` | Read users, reset password, deactivate, read reports/audit — no content, no delete |
| *(optional)* `analyst` | Read-only dashboards/reports/exports (proposed; add only if you want a pure read seat) |

## 3. Permission Matrix

Permissions are fine-grained strings; each API route declares one. (`✓` = granted, `R` = read-only.)

| Permission | super_admin | admin | content_manager | support |
|---|:--:|:--:|:--:|:--:|
| dashboard.view | ✓ | ✓ | ✓ | ✓ |
| users.view / edit | ✓ | ✓ | — | ✓ |
| users.role / delete | ✓ | ✓ | — | — |
| users.password | ✓ | ✓ | — | ✓ |
| admins.manage | ✓ | — | — | — |
| content.view / edit | ✓ | ✓ | ✓ | — |
| content.publish | ✓ | ✓ | ✓ | — |
| braingym.view / moderate | ✓ | ✓ | ✓ | — |
| aiteacher.view | ✓ | ✓ | ✓ | R |
| aiteacher.edit (non-runtime) | ✓ | ✓ | ✓ | — |
| moderation.view / act | ✓ | ✓ | ✓(content) | — |
| reports.view / export | ✓ | ✓ | ✓ | R |
| parents.view / manage | ✓ | ✓ | — | R |
| academics.view / edit | ✓ | ✓ | ✓ | — |
| announcements.view / edit | ✓ | ✓ | ✓ | R |
| settings.view / edit | ✓ | ✓ | — | — |
| flags.view / edit | ✓ | ✓ | — | — |
| audit.view | ✓ | ✓ | — | ✓ |

## 4. Modules & Navigation (Information Architecture)

```
OVERVIEW
  └ Dashboard
PEOPLE
  ├ Users            (Students · Parents · Teachers · Admins tabs)
  └ Parents          (linkages, reports, leads/bookings*)
LEARNING CONTENT
  ├ Content          (Classes · Subjects · Chapters · Sections · Notes · NCERT/Exemplar · Papers)
  ├ Question Bank    (MCQs · Practice questions)
  ├ Mock Tests
  ├ Online Tests
  └ Brain Gym        (Question bank moderation · Generation pipeline · Leaderboard)
AI
  └ AI Teacher       (Lessons · Doubts/Ask review · Knowledge sources · Prompts · Model config)
INSIGHTS
  ├ Reports          (Learning · Engagement · Content · AI ops · Brain Gym · Practice)
  └ Moderation       (Flagged lessons · Reported content · Question review queue)
COMMUNICATIONS
  ├ Announcements
  └ Offline Events   (events · store · skills · gallery)
ACADEMICS
  └ Academic Mgmt    (Academic year/terms · Class configuration · Content coverage matrix)
SYSTEM
  ├ Settings         (General · Notifications · Version)
  ├ Feature Flags    (+ Maintenance mode)
  └ Audit Logs
```

Nav renders only groups/items the signed-in role can access. Sidebar + topbar shell, command-palette (⌘K) jump, breadcrumb per module.

## 5. Modules in Detail

For each: **Purpose · Frontend pages · APIs (♻ reuse / 🆕 new) · DB changes · Widgets/Analytics.**

### 5.1 Dashboard
- **Purpose:** live platform pulse.
- **Pages:** `/dashboard`.
- **APIs:** 🆕 `GET /api/admin/dashboard` (aggregates over users/lessons/brain_gym/attempts/events).
- **Widgets:** Total students/parents/teachers; DAU/WAU/MAU; lessons started/completed; practice attempts; Brain Gym plays; avg accuracy; most active subjects; most difficult chapters; recent signups; pending reviews; 14-day signup sparkline; AI generation health tile; system status.

### 5.2 Users
- **Purpose:** manage every account.
- **Pages:** `/users` (table + filters + bulk), `/users/[id]` (detail drawer: profile, progress snapshot, linked parent, activity, actions).
- **APIs:** 🆕 `GET /users`, `GET /users/meta`, `GET /users/:id` (♻ reuses braingym/memory/learning services for the snapshot), `PATCH /users/:id/role`, `POST /users/:id/reset-password`, `PATCH /users/:id/status`, `DELETE /users/:id`.
- **DB:** `users.admin_role/is_active/deactivated_at`.
- **Analytics:** signups by class/board, active/deactivated counts, role distribution.

### 5.3 Parents
- **Purpose:** parent accounts, child linkages, (future) leads.
- **Pages:** `/parents` (list w/ linked child), `/parents/[id]` (their child's report, read-only).
- **APIs:** ♻ `GET /api/parent/report` internals via a 🆕 admin-scoped `GET /admin/parents`, `GET /admin/parents/:id/report`. Booking/leads = **Pending** until a bookings backend exists.
- **DB:** none new for linkage; 🆕 `demo_bookings` only if/when leads are built (separately scoped).

### 5.4 Content (Catalog)
- **Purpose:** full curriculum CRUD + draft/publish/archive.
- **Pages:** `/content` (overview counts + class picker), `/content/subjects`, `/content/chapters`, `/content/chapters/[id]` (sections + notes + questions), `/content/papers`.
- **APIs:** ♻ read via existing resources.service; 🆕 writes: `POST/PATCH/DELETE /admin/content/subjects|chapters|sections|notes|questions`, reorder endpoints, `POST /admin/content/import` (wraps existing importers), and the existing 🟢 papers import/delete.
- **DB:** 🆕 add `status` (draft/published/archived) + `updated_by/updated_at` columns to `subjects/chapters/sections/notes` (additive, default 'published' to preserve current behaviour); model `papers` + `offline_events` family in `schema.prisma`.
- **Analytics:** content coverage matrix (class × subject × resource-type), empty-chapter report.

### 5.5 Question Bank (MCQs + Practice questions)
- **Pages:** `/content/question-bank` (filter by class/subject/chapter/subtopic; per-question stats), editor drawer.
- **APIs:** 🆕 `GET /admin/questions` (mcq_questions + questions with attempt stats), `POST/PATCH/DELETE`, bulk import.
- **DB:** optional `mcq_attempts` first-class table if per-question analytics is required (today MCQ attempts aren't durably stored per-question).

### 5.6 Mock Tests / Online Tests
- **Pages:** `/content/mock-tests` (+ detail: sections, questions, attempts), `/content/online-tests`.
- **APIs:** ♻ read via mockTest/onlineTest services; 🆕 CRUD + publish; 🆕 attempts analytics.
- **DB:** 🆕 `ot_attempts` table (online-test attempts are currently device-only — **required** for any online-test analytics).

### 5.7 Brain Gym Management
- **Pages:** `/brain-gym/questions` (moderation queue: DRAFT/ACTIVE/ARCHIVED/REJECTED + ambiguity flags + per-question served/correct/wrong), `/brain-gym/generation` (pipeline health), `/brain-gym/leaderboard`.
- **APIs:** 🆕 `GET /admin/braingym/questions`, `PATCH /admin/braingym/questions/:id/status`, `PATCH .../:id` (edit), `GET /admin/braingym/generation` (over `generation_history`), `POST /admin/braingym/generate` (trigger a batch — wraps existing generationService), `GET /admin/braingym/leaderboard`.
- **DB:** none (uses `generated_questions`, `generation_history`, `question_attempts`, `student_mastery`).
- **Analytics:** accept/reject/duplicate/guardrail rates, gen latency & model, question quality distribution, hardest categories.

### 5.8 AI Teacher (monitor + configure — never runtime)
- **Pages:** `/ai-teacher` (overview + runtime config read-only + prompt inventory + non-runtime config), `/ai-teacher/lessons` (quality-review feed + flagged/failed), `/ai-teacher/doubts` (transcript review), `/ai-teacher/knowledge` (sources).
- **APIs:** 🆕 `GET /admin/ai-teacher/overview`, `GET /admin/ai-teacher/lessons`, `GET /admin/ai-teacher/lessons/:id` (slides), `GET /admin/ai-teacher/doubts`, `PATCH /admin/ai-teacher/config` (non-runtime), and — **requires first mounting the knowledge router** — `GET/POST/DELETE /admin/ai-teacher/knowledge`.
- **DB:** 🆕 optional `lesson_reviews` (flag/approve/note) and `prompt_versions` (only if you want a real versioned store — otherwise prompt editing stays **Pending**).
- **Analytics:** lessons/day, model mix, gen latency, failure rate, doubts/day, RAG grounding rate, TTS usage, **AI cost estimate**.

### 5.9 Moderation
- **Pages:** `/moderation` (unified queue: flagged lessons, reported content, Brain Gym review, doubt/ask flags).
- **APIs:** 🆕 `GET /admin/moderation`, `POST /admin/moderation/:id/act`.
- **DB:** 🆕 `content_reports` (source, target_type, target_id, reason, reporter, status). *(No user-reporting exists today — this is net-new; student app would later need a "report" affordance to populate it.)*

### 5.10 Reports & Analytics
- **Pages:** `/reports` with tabs: Learning (completion/retention/accuracy/weak-topics), Engagement (DAU/WAU/MAU, funnels, cohorts), Content (coverage, question performance), AI Ops (lessons/cost/latency), Brain Gym, Practice/Mock.
- **APIs:** 🆕 `GET /admin/reports?type=&days=` (a family of aggregate queries — none exist today; all student analytics are per-student).
- **Export:** 🆕 `GET /admin/reports/export?type=&format=csv`.

### 5.11 Announcements
- **Pages:** `/announcements` (cards + editor, draft/publish/archive, audience targeting, pin).
- **APIs:** 🆕 CRUD + transition.
- **DB:** 🆕 `announcements`. *(For the student/parent app to display them, a public `GET /api/announcements?audience=` would be added when app-side display is wanted.)*

### 5.12 Offline Events
- **Pages:** `/events` (events, store slides, skills, gallery — CRUD + active toggle + reorder).
- **APIs:** 🆕 CRUD over the four tables (♻ same data the parent report serves).
- **DB:** model `offline_events`, `event_store_slides`, `event_skills`, `event_gallery` in schema (tables already exist).

### 5.13 Academic Management
- **Pages:** `/academics` (Academic year/terms, Class configuration = which classes are "live", Content coverage matrix).
- **APIs:** 🆕 `GET/PATCH /admin/academics/*` (stored in `app_settings` + a 🆕 `class_config` concept), ♻ coverage from resources.service.
- **DB:** 🆕 `app_settings` keys (`academic_year`, `terms`), optional `class_config` table (or a settings key) to replace the app's hardcoded "ready vs coming-soon" class gates.

### 5.14 System Settings + Feature Flags
- **Pages:** `/settings` (general, notifications, version), `/settings/flags` (feature flags + maintenance mode).
- **APIs:** 🆕 `GET /admin/settings`, `PATCH /admin/settings/:key`.
- **DB:** 🆕 `app_settings` (key/value jsonb). Flags mirror the app's real switches (arena, brainGym, aiTeacher, mockTests, parentDashboard, events) + `maintenance_mode`. *(To take effect in the app, a public `GET /api/config` reading `app_settings` is added when app-side enforcement is wanted.)*

### 5.15 Audit Logs
- **Pages:** `/audit` (filterable feed + entry drawer with before/after diff).
- **APIs:** 🆕 `GET /admin/audit`, `GET /admin/audit/facets`.
- **DB:** 🆕 `audit_logs`; written by every admin mutation via a shared audit service.

## 6. Consolidated Database Changes (all additive & idempotent)

| Change | Type | Purpose | Impact |
|---|---|---|---|
| `users.admin_role / is_active / deactivated_at` | columns | RBAC + soft-deactivate | none on runtime |
| `audit_logs` | table | audit trail | new |
| `announcements` | table | broadcasts | new |
| `app_settings` | table | flags/maintenance/academic year/config | new |
| `content_reports` | table | moderation queue | new (needs app-side report affordance to fill) |
| `ot_attempts` | table | **required** for online-test analytics | new |
| `subjects/chapters/sections/notes` → `status/updated_by/updated_at` | columns | draft/publish/archive | additive, default published |
| `lesson_reviews` *(optional)* | table | AI lesson QA flags | new |
| `prompt_versions` *(optional)* | table | prompt versioning (else stays Pending) | new |
| `mcq_attempts` *(optional)* | table | per-MCQ analytics | new |
| `demo_bookings` *(optional)* | table | parent leads pipeline (else Pending) | new |
| Model `papers`, `offline_events`, `event_store_slides`, `event_skills`, `event_gallery` in `schema.prisma` | schema-accuracy | doc existing tables | none |
| Mount the `knowledge` router | wiring | enable knowledge module | activates existing code |

## 7. Consolidated New Backend APIs (`/api/admin/*`)

`auth/login·me` · `dashboard` · `users`(list/meta/detail/role/password/status/delete) · `parents`(list/report) · `content`(subjects/chapters/sections/notes/questions CRUD + reorder + import + publish) · `question-bank`(CRUD) · `mock-tests`(CRUD + attempts) · `online-tests`(CRUD + attempts) · `braingym`(questions/moderate/generation/generate/leaderboard) · `ai-teacher`(overview/lessons/doubts/knowledge/config) · `moderation`(list/act) · `reports`(family + export) · `announcements`(CRUD/transition) · `events`(CRUD) · `academics`(year/terms/class-config/coverage) · `settings`(get/patch) · `flags`(get/patch) · `audit`(list/facets).

All are **new** and RBAC-guarded. Reads reuse existing services; only content-writes, aggregate-reports, moderation and audit introduce genuinely new server logic (no duplication of runtime logic).

## 8. Dashboard Widgets (catalog)

Students · Parents · Teachers · Admins counts · New-this-week · DAU · WAU · MAU · Lessons started · Lessons completed · Completion rate · Practice attempts · Mock attempts · Brain Gym plays · Avg accuracy · Arena matches · AI lessons generated (7d) · AI failure rate · Generation accept-rate · Pending reviews · Most active subjects · Most difficult chapters · Recent signups · Signup trend · System/maintenance status.

## 9. Analytics & Reports (catalog)

- **Learning:** completion, retention (W-over-W cohort), accuracy over time, weak topics, mastery distribution, concept coverage.
- **Engagement:** DAU/WAU/MAU, activation funnel (signup→profile→first lesson→first quiz), streak distribution, feature adoption.
- **Content:** coverage matrix, empty-chapter report, question performance (accuracy/difficulty), notes/NCERT/exemplar readiness.
- **AI Ops:** lessons/day, model mix, gen latency, failure rate, doubts/day, RAG grounding, TTS usage, **estimated cost**.
- **Brain Gym:** pipeline accept/reject/duplicate/guardrail, category difficulty, question quality.
- **Practice/Mock:** attempts, avg score by subject, section difficulty.
- **Export:** CSV per report.

## 10. Cross-cutting Designs

- **Audit:** shared `audit.service.record(req, {module, action, before, after})`; best-effort (never blocks the action); every mutation calls it.
- **Feature flags:** `app_settings.feature_flags`; admin toggles; app enforcement added via a public `/api/config` when desired.
- **Tables UX:** every list = search + sort + server pagination + filters + bulk actions + keyboard nav + skeletons + empty + retry-able error.
- **Pending policy:** modules without a real backend (Sessions/leads, prompt versioning, online-test/MCQ analytics before their attempt tables ship) render an explicit **Pending** banner — never fake data.

---

# PART 3 — Implementation Roadmap (one module at a time)

> **Confirmed decisions:** Content Management = **Full CRUD + draft/publish/archive** (Phase 3 as written, incl. `status` columns on catalog tables). Build order starts at **Phase 1 — Dashboard**.

Ordered by dependency and value. Each phase lists reused vs new APIs and DB changes. **Foundation already scaffolded** (RBAC, auth, audit service, seed, Dashboard/Users/Content-lite/Reports-lite/Announcements/Settings/Audit v1) — the roadmap hardens and completes it module-by-module rather than restarting.

| Phase | Module(s) | New DB | New APIs | Notes |
|---|---|---|---|---|
| **0 — Foundation** ✅ built | RBAC, admin auth, audit service, seed, app shell/design system | `admin_role`, `audit_logs`, `announcements`, `app_settings` | `auth`, base guards | already in place; review & confirm |
| **1** | Dashboard | — | `GET /admin/dashboard` | real aggregates |
| **2** | Users + Parents | — | users CRUD, parents list/report | support workflows first |
| **3** | Content catalog (CRUD + publish) | `status` cols; model papers/events | content CRUD/reorder/import | biggest gap; wrap existing importers |
| **4** | Question Bank + Mock + Online Tests | `ot_attempts` (+opt `mcq_attempts`) | CRUD + attempts analytics | online-test analytics needs `ot_attempts` |
| **5** | Brain Gym management | — | questions/moderate/generation/generate | uses existing pipeline tables |
| **6** | AI Teacher monitor + Knowledge | mount knowledge router (+opt `lesson_reviews`) | overview/lessons/doubts/knowledge/config | no runtime changes |
| **7** | Reports & Analytics + Export | — | `reports` family + export | aggregate endpoints |
| **8** | Moderation | `content_reports` | moderation list/act | needs app-side report affordance to fully populate |
| **9** | Announcements + Offline Events | model event tables | events CRUD | announcements already v1 |
| **10** | Academics + Settings + Feature Flags | `app_settings` keys (+opt `class_config`) | academics/settings/flags | replace hardcoded class gates |
| **11** | Audit hardening + app-side `/api/config` & `/api/announcements` | — | public config/announcements | make flags/announcements take effect in the app |

**Explicitly deferred / Pending (surfaced honestly, not faked):** parent demo/trial **leads pipeline** & live **Sessions/Chat/Classes** (no backend exists), AI **prompt versioning** & **topic-generation jobs**, real **Google/OTP auth** (currently mocked). Each ships only when its backend is agreed.

---

**Awaiting approval.** On sign-off I'll implement **one module per phase**, starting where you prefer (recommend Phase 1 → Dashboard, then Phase 2 → Users), each wired to real APIs with audit + RBAC, and I'll report reused vs new APIs and DB changes per module as I go.
