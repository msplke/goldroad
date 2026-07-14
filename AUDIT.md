# Goldroad Repo Audit — 2026-07-14

Scope: full source audit after dep update / TS 7 / pnpm 11 / Radix→Base UI migration.
Method: manual read of all of `src/`, config, CI; `pnpm check` (Biome), `pnpm typecheck` (clean), `pnpm dlx knip` (with `SKIP_ENV_VALIDATION=1`), grep-based secret scan.
Findings are ordered by severity. Anything not directly proven is marked "unverified suspicion".

---

## CRITICAL

### C1. ~~`UPDATE` without `WHERE` corrupts every creator's Kit tag info~~ — FIXED in this run
`src/server/api/routers/creator.ts:195` — in `addOrUpdateKitApiKey`, when a `tagInfo` row already exists the code runs `await ctx.db.update(tagInfo).set(values);` with **no `.where()` clause**. Drizzle executes this as `UPDATE goldroad_tag_info SET ... ;` against **all rows**, and `values` includes `creatorId`, so every other creator's tag_info row is reassigned to the calling creator and overwritten with their Kit tag IDs. Any authenticated user who re-submits a Kit API key (Settings → Kit form, `src/components/dashboard/settings/kit-settings-form.tsx`) triggers it. Cross-tenant data corruption; silently breaks Kit tagging for all other creators.
**Fix:** `await ctx.db.update(tagInfo).set(values).where(eq(tagInfo.creatorId, creatorId));`
**Status: fixed during the July 2026 update run** (commit "fix(creator): scope Kit tag-info update to the current creator"). Kept here for the record; consider a lint guard — Biome has no drizzle plugin, so a code-review checklist item or a thin `updateWhere` helper is the practical guard.

---

## HIGH

### H0. Trigger.dev production deploys are broken: "Project not found"
`.github/workflows/release-trigger-prod.yml` — the deploy on the July 2026 merge failed with `Project not found: proj_ylfntikuurvooheskvbe` (run 29347541617). The workflow last succeeded 2025-12-14; nothing in the repo changed the project ref (`trigger.config.ts`), so the Trigger.dev-side project or the `TRIGGER_ACCESS_TOKEN` secret has likely been deleted/rotated/rescoped in the meantime. Until fixed, scheduled/background jobs run the December 2025 task code.
**Fix:** verify the project ref in the Trigger.dev dashboard and re-issue/update the `TRIGGER_ACCESS_TOKEN` repo secret, then re-run the workflow.


### H1. Renewal-payment webhooks are deduplicated by subscription code only — renewals get silently dropped
`src/app/api/webhooks/paystack/events/payment.ts:195-197` (`paystack-invoice-payment-success-${data.subscription.subscription_code}`) and `payment.ts:148-150` (failed-payment variant). The Trigger.dev idempotency key contains no invoice/reference component, so **every renewal of the same subscription produces the same key**. Within the idempotency-key TTL (Trigger.dev default 30 days) the second `invoice.update` is treated as a duplicate and never processed: `totalRevenue` and `nextPaymentDate` are not updated. Guaranteed loss for the daily/hourly (test) intervals; monthly renewals sit right at the 30-day TTL boundary. Compare the one-time-payment key, which correctly uses the payment `reference` (`payment.ts:73-75`).
**Fix:** include a per-invoice discriminator in the key, e.g. `...-${subscription_code}-${data.id ?? data.reference}` (same for the failed-payment key).

### H2. Global-unique subscriber email loses paid subscriptions
`src/server/db/schema/app-schema.ts:14` — `paidSubscriber.email` is `unique()` across the whole table, but `createSubscriber` (`src/server/actions/webhooks/paystack.ts:104-118`) only guards conflicts on `paystackSubscriptionCode`. Two real flows violate the email constraint: (a) the same reader subscribing to a second creator's publication, (b) a reader re-subscribing after cancellation (new subscription code, same email). The insert throws, the Trigger.dev task fails all retries, and a **charged** subscriber is never recorded in the DB (dashboard, revenue, Kit sync all miss them).
**Fix:** drop the unique constraint on `email` (or scope it as `unique(email, planId)`), and decide upsert semantics for re-subscribes.

---

## MEDIUM

