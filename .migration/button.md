# button

2026-07-14, transformation engine (legacy new-york style: user's own file transformed in place, radix golden used for classification only), migrated cleanly to the real `@base-ui/react/button` primitive.

## Changed

- `src/components/ui/button.tsx` — replaced `Slot` from `@radix-ui/react-slot` (manual `asChild ? Slot : "button"` idiom) with the real Base UI Button primitive: `import { Button as ButtonPrimitive } from "@base-ui/react/button"`, which accepts `render` natively (per wrapper-shapes.md, NOT a hand-rolled useRender wrapper).
  - Props type: `React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }` -> `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>` (src/components/ui/button.tsx:42). The `asChild` prop and its destructure are gone; `render` arrives via `ButtonPrimitive.Props` and flows through `...props`.
  - Removed the now-unused `import type * as React from "react"`.
  - `data-slot="button"` kept exactly. Exported names `Button`, `buttonVariants` kept exactly.
  - cva class strings untouched — no class-mapping.md patterns (`data-[state=...]`, radix CSS vars) occur in this file.
  - Shape matches the shadcn base registry golden (`ButtonPrimitive.Props & VariantProps<...>`, `cn(buttonVariants({ variant, size, className }))`), verified against `base-lyra/button.json`.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/button.tsx` -> no matches.

## Left alone

- 14 consumer call sites still pass `asChild` to `Button` and were intentionally NOT touched (only the 5 wrapper files were in scope this run). They will fail typecheck until repointed to `render={<a .../>}` etc.:
  - `src/app/publication/[slug]/page.tsx:233,258`
  - `src/components/layout/mobile-nav.tsx:77,95`
  - `src/components/onboarding/onboarding-guard.tsx:57`
  - `src/components/publication/publication-share-link.tsx:67,88`
  - `src/components/publication/publication-plans.tsx:87`
  - `src/components/sections/hero-landing.tsx:23`
  - `src/components/layout/site-footer.tsx:35`
  - `src/components/layout/navbar.tsx:63,68,72`
  - `src/components/sections/pricing.tsx:46`
- `src/components/ui/sidebar.tsx:263` types via `React.ComponentProps<typeof Button>` and does not pass `asChild` — compiles against the new signature unchanged.
- No standalone `buttonVariants` consumers outside button.tsx.

## Behavior changes

- `asChild` -> `render`: `<Button asChild><Link/></Button>` becomes `<Button render={<Link/>}>...</Button>`. This is a compile-time break at the 14 call sites above, flagged, not patched.
- Base UI Button's ref is typed `React.RefAttributes<HTMLElement>` (Radix-era wrapper exposed `HTMLButtonElement`); consumers with `useRef<HTMLButtonElement>` may need a looser type.
- Base UI Button adds `focusableWhenDisabled` (default false) and `nativeButton`; disabled handling goes through the primitive (adds `data-disabled` state) instead of the bare DOM attribute alone.
- `className`/`style` now also accept a state function; event handlers gain Base UI's `preventBaseUIHandler` wrapper (type-level only).

## Verify by hand

- Click each variant/size on a page using them (navbar, pricing): hover/focus-visible rings render as before.
- Keyboard: Tab to a button, activate with Enter and Space.
- A disabled button shows opacity-50 and is not clickable or focusable.
- Pick one `asChild` consumer (e.g. navbar), convert to `render={<Link .../>}`, and confirm the anchor renders with button classes and navigates.
