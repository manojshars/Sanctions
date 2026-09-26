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
- Admin: analytics, course/module/lesson editor, question editor with versions + review workflow + CSV import + duplicate detection, flashcards, videos, case studies, knowledge & help content, training-material PDF uploads (course materials and standalone library items: upload, replace, publish/hide, delete), users/roles/status/memberships/enrolments, support desk, memberships/packages/coupons/fee assistance, inquiries, audit log.
- SEO: metadata, Open Graph, sitemap, robots, structured data; private routes noindexed.

## Test results (latest run)
- TypeScript: clean · ESLint: clean · Production build: succeeds
- Vitest: **104 passed** (53 unit, 51 integration against PostgreSQL)
- Playwright: **47 passed** (29 public pages, header links, auth redirects, search, certificate verify, theme, learner journeys, admin journeys incl. PDF material upload/download/delete, support staff reply, mobile layout on 23 pages)

## Not verified / requires configuration
- **Stripe** — code path implemented; not exercised against Stripe (no keys). Dev simulation tested end-to-end.
- **Email delivery** — Resend adapter implemented; not tested (no key). Emails are logged to `EmailLog`.
- **YouTube** — the build environment's network policy blocked youtube.com, so no video IDs could be verified and **no videos are seeded**. oEmbed validation is unit-tested with mocked responses.
- **Regulatory links** — official URLs were written from editorial knowledge; outbound access to regulator sites was blocked, so links were **not live-checked**. "Last reviewed" dates reflect the seed date. Verify before launch.
- File storage: a Vercel Blob driver is implemented and unit-tested with a mocked Blob API, but it has **not** been run against a real Blob store. Local disk is tested end-to-end.
- **Vercel deployment:** the build script was verified locally by simulating a production build against a fresh database (migrations, then the seed with password enforcement and no demo users). The app has not been deployed to Vercel from this environment, because that needs the owner's Vercel account.
- Rate limiting is per-instance memory.
- Legal pages are templates requiring counsel review.

## Known limitations / next steps
- Content depth: many courses have 1–3 lessons; question bank has 136 items (targets are much larger).
- Admin forms reload defaults after a validation error (input not preserved); on the material form the chosen PDF must be re-selected.
- Question papers can be imported as CSV only; PDF question papers are stored as downloadable materials, not parsed into the question bank.
- The PDF active-content check scans uncompressed PDF syntax; markers inside compressed object streams are not detected (downloads are always served as attachments with `nosniff`).
- Postgres RLS not enabled (app-layer authorization only; see SECURITY.md).
- No WCAG audit tooling run beyond semantic markup, focus states, labels and contrast choices.
