# sheet

2026-07-14, transformation engine (legacy new-york style: rewired the project's own file, kept its classes except mechanical class-mapping rewrites). Migrated cleanly; slide animations rewritten to starting/ending-style transitions parameterized by `data-side`.

## Changed

- `src/components/ui/sheet.tsx` — full rewire from `@radix-ui/react-dialog` to `import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"`.
  - Part renames: `Overlay` -> `Backdrop` (sheet.tsx:27), `Content` -> `Popup` (sheet.tsx:49). No Positioner (dialog-based panel).
  - Types: `React.ComponentProps<typeof SheetPrimitive.X>` -> `SheetPrimitive.X.Props` throughout; `side` stays a wrapper-level prop.
  - Overlay animation: fade keyframes -> `transition-opacity data-starting-style:opacity-0 data-ending-style:opacity-0` (sheet.tsx:30).
  - Slide animation idiom (class-mapping.md): the Popup now carries `data-side={side}` (sheet.tsx:51) and the tw-animate `slide-in-from-*` / `slide-out-to-*` keyframes are restated as explicit per-side translate under `data-[side=...]:data-starting-style:` / `data-[side=...]:data-ending-style:` (`translate-x-full`, `-translate-x-full`, `translate-y-full`, `-translate-y-full`) on the shared class string (sheet.tsx:53). `data-[state=open]:duration-500` / `data-[state=closed]:duration-300` -> `data-open:duration-500` / `data-closed:duration-300`; existing `transition ease-in-out` kept (Tailwind v4's `transition` covers `translate` and `opacity`).
  - Per-side layout classes (`inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm`, etc.) kept verbatim in the original `side === "..."` conditional branches.
  - Close button: `data-[state=open]:bg-secondary` -> `data-open:bg-secondary` (sheet.tsx:63); everything else verbatim.
  - Every exported symbol name and every `data-slot` attribute unchanged (the inline Close still has no data-slot, matching the original).
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/sheet.tsx` -> no matches.

## Left alone

- `src/components/ui/sidebar.tsx` — the only Sheet consumer (`Sheet` sidebar.tsx:188, `SheetContent side={side}` sidebar.tsx:189). It was already written against the Base UI-shaped wrapper API (plain `side` prop, no radix-only props), so it needs no change; this migration actually makes it consistent. Not modified.
- `package.json` — `@radix-ui/react-dialog` left installed until the last radix component migrates (see dialog report).

## Behavior changes

- Same dialog-family deltas as dialog.tsx: `onOpenChange` gains `eventDetails`; `onEscapeKeyDown`/`onPointerDownOutside`/`onInteractOutside` gone from SheetContent (use Root `onOpenChange` reason + `cancel()`); `onOpenAutoFocus`/`onCloseAutoFocus` -> Popup `initialFocus`/`finalFocus`; `forceMount` -> Portal `keepMounted`; Portal renders a `<div>` wrapper; `modal` widened to `boolean | 'trap-focus'`; initial focus goes to first tabbable element.
- Slide is now a CSS transition (translate from full offset) instead of tw-animate keyframes; enter 500ms / exit 300ms preserved via `data-open:`/`data-closed:` durations. Overlay fade is the 150ms transition default (matches tw-animate's old 150ms default).
- New DOM attribute `data-side="right|left|top|bottom"` on the sheet panel (canonical Base UI registry shape; also available for consumer styling). Purely additive.
- `data-open:bg-secondary` on the built-in close button remains dead code (Close never gets an open-state attribute; equally dead under radix).

## Verify by hand

1. Shrink the viewport to mobile and open the sidebar (sidebar.tsx renders `SheetContent side={side}`): panel slides in from its edge over 500ms, backdrop fades.
2. Close via Escape and via backdrop click: panel slides out over 300ms; focus returns to the trigger.
3. Try each `side` value in a scratch usage (`top`, `bottom`, `left`, `right`): slide direction matches the edge, borders sit on the inner edge.
4. Built-in X button closes the sheet; focus ring visible when tabbing to it.
