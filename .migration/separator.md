# separator

2026-07-14, transformation engine (legacy new-york style: user's own file transformed in place), migrated cleanly; `decorative` dropped with a flagged a11y delta.

## Changed

- `src/components/ui/separator.tsx` — replaced `@radix-ui/react-separator`'s `SeparatorPrimitive.Root` with the callable single-part primitive: `import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"`, rendered as `<SeparatorPrimitive>` (no `.Root`, per universal-patterns.md).
  - Props type: `React.ComponentProps<typeof SeparatorPrimitive.Root>` -> `SeparatorPrimitive.Props` (src/components/ui/separator.tsx:11).
  - `decorative = true` destructure and prop dropped entirely (no Base UI equivalent; display-misc.md).
  - `orientation = "horizontal"` default kept and still forwarded explicitly.
  - `data-slot="separator"` kept exactly. Exported name `Separator` kept exactly. Removed the now-unused `import type * as React from "react"`.
  - Class string kept byte-for-byte: `data-[orientation=horizontal]:` / `data-[orientation=vertical]:` selectors are identical on both sides (display-misc.md: `[data-orientation]` unchanged), so no class-mapping rewrite applies.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/separator.tsx` -> no matches.

## Left alone

- `src/components/ui/sidebar.tsx:361-372` (`SidebarSeparator`) wraps this component via `React.ComponentProps<typeof Separator>` passthrough — compiles unchanged against the new props type; it passes no `decorative`.
- No consumer anywhere passes `decorative` (grepped `src/**` — zero call sites), so dropping it breaks no call site.

## Behavior changes

- FLAGGED: Radix rendered `role="none"` when `decorative` (this wrapper defaulted `decorative={true}`, so every separator in the app was hidden from the accessibility tree). Base UI's separator is always semantic `role="separator"` — screen readers now perceive every separator. Not patched (spec: for purely visual rules the escape hatch is a plain `<div aria-hidden="true">`, a consumer-level decision).
- Vertical separators now also get `aria-orientation="vertical"` semantics from the primitive.

## Verify by hand

- Sidebar: horizontal separator renders 1px tall, full width (`mx-2 w-auto` override intact).
- Render one `orientation="vertical"` in a flex row: 1px wide, full height.
- Optional a11y spot-check: VoiceOver/NVDA now announces a separator where it previously said nothing (expected new behavior).
