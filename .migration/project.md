# project

## Consumer sweep

2026-07-14, consumer sweep (app call sites repointed to the Base UI wrapper APIs; `src/components/ui/*` untouched).

### Files changed

Button `asChild` -> `render` (19 sites; the work-item list said 14 — grep found 3 extra: mobile-nav.tsx:85, publication-plans.tsx:131, hero-landing.tsx:31, plus 2 in the general sweep):

- `src/components/layout/navbar.tsx` (3)
- `src/components/layout/mobile-nav.tsx` (3)
- `src/app/publication/[slug]/page.tsx` (2)
- `src/components/onboarding/onboarding-guard.tsx` (1)
- `src/components/publication/publication-share-link.tsx` (2)
- `src/components/publication/publication-plans.tsx` (2)
- `src/components/sections/hero-landing.tsx` (2)
- `src/components/layout/site-footer.tsx` (1)
- `src/components/sections/pricing.tsx` (1)
- `src/components/dashboard/settings/kit-settings-form.tsx` (1)
- `src/components/onboarding/onboarding-modal.tsx` (1)

DialogTrigger `asChild` -> `render` (4): `src/components/forms/{add-benefit-form,edit-benefit-form,clear-benefits-dialog,delete-benefit-dialog}.tsx`.

DropdownMenu consumers:

- `src/components/dashboard/user-dropdown.tsx`: Trigger + Item `asChild` -> `render`; `forceMount` REMOVED from `DropdownMenuContent` (see flags).
- `src/components/dashboard/nav-user.tsx`: Trigger `asChild` -> `render`; trigger classes `data-[state=open]:bg-sidebar-accent`/`...-foreground` -> `data-popup-open:...` (menu trigger semantics per class-mapping.md); content `w-[--radix-dropdown-menu-trigger-width]` -> `w-(--anchor-width)`.
- `src/components/mode-toggle.tsx`: Trigger `asChild` -> `render`.

Other `asChild` -> `render`: `src/components/dashboard/sidebar-nav.tsx` (SidebarMenuButton; the conditional div/a/Link child moved into `render` as a conditional expression).

FormControl children -> `render` (17 active sites + 1 inside a commented-out block, updated for consistency):

- `src/components/forms/add-benefit-form.tsx` (1), `edit-benefit-form.tsx` (1)
- `src/components/forms/add-bank-info-form.tsx` (3, incl. `render={<SelectTrigger>...}`)
- `src/components/forms/add-payment-plan-form.tsx` (3), `add-publication-form.tsx` (2), `edit-publication-form.tsx` (3), `edit-plan-pricing-form.tsx` (1), `add-kit-api-key-form.tsx` (1)
- `src/components/dashboard/settings/personal-details-form.tsx` (1 active + 1 commented), `kit-settings-form.tsx` (1)

Not needed (grep-verified zero app-code hits): TooltipProvider `delayDuration`, Avatar.Image `delayMs`, Separator `decorative`, `position="popper"|"item-aligned"`, `onOpenAutoFocus`/`onCloseAutoFocus`/`onEscapeKeyDown`/`on*Outside`, `disableHoverableContent`, `onValueCommit`, `rovingFocus`, `activationMode`.

### Behavior flags

- **forceMount removed** (`user-dropdown.tsx` DropdownMenuContent): the prop no longer exists; the wrapper does not expose Base UI's `keepMounted` (lives on `Menu.Portal`). The menu popup now unmounts from the DOM while closed instead of staying mounted. Nothing in the component reads the closed DOM (no CSS-only reveal, no refs into content), so this is expected to be invisible in practice — but it is a behavior delta, not a rename.
- **SelectValue handling** (`add-bank-info-form.tsx`): Base UI renders the raw value ("044"-style bank codes) instead of the item label. Fixed by passing `items={response?.map((bank) => ({ label: bank.name, value: bank.code }))}` to the `Select` root, so the trigger shows the bank name again. The loading/error placeholder `SelectItem`s ("loading"/"error") are disabled and unselectable, so they never reach the Value and need no `items` entries.
- **Select null/placeholder mapping** (`add-bank-info-form.tsx`, item 9): Base UI treats `""` as a real selected value (`hasSelectedValue` is only false for `null`), which would have suppressed the placeholder for the RHF default `""`, and `onValueChange` now emits `string | null`. Mapped at the boundary: `value={field.value || null}` and `onValueChange={(value) => field.onChange(value ?? "")}` — RHF state stays `string`, placeholder behavior preserved, zod schema unchanged. This was the only Select/onValueChange call site in app code.
- `nav-user.tsx` trigger open-state styling now keys off `data-popup-open` (Base UI menu trigger) instead of `data-[state=open]`; content width var moved to `--anchor-width`.
- FormControl-around-`<div>` sites (`kit-settings-form.tsx`, `add-kit-api-key-form.tsx`): the injected `id`/`aria-describedby`/`aria-invalid` land on the wrapper div, exactly as Radix Slot did before — pre-existing (imperfect) a11y wiring preserved, not a regression.

### Verification status

- `grep -rn "asChild" src --include="*.tsx"` -> 0 hits (all of src, incl. ui/).
- `grep -rni "radix" src` -> 0 hits.
- `pnpm typecheck` (tsc --noEmit) -> clean.
- `pnpm check` (biome) -> no NEW diagnostics in touched files; two touched app files were reformatted via targeted `biome check --write` (add-bank-info-form.tsx, navbar.tsx). Remaining repo diagnostics are pre-existing and out of scope for this sweep: formatting + `useSortedClasses`/a11y findings in `src/components/ui/{dropdown-menu,select,sheet,label,dialog,sidebar,tooltip}.tsx` (wrapper pass leftovers; ui/ is off-limits here) and pre-existing `useSortedClasses` nursery warnings in `mode-toggle.tsx`, `onboarding-modal.tsx`, `overview-kpis.tsx`, `features.tsx` on class strings this sweep did not author.
