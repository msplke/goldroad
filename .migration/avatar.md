# avatar

2026-07-14, transformation engine (legacy new-york style: user's own file transformed in place; direct part mapping), migrated cleanly.

## Changed

- `src/components/ui/avatar.tsx` — replaced `* as AvatarPrimitive from "@radix-ui/react-avatar"` with `import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"` (namespace import becomes a named import, one subpath).
  - Direct part mapping kept: `AvatarPrimitive.Root` / `.Image` / `.Fallback` (identical anatomy per display-misc.md; parts verified in node_modules/@base-ui/react/avatar/index.parts.d.ts).
  - Props types: `React.ComponentProps<typeof AvatarPrimitive.X>` -> `AvatarPrimitive.Root.Props` (avatar.tsx:7), `AvatarPrimitive.Image.Props` (avatar.tsx:20), `AvatarPrimitive.Fallback.Props` (avatar.tsx:32). Removed the now-unused `import type * as React from "react"`.
  - All three `data-slot` attributes (`avatar`, `avatar-image`, `avatar-fallback`) and all exported names (`Avatar`, `AvatarFallback`, `AvatarImage`) kept exactly. `"use client"` kept.
  - Class strings kept byte-for-byte — no class-mapping.md patterns occur in this file.
  - `delayMs` -> `delay` (Fallback): not present in this wrapper (props pass through), so nothing to rewrite here; see Behavior changes for the consumer-facing type shift.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/avatar.tsx` -> no matches.

## Left alone

- Consumers `src/components/dashboard/user-dropdown.tsx`, `src/components/dashboard/nav-user.tsx`, `src/components/dashboard/settings/personal-details-form.tsx` pass only `src`/`alt`/`className`/children — unaffected, not touched.

## Behavior changes

- Fallback's Radix `delayMs` prop is now `delay` (renamed, same meaning). No consumer uses `delayMs` (grepped — zero call sites), so nothing breaks today; any future copy-pasted radix snippet using `delayMs` will fail typecheck.
- `asChild` -> `render` on all three parts (passthrough via the new Props types). No consumer used `asChild`.
- Base UI's Image gains `data-starting-style` / `data-ending-style` hooks for load transitions — inert without CSS targeting them (none in this project).
- `Image.onLoadingStatusChange` keeps the same name and status union — no change.

## Verify by hand

- Dashboard nav-user / user-dropdown: avatar image loads and fills the 32px circle (`size-8`, rounded).
- Break the image `src` (or a user without an avatar): the fallback initials render centered on `bg-muted` after the image errors.
- Personal details form: avatar renders identically to pre-migration.
