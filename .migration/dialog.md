# dialog

2026-07-14, transformation engine (legacy new-york style: rewired the project's own file, kept its classes except mechanical class-mapping rewrites). Migrated cleanly; four consumer `asChild` call sites flagged.

## Changed

- `src/components/ui/dialog.tsx` — full rewire from `@radix-ui/react-dialog` to `import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"`.
  - Part renames: `Overlay` -> `Backdrop` (dialog.tsx:30), `Content` -> `Popup` (dialog.tsx:52). Centered modal: Popup rendered WITHOUT a Positioner, directly inside `Portal > Backdrop + Popup`.
  - Types: every `React.ComponentProps<typeof DialogPrimitive.X>` -> `DialogPrimitive.X.Props` (Root, Trigger, Portal, Close, Backdrop, Popup, Title, Description).
  - Class rewrites (mechanical, per class-mapping.md): backdrop `data-[state=open]:fade-in-0/animate-in` + closed equivalents -> `transition-opacity data-starting-style:opacity-0 data-ending-style:opacity-0` (dialog.tsx:33); popup fade/zoom keyframes -> `transition-[opacity,scale] duration-200 data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95` (dialog.tsx:55); close button `data-[state=open]:bg-accent data-[state=open]:text-muted-foreground` -> `data-open:*` (dialog.tsx:64). All other Tailwind classes kept verbatim.
  - Every exported symbol name and every `data-slot` attribute unchanged.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/dialog.tsx` -> no matches.

## Left alone

- Consumer call sites using `<DialogTrigger asChild>` (must become `render={...}` when consumers are migrated; NOT touched this run, which was wrapper-only):
  `src/components/forms/add-benefit-form.tsx:87`, `src/components/forms/edit-benefit-form.tsx:89`, `src/components/forms/clear-benefits-dialog.tsx:59`, `src/components/forms/delete-benefit-dialog.tsx:59`.
- `src/components/onboarding/onboarding-modal.tsx` — consumes DialogContent with plain className props only; no radix-specific props, unaffected.
- `package.json` — `@radix-ui/react-dialog` left installed (sheet.tsx migrated off it too this run, but dependency removal is deferred until the LAST component migrates per SKILL.md; dropdown-menu/form/select are still on radix).

## Behavior changes

- `onOpenChange` signature widened: `(open) => void` -> `(open, eventDetails) => void`. Existing single-arg consumers keep compiling and working.
- Dismiss-interception props no longer exist on DialogContent: `onEscapeKeyDown` / `onPointerDownOutside` / `onInteractOutside` -> handle via Root `onOpenChange` `eventDetails.reason` (`'escape-key'`, `'outside-press'`, `'focus-out'`) + `eventDetails.cancel()`. No consumer currently uses them.
- `onOpenAutoFocus` / `onCloseAutoFocus` -> Popup `initialFocus` / `finalFocus` (different shape: boolean | ref | function, not an event callback). No consumer currently uses them.
- `forceMount` -> Portal `keepMounted`; usually droppable (Base UI keeps the popup mounted through exit transitions natively).
- Base UI Portal renders a `<div>` wrapper (radix rendered nothing), so `data-slot="dialog-portal"` now appears in the DOM.
- Default initial focus: Base UI focuses the first tabbable element in the popup; radix focused the content container.
- Enter/exit are now CSS transitions (backdrop 150ms default, popup 200ms) instead of tw-animate keyframes; visually equivalent fade+zoom.
- `modal` prop widened to `boolean | 'trap-focus'`.
- Inert-class note: `data-open:bg-accent data-open:text-muted-foreground` on the built-in close button stays dead code (Base UI Close gets no open-state attribute — it was equally dead under radix).
- Registry-drift note (not patched): the live base-nova registry dialog still uses tw-animate keyframes keyed on `data-open`/`data-closed`; this migration follows class-mapping.md's transition idiom instead. Both work with Base UI's mounted-during-exit model.

## Verify by hand

1. Open any benefit dialog (dashboard -> add benefit): backdrop fades, panel fades+zooms in ~200ms.
2. Press Escape: dialog closes with exit transition; focus returns to the trigger button.
3. Click the backdrop: dialog closes (modal default). Tab-cycle stays trapped inside while open.
4. Built-in X close button: hover opacity, focus ring, closes on click; `sr-only` "Close" announced by screen reader.