### M1. Open-redirect-shaped check in login `callbackURL`
`src/app/(auth)/login/login-form.tsx:23` — `raw?.startsWith("/")` accepts protocol-relative URLs like `//evil.com`, which browsers treat as absolute. Whether it is exploitable end-to-end depends on better-auth's server-side callbackURL/trustedOrigins validation (v1.6.23 is expected to reject external callback URLs — unverified suspicion for the server side; the client-side check is defective as written).
**Fix:** `raw?.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard"`.

### M2. `"use server"` on non-action helpers exposes them as public endpoints
`src/server/actions/trpc/creator.ts:1` — `getCreator`/`checkCreatorExists` are plain server helpers called from tRPC routers, but the `"use server"` directive registers them as Next.js Server Actions, i.e. public POST endpoints. Direct exploitation is limited (the first argument is a Drizzle handle an attacker cannot serialize, so calls throw), but it is needless attack surface and violates the "server actions are public endpoints and must self-authorize" rule.
**Fix:** delete the `"use server"` directive (use `import "server-only"` instead, as `src/server/actions/webhooks/paystack.ts` already does).

### M3. Dashboard KPIs count every subscriber as "active" (and into MRR)
`src/server/api/routers/subscriber.ts:45-51` — `activeSubscriberCount` has no `status = 'active'` filter; `subscriber.ts:62-80` computes MRR over all subscribers including `cancelled`/`attention`/`non-renewing`. Overstates active subscribers and MRR.
**Fix:** add `eq(paidSubscriber.status, "active")` (or an `inArray` of revenue-bearing statuses) to both queries.

### M4. Module-scope secret/env derivation makes every importer require env at build time
- `src/server/crypto/kit-secrets.ts:7` — `KEY = Buffer.from(env.KIT_API_KEY_ENCRYPTION_SECRET, "hex")` runs at import.
- `src/server/fetch-clients/paystack/client.ts:24` — `Authorization: Bearer ${env.PAYSTACK_SECRET_KEY}` at import.

Any module transitively importing these (routers, webhook handlers, Trigger tasks) needs the real env at build/analysis time; it is why `knip` fails without `SKIP_ENV_VALIDATION=1` and why placeholder builds break (see L8). Robustness, not a leak.
**Fix:** derive lazily (`function getKey()` with memoization; pass headers per-request in the Paystack client).

### M5. Partial Kit-tag creation is cast away, then written to NOT NULL columns
`src/server/api/routers/creator.ts:347-352` — after logging "Some tags could not be created", the map is force-cast `as Record<KitTag, number>`; `values` at `creator.ts:181-192` then feeds possibly-`undefined` tag IDs into NOT NULL `tagInfo` columns → runtime DB error after tags were already half-created on Kit (non-idempotent partial state).
**Fix:** fail fast if `missingTags.length > 0` (before any DB write), or make the columns nullable and handle nulls downstream.

