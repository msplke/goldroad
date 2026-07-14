# dropdown-menu

2026-07-14, transformation engine (legacy new-york style; no base golden pair exists, user's own file transformed, classes kept except mechanical rewrites). Verdict: migrated to `@base-ui/react/menu`, all 15 exports and data-slots preserved.

## Changed

- `src/components/ui/dropdown-menu.tsx` (whole file):
  - Import: `* as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"` -> `{ Menu as DropdownMenuPrimitive } from "@base-ui/react/menu"`. All prop types `React.ComponentProps<typeof X>` -> `DropdownMenuPrimitive.X.Props`.
  - `DropdownMenuContent` (dropdown-menu.tsx:30): Radix `Portal > Content` -> `Portal > Positioner > Popup`. `align`/`alignOffset`/`side`/`sideOffset` declared via `Pick<...Positioner.Props, ...>`, destructured, and explicitly forwarded to `Positioner` (Pick-means-FORWARD rule); `sideOffset = 4` default kept. Positioner gets `isolate z-50 outline-none` and no data-slot (wrapper-shapes convention); Popup keeps `data-slot="dropdown-menu-content"` and the original class list with mechanical rewrites: `animate-in/out + fade/zoom/slide-*` -> `transition-[opacity,transform]` + `data-starting-style:`/`data-ending-style:` (opacity-0, scale-95, per-`data-[side=...]` starting translate), `--radix-dropdown-menu-content-available-height` -> `--available-height`, `--radix-dropdown-menu-content-transform-origin` -> `--transform-origin`.
  - `DropdownMenuLabel` -> `GroupLabel` part (name/data-slot unchanged).
  - `DropdownMenuCheckboxItem`/`DropdownMenuRadioItem`: `ItemIndicator` -> `CheckboxItemIndicator`/`RadioItemIndicator`; wrapper spans and icons unchanged.
  - `DropdownMenuSub` -> `SubmenuRoot`; `DropdownMenuSubTrigger` -> `SubmenuTrigger` with `data-[state=open]:bg-accent`/`data-[state=open]:text-accent-foreground` -> `data-popup-open:bg-accent`/`data-popup-open:text-accent-foreground` (dropdown-menu.tsx:230).
  - `DropdownMenuSubContent` (dropdown-menu.tsx:245): rebuilt as `Portal > Positioner > Popup` keeping the file's own class list (shadow-lg variant), with golden SubContent positioning defaults `align="start" alignOffset={-3} side="right" sideOffset={0}` exposed and forwarded (wrapper-shapes; Radix SubContent's implicit side/align made explicit).
  - `focus:bg-accent focus:text-accent-foreground` on items/sub-trigger kept deliberately: verified in `node_modules/@base-ui/react` 1.6.0 that highlighted menu items receive real DOM focus (`useListNavigation` + `focusItemOnHover`, item `tabIndex: open && highlighted ? 0 : -1`), so the focus-based highlight styling remains live. `data-[disabled]:`, `data-[inset]:`, `data-[variant=...]:` unchanged per class-mapping ("unchanged" rows / project-own attributes).
  - Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/dropdown-menu.tsx` -> no matches.

## Left alone

- Consumers (`src/components/dashboard/user-dropdown.tsx`, `src/components/dashboard/nav-user.tsx`, `src/components/mode-toggle.tsx`): out of scope for this wrapper-only pass. Known breaks to fix in the consumer sweep:
  - `user-dropdown.tsx:79`: `forceMount` on `DropdownMenuContent` no longer exists (type error). Base UI equivalent is `keepMounted` on the Portal, which this wrapper does not expose; decide whether to expose it or drop the prop.
  - `nav-user.tsx:60`: class `w-[--radix-dropdown-menu-trigger-width]` must become `w-(--anchor-width)` (var now set on Positioner). Its `side`/`align`/`sideOffset` props keep working (hoisted + forwarded).
- `sonner.tsx` etc.: non-radix, untouched.

## Behavior changes

- `DropdownMenuCheckboxItem` / `DropdownMenuRadioItem` no longer close the menu on click: Base UI `closeOnClick` defaults to `false` on these items (Radix closed by default). Flagged, not patched (per skill hard rule).
- Focus looping: Radix `loop` (default false) is replaced by `loopFocus` on Root, default `true` — arrow-key navigation now wraps by default.
- Root/SubmenuRoot `onOpenChange` gains a second `eventDetails` argument; `onEscapeKeyDown`/`on*Outside` content callbacks no longer exist (branch on `eventDetails.reason`).
- `CheckboxItem` `checked` no longer accepts `'indeterminate'` (boolean only). `RadioGroup`/`RadioItem` `value` widens `string` -> `any`. Items: `onSelect` -> `onClick`, `textValue` -> `label`.
- Positioner defaults differ from Radix Content: `collisionPadding` 0 -> 5, `arrowPadding` 0 -> 5, `collisionBoundary` `[]` -> `'clipping-ancestors'` (equivalent in practice).
- `GroupLabel` (DropdownMenuLabel) is meant to sit inside a `Group` for `aria-labelledby` wiring; both current consumers use it directly under Content (worked with Radix's free-floating Label). Renders fine, but the a11y association is absent — consider wrapping in `DropdownMenuGroup` during the consumer sweep.
- Trigger open-state hook changes for consumer CSS: `data-[state=open]` -> `data-popup-open` (presence) + `data-pressed`.
- Enter/exit animation is now CSS-transition-based (`data-starting-style`/`data-ending-style`) rather than tw-animate keyframes; visual intent (fade + 95% zoom + 2-unit slide-in) restated per class-mapping.md.

## Verify by hand

1. Open the user dropdown (dashboard avatar): panel fades/zooms in from the trigger side, is anchored 4px below, max-height respects the viewport.
2. Arrow keys move highlight (accent background follows), wraps at the ends; typeahead jumps to items; Enter activates and closes; Esc closes and returns focus to the trigger.
3. Sidebar nav-user menu on mobile viewport: opens on `side="bottom"`, `align="end"` still respected.
4. If any checkbox/radio items are added: confirm the flagged stay-open-on-click default is acceptable before shipping.
