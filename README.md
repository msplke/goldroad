# Goldroad

Goldroad lets creators in Kenya monetize a publication (newsletter, blog, community) with local payments. A creator signs in with Google/GitHub, adds bank details (provisioned as a Paystack subaccount with a 95/5 revenue split), creates a publication with monthly/annual subscription plans and optional one-time payments, and shares a public page at `/publication/[slug]`. Readers pay through Paystack payment pages; Paystack webhooks (verified, then processed as idempotent Trigger.dev tasks) record subscribers and payments, and — if the creator connects a Kit (ConvertKit) API key — paying subscribers are synced and tagged in Kit automatically. A dashboard shows revenue KPIs, subscribers, and one-time payments.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack dev) + [React 19](https://react.dev)
- [tRPC 11](https://trpc.io) with [TanStack Query 5](https://tanstack.com/query)
- [better-auth](https://better-auth.com) (Google + GitHub social login)
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL (`postgres` driver)
- [Base UI](https://base-ui.com) primitives wrapped in shadcn-style components, [Tailwind CSS 4](https://tailwindcss.com)
- [Trigger.dev v4](https://trigger.dev) for webhook-driven background jobs
- [Paystack](https://paystack.com) (subaccounts, splits, plans, payment pages, webhooks)
- [Kit](https://kit.com) v4 API (subscriber sync + tagging), keys encrypted at rest (AES-256-GCM)
- [Biome](https://biomejs.dev) (lint + format), [Zod 4](https://zod.dev), TypeScript 7
- pnpm 11, deployed on Vercel

## Prerequisites

- Node.js 24 LTS (CI uses 24.18.0)
- pnpm 11 (`packageManager: pnpm@11.13.0`)
- Docker or Podman (local Postgres via `start-database.sh`)

## Setup

```bash
git clone <repo-url> && cd goldroad
pnpm install
cp .env.example .env
```

Fill `.env` (see `src/env.ts` for the authoritative schema — all vars are required unless noted):

| Variable | Format / how to get it |
| --- | --- |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | App base URL, e.g. `http://localhost:3000` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth app credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth client credentials |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/goldroad` |
| `KIT_API_KEY_ENCRYPTION_SECRET` | Exactly 64 hex chars: `openssl rand -hex 32` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`sk_test_...` / `sk_live_...`) |
| `TRIGGER_SECRET_KEY` | Trigger.dev project secret (`tr_dev_...` / `tr_prod_...`) |

Note: `.env.example` ships `KIT_API_KEY_ENCRYPTION_SECRET` and `PAYSTACK_SECRET_KEY` empty; empty strings are treated as undefined, so `pnpm dev`/`pnpm build` fail env validation until you set real (or placeholder-format) values. `SKIP_ENV_VALIDATION=1` bypasses validation for build-only experiments.

Then:

```bash
./start-database.sh   # local Postgres in Docker/Podman (reads DATABASE_URL)
pnpm db:push          # push Drizzle schema
pnpm dev              # http://localhost:3000
```

For end-to-end payment testing you also need `pnpm trigger:dev` (runs Trigger.dev tasks locally) and a tunnel (e.g. ngrok — `*.ngrok-free.app` is allowed as a dev origin) pointed at `/api/webhooks/paystack`, registered as the webhook URL in the Paystack dashboard.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm preview` | Build then start |
| `pnpm check` | Biome lint + format check |
| `pnpm check:write` / `pnpm check:unsafe` | Biome with (unsafe) autofixes |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` | Drizzle Kit workflows |
| `pnpm trigger:dev` | Run Trigger.dev tasks locally |
| `pnpm deploy:trigger-prod` | Deploy Trigger.dev tasks (also runs in CI on push to `main`) |
| `pnpm prepare` | Husky git hooks (lint-staged runs Biome on commit) |

## Notes

- **CI / deploys:** GitHub Actions runs lint (Biome) and typecheck only — no build or tests. Vercel builds and deploys the app; `next.config.ts` sets `typescript.ignoreBuildErrors: true` because CI owns typechecking. A separate workflow deploys Trigger.dev tasks on push to `main`.
- **Dependency policy (pnpm 11):** `pnpm-workspace.yaml` sets `minimumReleaseAge: 1440` — packages must be at least 24h old to install, with **no exclusions** by design (supply-chain damping). Dependency build scripts are **denied by default**; the `allowBuilds` map lists reviewed packages, all intentionally `false` (they ship prebuilt binaries). Flip an entry to `true` only after reviewing its install script.
- **UI is Base UI, not Radix:** the Radix→Base UI migration is complete (reports per component in `.migration/`). Caveat: `components.json` still says `"style": "new-york"`, so a future `shadcn add <component>` will fetch the legacy **Radix-based** variant and pull `@radix-ui/*` back in. Until shadcn supports a Base UI style here, add components by fetching the base variant via direct registry URL or hand-port them following the patterns in `.migration/*.md`.
- **Webhooks:** `/api/webhooks/paystack` verifies the `x-paystack-signature` HMAC (SHA-512, constant-time) against the raw body, then fans out to Trigger.dev tasks keyed for idempotency.
- **Database:** all tables are prefixed `goldroad_` (`pgTableCreator`); Drizzle uses `casing: "snake_case"`.
- **Auditing:** known issues and remediation list live in `AUDIT.md`.
