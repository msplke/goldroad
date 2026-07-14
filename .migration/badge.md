# badge

2026-07-14, transformation engine (legacy new-york style: user's own file transformed in place; non-button polymorphic -> useRender + mergeProps per the universal-patterns.md worked example), migrated cleanly.

## Changed

- `src/components/ui/badge.tsx` — replaced `Slot` from `@radix-ui/react-slot` (manual `asChild ? Slot : "span"` idiom) with `useRender` from `@base-ui/react/use-render` + `mergeProps` from `@base-ui/react/merge-props` (badge is a non-button polymorphic component, so the real Button primitive does not apply).
  - Props type: `React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }` -> `useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>` (src/components/ui/badge.tsx:34); `render` is destructured and forwarded to `useRender`.
  - Applied the data-* cast pitfall from universal-patterns.md: the mergeProps object literal containing `"data-slot": "badge"` is cast `as React.ComponentProps<"span">` (src/components/ui/badge.tsx:41-44), otherwise tsc fails excess-property checking.
  - `data-slot="badge"` kept exactly (in the merged props, same DOM output). Exported names `Badge`, `badgeVariants` kept exactly. `cn(badgeVariants({ variant }), className)` composition kept exactly.
  - cva class strings untouched — no class-mapping.md patterns occur in this file.
  - No `"use client"` added (original had none): verified `useRenderElement` guards its only hook call behind `typeof document !== 'undefined'` (node_modules/@base-ui/react/internals/useRenderElement.js:70), so the hook-based Badge stays server-component-safe; it is consumed from server components (`src/components/sections/hero-landing.tsx`, `src/components/publication/publication-benefits.tsx`). The shadcn base registry badge also ships without the directive.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/badge.tsx` -> no matches.

## Left alone

- No consumer passes `asChild` to Badge (grepped `src/**` — zero call sites), so no consumer follow-up is required.
- Badge consumers (`subscribers-table.tsx`, `publication-benefits.tsx`, `publication-plans.tsx`, `hero-landing.tsx`, `kit-settings-form.tsx`) pass only `variant`/`className`/children — unaffected.

## Behavior changes

- `asChild` -> `render`: `<Badge asChild><a/></Badge>` would now be `<Badge render={<a/>}>...</Badge>`. No current consumers affected.
- Prop merging semantics now come from Base UI `mergeProps`: event handlers compose (rightmost first, cancellable via `preventBaseUIHandler`) and `className` strings concatenate, instead of Radix Slot's overwrite-then-chain behavior. Only observable when composing via `render` with conflicting props.
- Ref handling on the rendered element goes through useRender's merged-ref logic (server-side refs skipped, which is a no-op there anyway).

## Verify by hand

- Badge renders a `<span data-slot="badge">` with unchanged classes on the pricing/hero sections and subscribers table (all four variants).
- Compose once with `render={<a href="#"/>}`: the `[a&]:hover:*` variant classes activate on hover, `data-slot="badge"` is present on the anchor.
