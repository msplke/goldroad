# select

2026-07-14, transformation engine (legacy new-york style; no base golden pair, user's own file transformed, classes kept except mechanical rewrites; anatomy per wrapper-shapes.md). Verdict: migrated to `@base-ui/react/select`, all 10 exports preserved; `position` prop replaced by `alignItemWithTrigger`.

## Changed

- `src/components/ui/select.tsx` (whole file):
  - Import: `* as SelectPrimitive from "@radix-ui/react-select"` -> `{ Select as SelectPrimitive } from "@base-ui/react/select"`. Prop types -> `SelectPrimitive.X.Props`.
  - `Select` (select.tsx:8): now a bare re-export `const Select = SelectPrimitive.Root` per wrapper-shapes (`Root.Props` is generic `<Value, Multiple>`, which breaks the ComponentProps wrapper pattern). The former `data-slot="select"` is gone — note it never reached the DOM (Radix Root rendered no element), so no consumer selector could depend on it.
  - `SelectTrigger` (select.tsx:18): `Icon asChild` -> `render={<ChevronDownIcon .../>}`; `size` prop, `data-size`, and full class list unchanged (trigger is still a native button, so `disabled:`/`aria-invalid:` variants stay live; `data-[placeholder]:` attribute unchanged in Base UI).
  - `SelectContent` (select.tsx:47): Radix `Portal > Content > (ScrollUp, Viewport, ScrollDown)` -> `Portal > Positioner > Popup > (ScrollUpArrow, List, ScrollDownArrow)`. `position="popper"|"item-aligned"` dropped; `alignItemWithTrigger` (boolean, on Positioner) exposed instead, **default `false`** to preserve this wrapper's `position = "popper"` default (deliberate divergence from the base registry's default-true shape; flipping it would restyle every existing select). `align`/`alignOffset`/`side`/`sideOffset` declared, destructured, and explicitly forwarded to Positioner; `align = "start"` default added because Radix Content defaulted `align="start"` while Base Positioner defaults `'center'` (form-controls.md). Positioner carries no class (wrapper-shapes: select keeps z-handling on the Popup, which retains `relative z-50`).
  - Popup classes: mechanical rewrites only — `animate-in/out + fade/zoom/slide-*` -> `transition-[opacity,transform]` + `data-starting-style:`/`data-ending-style:` (opacity/scale + per-`data-[side=...]` starting translate); `--radix-select-content-available-height` -> `--available-height`; `--radix-select-content-transform-origin` -> `--transform-origin`. The popper-only 4px offset translate classes are kept, now keyed to `!alignItemWithTrigger` (sideOffset intentionally NOT defaulted to 4, which would double the gap).
  - `Viewport` -> `List` (select.tsx:85): `p-1` kept; popper-only classes keyed to `!alignItemWithTrigger` with `--radix-select-trigger-height/width` -> `--anchor-height`/`--anchor-width` (vars inherit from Positioner).
  - `SelectLabel` -> `GroupLabel` part (NOT Base UI's new `Select.Label`, which labels the trigger).
  - `SelectItem` (select.tsx:113): structure kept (indicator span + ItemText). Class rewrite `*:[span]:last:*` -> `*:[div]:last:*` because Base UI `ItemText` renders a `<div>` (Radix rendered `<span>`); without this the icon-layout styling of the item text would silently die (class-mapping "element changes" principle). `focus:bg-accent`/`focus:text-accent-foreground` kept: verified in 1.6.0 that highlighted select items receive real DOM focus (item `tabIndex: open && highlighted ? 0 : -1` + list-navigation focus).
  - `SelectScrollUpButton`/`SelectScrollDownButton` (names and data-slots kept) -> `ScrollUpArrow`/`ScrollDownArrow` with `top-0 w-full` / `bottom-0 w-full` added per wrapper-shapes — Base UI arrows render `position: absolute` inline (verified in compiled source), so without offsets/width they would float unplaced.
  - Removed the now-unused `import type * as React` (no React types remain in the file).
  - Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/select.tsx` -> no matches.

## Left alone

- Consumer `src/components/forms/add-bank-info-form.tsx`: out of scope for this pass; see Behavior changes for the two call-site issues it will hit (`FormControl` render prop from the form.tsx migration, and `SelectValue` raw-value rendering).
- `input.tsx`, `label.tsx`: separate migrations.

## Behavior changes

- **`onValueChange` widens**: Radix `(value: string) => void` -> Base UI `(value: Value | null, eventDetails) => void`. `value`/`defaultValue` are now nullable (`null` = placeholder shown). `add-bank-info-form.tsx:48` passes `field.onChange` directly — works at runtime (RHF reads the first arg) but the value type now admits `null` against a string schema. Flagged, not patched.
- **`SelectValue` rendering**: Radix rendered the selected item's `ItemText` content; Base UI renders the raw value string unless `items` is supplied on Root or a `children` function on Value. In `add-bank-info-form.tsx` the trigger will show the raw bank value instead of the bank's display label until `items` is provided. Flagged, not patched.
- `position` prop is gone from `SelectContent`; any consumer passing `position="item-aligned"` must switch to `alignItemWithTrigger` (project grep found no such call sites). Base UI auto-disables item alignment when space is insufficient or on touch input.
- Scroll arrows are now absolutely positioned overlays (Radix buttons were in-flow flex children) and do not render on touch devices; list content scrolls beneath them (no background class was added to keep the original styling).
- `Root.onOpenChange` gains `eventDetails`; `onEscapeKeyDown`/`onPointerDownOutside` interception moves to `onOpenChange` reasons. Item `textValue` -> `label`. Item `value` widens `string` -> `any`.
- Consumer CSS hooks: Trigger `data-state="open"` -> `data-popup-open`; Item `data-state="checked"` -> `data-selected` (presence); Popup/Positioner use `data-open`/`data-closed`.
- Positioner defaults vs Radix Content: `collisionPadding` 10 -> 5, `collisionBoundary` viewport -> `'clipping-ancestors'`, `sticky` semantics differ (boolean, viewport-keeping).
- Base UI Root is `modal` by default (scroll lock + outside-pointer blocking); Radix behaved similarly, but `modal={false}` is now available if needed.

## Verify by hand

1. Open the bank select in Add Bank Info: popup drops below the trigger, left-aligned, ~4px gap (popper look preserved), fades/zooms in.
2. Trigger label after choosing a bank: EXPECT the raw value regression (see Behavior changes) — decide on `items`/`children` fix in the consumer sweep.
3. Keyboard: arrows move highlight (accent bg), typeahead by bank name, Enter selects and closes, Esc closes; selected item shows the check icon on the right.
4. Long list: scroll arrows appear at top/bottom edges, full-width, and scroll the list on hover; confirm the overlay-over-items look is acceptable.
