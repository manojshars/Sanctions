# FinCrime Academy

**Master Financial Crime. Strengthen Compliance. Advance Your Career.**

A full-stack financial crime learning platform: structured academy, question bank, timed mock
examinations, spaced-repetition flashcards, interactive case simulations, knowledge hub,
certificates, memberships, a corporate training portal and a secured admin CMS.

- **Stack:** Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS · Prisma 6 · PostgreSQL
- **Auth:** self-hosted, bcrypt password hashes, DB-backed revocable sessions (HMAC-hashed tokens in httpOnly cookies), role-based access control
- **Payments:** Stripe Checkout + signed webhooks; clearly-labelled development simulation when Stripe is not configured (disabled in production)
- **Tests:** 49 unit + 44 integration (Vitest, real Postgres) + 45 end-to-end (Playwright, production build)

## Quick start

```bash
cp .env.example .env            # set DATABASE_URL and AUTH_SECRET
npm install
npx prisma migrate deploy        # create the schema
npm run db:seed                  # load sample content + demo accounts
npm run dev                      # http://localhost:3000
```

### Seeded accounts (development only)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@fincrime.academy` (or `SEED_ADMIN_EMAIL`) | `SEED_ADMIN_PASSWORD` (default `ChangeMe!Admin2026`) |
| Content editor | `editor@demo.fincrime.academy` | `DemoPass2026!` |
| Support agent | `support@demo.fincrime.academy` | `DemoPass2026!` |
| Free learner | `learner@demo.fincrime.academy` | `DemoPass2026!` |
| Premium learner | `premium@demo.fincrime.academy` | `DemoPass2026!` |
| Corporate manager (Demo Bank plc) | `manager@demo.fincrime.academy` | `DemoPass2026!` |
| Corporate learner | `employee@demo.fincrime.academy` | `DemoPass2026!` |

Set `SEED_DEMO_USERS=false` in production and change the admin password immediately.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, run production server |
| `npm run typecheck` · `npm run lint` | TypeScript and ESLint |
| `npm test` | Unit + integration tests (uses `fincrime_test` DB, see below) |
| `npm run test:e2e` | Playwright journeys against a production build (`npm run build` first) |
| `npm run db:seed` | Idempotent seed (safe to re-run; updates content by slug) |

### Testing

Integration and E2E tests use a separate database (default
`postgresql://postgres:postgres@localhost:5432/fincrime_test`, override with `TEST_DATABASE_URL`).
The test setup runs `prisma migrate deploy` + the idempotent seed; it never drops data.
E2E: `npm run build && PW_CHROMIUM_PATH=/path/to/chromium npm run test:e2e` (the path is optional
when Playwright's own browsers are installed).

## Seed content (sample, clearly labelled)

All content is original educational material written for this project:

- 11 topics · **52 courses** (AML/CTF 10, sanctions 14, fraud 10, ABC 10, other 8) with modules, lessons, exercises, objectives, final assessments
- **136 questions** in 8 formats (single, multiple, true/false, scenario, matching, fill-blank, short answer, investigation)
- **12 flashcard decks / 110 cards**, 36 glossary terms, 33 regulatory references, 16 typologies, 8 articles, 14 help articles
- **6 fictional case studies** with interactive simulations
- 4 membership plans, 5 learning packages, 6 assessment templates

Course breadth is complete, but many courses are intentionally concise; the long-term content goals
(e.g. hundreds of cards per topic, thousands of questions) are **targets, not current inventory**.
**No videos are seeded** — video IDs could not be verified from the build environment, and the
platform never publishes unverified videos. Add them through **Admin → Videos**, which validates IDs
via YouTube oEmbed.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — structure, data model, key flows, route map
- [docs/SECURITY.md](docs/SECURITY.md) — auth, RBAC, entitlements, tenant isolation, privacy
- [docs/SPACED_REPETITION.md](docs/SPACED_REPETITION.md) — scheduling algorithm and scoring rules
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — environment variables, external services, deployment
- [docs/STATUS.md](docs/STATUS.md) — completed features, known limitations, remaining configuration

## Disclaimers built into the product

Educational content only, not legal advice. Certificates are internal completion certificates, not
external accredited qualifications. Readiness scores are educational indicators and do not guarantee
success in any external examination. Training case studies are fictional.
