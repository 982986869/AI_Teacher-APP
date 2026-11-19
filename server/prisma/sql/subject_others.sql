-- "Others" subject — a home for uploaded books that belong to no taught subject.
-- Idempotent/additive.
--   npx prisma db execute --file prisma/sql/subject_others.sql --schema prisma/schema.prisma
--
-- Why a real row rather than a UI-only option: books.subject_id is a foreign key,
-- so a dropdown entry with no row behind it cannot be saved. One row serves both
-- admin surfaces at once — the web portal and the in-app admin both read the same
-- /books/meta → books.service.subjectOptions().
--
-- It does NOT leak into student subject lists. Every student-facing read of
-- `subjects` (resources.service, results.service, parent.controller) joins through
-- `chapters`, and this subject has none — so it is visible only where subjects are
-- enumerated unconditionally, which is the books dropdown and nowhere else.
--
-- It is also a BETTER choice than leaving the subject blank. A book filed under
-- nothing is matched against every concept in every subject, which is how a maths
-- chapter picks up trigonometry it never mentions; filed under "Others" it matches
-- against the zero concepts in "Others", so the matcher stays quiet instead of
-- inventing links.

INSERT INTO "subjects" ("name", "slug", "position")
SELECT 'Others', 'others', 9999
 WHERE NOT EXISTS (SELECT 1 FROM "subjects" WHERE lower("slug") = 'others');
