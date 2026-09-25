# Architecture

## Layout

```
prisma/
  schema.prisma          # normalized PostgreSQL schema (40+ models)
  migrations/            # SQL migrations
  seed.ts, seed-data/    # idempotent sample content
src/
  app/(site)/            # public + learner pages (shared header/footer layout)
  app/admin/             # admin portal (own layout, permission-gated)
  app/api/               # search suggestions, Stripe webhook
  app/*-pdf|files|...    # route handlers for downloads (certificates, attachments, exports, CSV)
  components/            # ui/ (design system), layout/, feature components
  lib/                   # db, auth, rbac, entitlements, scoring, srs, csv, youtube, storage, email…
  server/services/       # business logic (pure DB + authorization; unit/integration tested)
  server/actions/        # thin Server Actions: session → validation → service → navigation
  middleware.ts          # signed-out redirect for private routes, noindex headers
tests/unit | integration | e2e
```

**Rule of thumb:** pages and actions never embed business rules — they call `server/services/*`,
which take an explicit actor and enforce permissions. This keeps logic testable without HTTP.

## Key flows

- **Enrolment & progress** — `services/courses.ts`: access check (`entitlements`), enrolment upsert,
  lesson progress (never downgraded), completion → `services/certificates.ts` issues a certificate
  exactly once when all lessons are complete and the final assessment is passed.
- **Assessments** — `services/attempts.ts` is one engine for practice modes (quick/standard/deep/
  topic mastery/daily/incorrect review/bookmarked), knowledge checks, mock exams, readiness and final
  assessments. Questions are selected server-side (tier-filtered, randomised), clients receive a
  sanitised view with no answer keys, answers autosave, timers are enforced server-side (30 s grace;
  late writes auto-submit), and grading uses `lib/scoring.ts`.
- **Flashcards** — `services/flashcards.ts` + `lib/srs.ts` (see SPACED_REPETITION.md).
- **Payments** — `services/payments.ts`: pending `Payment` → Stripe Checkout (or dev simulation) →
  idempotent `fulfillPayment` creates the `Membership`. Entitlements are always recomputed from DB.
- **Corporate** — `services/corporate.ts`: every call verifies the actor manages the org; learner IDs
  must belong to that org.
- **Admin CMS** — `services/admin/*`: question versioning + review workflow + CSV import + duplicate
  detection (content hash), course/lesson/deck/video/case/knowledge editing, users & memberships,
  analytics from live queries, audit logging.
- **Navigation after actions** — `server/action-redirect.ts` returns `redirectTo` to JS clients
  (followed by `useActionRedirect`, with a hard-navigation fallback) and issues real redirects for
  no-JS submissions. This avoids a hydration-time race where redirects were dropped.

## Route map (spec → route)

| # | Page | Route |
|---|---|---|
| 1–4 | Home, Academy, Catalog, Course details | `/`, `/academy`, `/academy/courses`, `/academy/courses/[slug]` |
| 5 | Lesson player | `/academy/courses/[slug]/lessons/[lesson]` |
| 6–8 | Question bank, practice session, results | `/question-bank` (+`/browse`), `/question-bank/session/[id]`, `/…/results` |
| 9–12 | Mock center, exam, results, readiness | `/mock-exams`, `/mock-exams/exam/[id]`, `/…/results`, `/mock-exams/readiness` |
| 13–15 | Flashcards library, study, daily | `/flashcards`, `/flashcards/[slug]` (+`/review`), `/flashcards/daily` |
| 16–19 | Videos, video, cases, case | `/videos`, `/videos/[id]`, `/case-studies`, `/case-studies/[slug]` |
| 20–23 | Knowledge hub, glossary, regulations, typologies | `/knowledge` (+`/articles/[slug]`), `/knowledge/glossary`, `/knowledge/regulations`, `/knowledge/typologies` |
| 24–26 | Dashboard, My Learning, Certificates | `/dashboard`, `/my-learning`, `/certificates` (+`/[id]`, `/verify/[code]`) |
| 27–29 | Support, ticket, help article | `/support` (+`/new`, `/tickets`), `/support/tickets/[number]`, `/support/help/[slug]` |
| 30–33 | Pricing, packages, corporate, corporate dashboard | `/pricing`, `/pricing/packages`, `/corporate`, `/corporate/dashboard` |
| 34–38 | About, login, register, profile, settings | `/about`, `/login`, `/register`, `/profile`, `/settings` (+`/billing`) |
| 39–47 | Admin dashboard & management | `/admin`, `/admin/courses`, `/admin/questions`, `/admin/flashcards`, `/admin/videos`, `/admin/case-studies`, `/admin/users`, `/admin/support`, `/admin/memberships` (+ `/admin/content`, `/admin/inquiries`, `/admin/audit`) |
| 48–50 | Privacy, terms, contact | `/privacy`, `/terms`, `/contact` |

Also: `/search`, `/resources`, `/notifications`, `/checkout`, `/corporate/join`, password reset & email verification.