### M6. No security headers configured
`next.config.ts` has no `headers()` — no `frame-ancestors`/`X-Frame-Options` (dashboard is embeddable → clickjacking), no `X-Content-Type-Options`, no `Referrer-Policy`, no CSP. Vercel only adds HSTS.
**Fix:** add a `headers()` block with at minimum `frame-ancestors 'none'`, `nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## LOW

### L1. Webhook signature check can throw on malformed signature header
`src/app/api/webhooks/paystack/index.ts:96-98` — HMAC-SHA512 over the raw body with `timingSafeEqual` is correct, but `Buffer.from(signature, "hex")` on a same-length non-hex string yields a shorter buffer and `timingSafeEqual` throws `RangeError` → unhandled 500 instead of 400.
**Fix:** validate `/^[0-9a-f]{128}$/i.test(signature)` first (or wrap in try/catch).

### L2. No webhook replay-freshness check
`src/app/api/webhooks/paystack/route.ts:4-22` — a captured request replays successfully forever (Paystack provides no signed timestamp). Mitigated by task idempotency keys — which is exactly why H1 also matters.
**Fix:** accept as residual risk, but fix H1 so idempotency actually holds per event.

### L3. Unauthenticated Paystack proxy without rate limit
`src/server/api/routers/paystack.ts:12-37` — `paystack.bank` is a `publicProcedure` proxying Paystack with `cache: "no-store"`; anonymous callers can burn the Paystack API quota.
**Fix:** cache the bank list (it changes rarely) and/or require a session.

### L4. Plan amount handling: unbounded, float-permissive, duplicated conversion
`src/server/api/routers/plan.ts:14-27` — no upper bound and no `.int()` on amounts; `plan.ts:182` hand-rolls `input.amount * 100` (un-rounded float) instead of `fromBaseUnitsToSubunits` (`src/lib/utils.ts:109-114`) used at `plan.ts:272`. Creator-supplied only (no client-trusted pricing for payers), so integrity impact is on the creator's own plan.
**Fix:** `z.number().int().max(...)` and use `fromBaseUnitsToSubunits` in `updatePricing`.

### L5. Benefit-count limit race
`src/server/api/routers/publication.ts:415-427` — count-then-insert inside a default-isolation transaction; two concurrent `addBenefit` calls can exceed `MAX_BENEFITS_PER_PLAN`. Cosmetic limit only.
**Fix:** enforce with a partial constraint/advisory lock, or accept.

### L6. Required-but-unused env and dead parameter
- `src/env.ts:18` — `BETTER_AUTH_URL` is required by the schema but never read (auth base URL is computed from Vercel vars in `src/auth/server.ts:9-14`).
- `src/lib/auth.ts:10` — `initAuth`'s `productionUrl` option (passed at `src/auth/server.ts:18`) is never used inside the function.

**Fix:** wire them up (e.g. `trustedOrigins: [productionUrl]`) or delete both.

### L7. Public publication page swallows all errors as 404
`src/app/publication/[slug]/page.tsx:76-78` — `catch (_error) { notFound(); }` turns DB outages and bugs into 404s, hiding real failures. Also `publication.getBySlug` (`src/server/api/routers/publication.ts:338-343`) 404s a publication that merely has no plans yet.
**Fix:** rethrow non-`NOT_FOUND` TRPC errors; render a plans-empty state instead of 404.

### L8. `.env.example` has empty values for required vars — even placeholder builds fail
`.env.example` sets `KIT_API_KEY_ENCRYPTION_SECRET=""` and `PAYSTACK_SECRET_KEY=""`; with `emptyStringAsUndefined: true` (`src/env.ts:73`) a copied `.env` fails validation on `pnpm build`/`dev` (CI survives only because it runs lint+typecheck, never build).
**Fix:** ship working placeholders, e.g. `KIT_API_KEY_ENCRYPTION_SECRET="0000000000000000000000000000000000000000000000000000000000000000"` (64 hex chars) and `PAYSTACK_SECRET_KEY="sk_test_placeholder"`, with generation commands in comments.

### L9. Unused dependencies
- `package.json:34` — `@tanstack/react-table` (tables are hand-rolled over `~/components/ui/table`; zero imports).
- `package.json:59` — `@trigger.dev/build` (no build extensions in `trigger.config.ts`; zero imports).

**Fix:** `pnpm remove @tanstack/react-table @trigger.dev/build`. (All other deps verified imported; knip agrees.)

### L10. Dead files
`src/components/dashboard/dashboard-header.tsx`, `src/components/dashboard/nav-user.tsx`, `src/components/sections/testimonials.tsx` (only referenced from commented-out code at `src/app/(marketing)/page.tsx:6,15`) — zero importers (knip + grep).
**Fix:** delete (restore testimonials from git history if ever needed).

### L11. Dead/misleading config data
`src/config/onboarding.ts:54-75` — hardcoded `selectOptions.bankCode` is a **Nigerian** bank list in a KES/Kenya product, and is dead: the form fetches banks live via `api.paystack.bank` (`src/components/forms/add-bank-info-form.tsx:33`). `src/config/onboarding.ts:124` — step-3 `benefits` field has no counterpart in `step3Schema` (`src/lib/validators/onboarding.ts:16-24`) or `add-payment-plan-form.tsx`.
**Fix:** delete `selectOptions` and the orphaned `benefits` field.

### L12. Commented-out code inventory
`src/server/api/routers/user.ts:14,47-64,70` (email-change logic), `src/app/(protected)/dashboard/settings/page.tsx:1,18` (`BankDetailsForm` — component file does not exist), `src/app/(marketing)/page.tsx:6,15` (`Testimonials`), `src/server/db/schema/app-schema.ts:129-130` (kit tag columns), `src/app/publication/[slug]/page.tsx:257`.
**Fix:** delete; git history preserves them.

### L13. 16 Biome `nursery/useSortedClasses` warnings
`pnpm check`: 16 fixable warnings (e.g. `src/components/ui/tooltip.tsx:63`), all in class strings, all with unsafe-marked fixes. The rule is nursery (unstable).
**Fix:** either run `pnpm check:unsafe` once and review the diff, or drop `"useSortedClasses"` from `biome.jsonc:27-29` until the rule stabilizes.

### L14. TODOs
`src/server/api/routers/publication.ts:83` (unify front/back validation schemas) and `:273-274` (public page should verify creator onboarding before offering payment — largely moot since plan creation requires `splitCode`, but the one-time payment page path is created at publication time).

---

## INFO

- **I1.** `components.json` still declares `"style": "new-york"` — future `pnpm dlx shadcn add <component>` fetches the legacy Radix-based variants and will reintroduce `@radix-ui/*` deps into this Base UI codebase. Workaround until shadcn ships Base UI styles: fetch base variants by direct registry URL, or hand-port using the patterns in `.migration/*.md`. Documented in README.
- **I2.** `src/server/api/trpc.ts:92-107` — `timingMiddleware` logs every procedure call via `console.log` in production and injects artificial 100–500 ms delays in dev (create-t3-app default). Extensive `console.log` throughout routers/webhooks; consider a leveled logger and dropping the prod path log.
- **I3.** Inconsistent DB handle usage: `src/server/api/routers/subscriber.ts:17`, `user.ts:19`, `creator.ts:47` import the global `db` instead of using `ctx.db` — breaks future per-request transaction/context injection.
- **I4.** `src/auth/server.ts:22-24` exports a cached `getSession` that nothing uses; `src/app/(protected)/dashboard/layout.tsx:23-25` re-implements the call inline. Use the helper.
- **I5.** `src/app/(protected)/dashboard/layout.tsx:31-35` runs a mutation (`api.creator.create()`) during layout render on every request until the creator row exists — side effect in render; move to an explicit onboarding action.
- **I6.** `src/server/services/paystack/*` is an interface + single-implementation class wrapping one endpoint (`paymentPage.create`) while sibling code calls `paystackClient` directly — over-engineering; either route all Paystack calls through the service or drop it.
- **I7.** `src/hooks/use-onboarding.tsx:107-132` — `useEffect` depends on `steps`, a new array every render, so the effect runs each render (benign due to same-value `setState`, but fragile).
- **I8.** knip reports 54 unused exports — mostly intentional shadcn-style UI surface (`DropdownMenuSub`, `SidebarRail`, …); non-UI ones worth pruning: `handleSubscriptionDisabledEvent`/`handleSubscriptionCancelledEvent` exports (`src/app/api/webhooks/paystack/events/cancellation.ts:28,59` — only called internally), `baseUrl` (`src/auth/server.ts:9`), `createPlan` schema (`src/server/fetch-clients/paystack/schemas/plan.ts:32`).
- **I9.** `src/server/api/routers/publication.ts:560-562` — `checkForExistingPublication` docstring ("Returns an empty Promise. Throws an error…") describes behavior the function does not have; it returns the row or undefined.
- **I10.** No `engines` field in `package.json`; Node is pinned only in CI (24.18.0). Add `"engines": { "node": ">=24" }` to fail fast locally.
- **I11.** `next.config.ts:11` `typescript.ignoreBuildErrors: true` is intentional (CI typechecks separately) — fine, but note Vercel production builds will ship through TS errors if CI is ever skipped.

## Verified OK (no finding)

- Webhook signature: HMAC-SHA512 over the raw body, length-checked `timingSafeEqual` (`src/app/api/webhooks/paystack/index.ts:88-99`).
- Every mutating tRPC procedure uses `protectedProcedure` with zod input; all publication/plan/benefit mutations verify ownership via `creatorId` before writing (no IDOR found across `src/server/api/routers/*`).
- Pricing/currency are fully server-side (Paystack plans/pages created with server-computed amounts, `currency: "KES"` hardcoded at `src/server/api/routers/plan.ts:274`); payers never supply amounts.
- Kit API keys stored AES-256-GCM encrypted with random IV (`src/server/crypto/kit-secrets.ts`); never returned to the client (`creator.get` exposes only `hasKitApiKey`).
- Secret scan clean (no `sk_live`, `whsec_`, PEM blocks, tokens in tracked files); `.env` gitignored and untracked; only the single `sql\`\`` template is a parameterized increment (`src/server/actions/webhooks/paystack.ts:292`).
- All 7 `target="_blank"` sites carry `rel="noopener noreferrer"`; zero `dangerouslySetInnerHTML`.
- One-time payment and subscription-create webhook tasks are idempotent on reference/subscription code with matching DB `onConflictDoNothing` guards.
