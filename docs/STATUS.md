# Status

## Completed (implemented and tested)
- Design system (navy/gold, Inter + Manrope, light/dark), responsive header with grouped menus and mobile drawer, footer, logo/favicon, loading/empty/error states, cookie consent.
- Homepage with all specified sections using live data (no fabricated statistics or testimonials).
- Auth: register, login, logout, email verification, password reset, profile, settings, data export, account deletion.
- Academy: catalog with filters (topic, level, duration, access, certificate, format, keywords) + pagination, course details (objectives, modules, resources, related, final assessment, certificate eligibility, JSON-LD), lesson player (progress autosave/resume, exercises, knowledge checks).
- Question bank: 8 formats, practice modes (quick/standard/deep/topic mastery/daily challenge/incorrect review/bookmarked), timed mode, bookmarks & flags, explanations, history, resume, browse.
- Mock exams: templates (20/50/100/120 + configurable), timer, navigator, mark for review, autosave, confirm, auto-submit, results with topic analytics, retakes, score history; readiness assessment with strengths/gaps/recommendations and disclaimer.
- Flashcards: decks, flip, prev/next, shuffle, bookmark, ratings, known, personal decks, custom cards, add-to-deck, search, daily review, SRS dashboard, Flashcard of the Day.
- Videos: library, detail with privacy-enhanced click-to-load embeds, watchlist, watched, learning plan, notes, playlists, admin validation via oEmbed.
- Case studies: 6 fictional interactive simulations with graded feedback and model reasoning.
- Knowledge hub: articles, glossary, regulatory library (current/historical), typologies; global search with suggestions, filters and recent searches.
- Certificates: issuance rules, PDF, verification codes, public verification, LinkedIn add-to-profile.
- Support: help center, FAQs, tickets with attachments, statuses, notifications; staff assignment, priority, internal notes, metrics.
- Commerce: plans, packages, comparison, checkout (Stripe / dev simulation), coupons, fee assistance, billing history, invoices, cancellation.
- Corporate: org creation, invitations, assignments with deadlines, progress & assessment reporting, CSV export, workshop requests, tenant isolation.
- Admin: analytics, course/module/lesson editor, question editor with versions + review workflow + CSV import + duplicate detection, flashcards, videos, case studies, knowledge & help content, users/roles/status/memberships/enrolments, support desk, memberships/packages/coupons/fee assistance, inquiries, audit log.
- SEO: metadata, Open Graph, sitemap, robots, structured data; private routes noindexed.

## Test results (latest run)
- TypeScript: clean · ESLint: clean · Production build: succeeds
- Vitest: **93 passed** (49 unit, 44 integration against PostgreSQL)
- Playwright: **45 passed** (29 public pages, header links, auth redirects, search, certificate verify, theme, learner journeys, admin journeys, support staff reply, mobile layout on 23 pages)

## Not verified / requires configuration
- **Stripe** — code path implemented; not exercised against Stripe (no keys). Dev simulation tested end-to-end.
- **Email delivery** — Resend adapter implemented; not tested (no key). Emails are logged to `EmailLog`.
- **YouTube** — the build environment's network policy blocked youtube.com, so no video IDs could be verified and **no videos are seeded**. oEmbed validation is unit-tested with mocked responses.
- **Regulatory links** — official URLs were written from editorial knowledge; outbound access to regulator sites was blocked, so links were **not live-checked**. "Last reviewed" dates reflect the seed date. Verify before launch.
- File storage is local-disk; configure object storage for production.
- Rate limiting is per-instance memory.
- Legal pages are templates requiring counsel review.

## Known limitations / next steps
- Content depth: many courses have 1–3 lessons; question bank has 136 items (targets are much larger).
- Admin forms reload defaults after a validation error (input not preserved).
- Postgres RLS not enabled (app-layer authorization only; see SECURITY.md).
- No WCAG audit tooling run beyond semantic markup, focus states, labels and contrast choices.
