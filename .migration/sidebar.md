# sidebar

2026-07-14, transformation engine (hand transform per universal-patterns.md; large composite wrapper whose only direct Radix dependency was `@radix-ui/react-slot`). Migrated clean in one file; five exported components change their polymorphic prop from `asChild` to `render`.

## Changed

- `src/components/ui/sidebar.tsx` — the only file touched.
  - Imports: `import { Slot } from "@radix-ui/react-slot"` replaced by `mergeProps` from `@base-ui/react/merge-props` and `useRender` from `@base-ui/react/use-render` (sidebar.tsx:4-5).
  - Consumer-side rename inside this file: `<TooltipProvider delayDuration={0}>` -> `<TooltipProvider delay={0}>` (sidebar.tsx:134, per consumer-props.md TooltipProvider row; `skipDelayDuration` was not used).
  - Manual Slot idiom (`const Comp = asChild ? Slot : "tag"`) rewritten to `useRender` + `mergeProps` per the worked example, including the `as React.ComponentProps<"tag">` cast on the object literal carrying `data-*` keys: SidebarGroupLabel (`"div"`, sidebar.tsx:399), SidebarGroupAction (`"button"`, sidebar.tsx:422), SidebarMenuButton (`"button"`, sidebar.tsx:505), SidebarMenuAction (`"button"`, sidebar.tsx:557), SidebarMenuSubButton (`"a"`, sidebar.tsx:679). All `data-slot`/`data-sidebar`/`data-size`/`data-active` attributes and class strings preserved verbatim (28 `data-slot` and 24 `data-sidebar` occurrences, unchanged counts).
  - Internal call site: `<TooltipTrigger asChild>{button}</TooltipTrigger>` -> `<TooltipTrigger render={button} />` (sidebar.tsx:546); `button` is now the `useRender` result (a `React.ReactElement`).
  - Class mapping (Radix-provided trigger state only): `data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground` in `sidebarMenuButtonVariants` -> `data-popup-open:hover:*` (sidebar.tsx:484) and `data-[state=open]:opacity-100` in SidebarMenuAction's `showOnHover` branch -> `data-popup-open:opacity-100` (sidebar.tsx:581). These selectors matched the `data-state="open"` that a Radix DropdownMenuTrigger injected via `asChild`; Base UI triggers expose `data-popup-open` instead (menus.md:175 "Trigger `[data-state=\"open\"|\"closed\"]` -> `data-popup-open`", confirmed in `node_modules/@base-ui/react/docs/react/components/menu.md`).
  - NOT renamed — attributes this file sets manually, plus every selector targeting them: `data-state={state}`, `data-collapsible`, `data-variant`, `data-side` on the desktop root (sidebar.tsx:214-217); `group-data-[collapsible=...]`, `group-data-[variant=...]`, `group-data-[side=...]`, `peer-data-[variant=inset]`, `peer-data-[state=collapsed]`, `[[data-side=...][data-state=collapsed]_&]`, `[[data-side=...][data-collapsible=offcanvas]_&]`, `has-data-[variant=inset]`, `in-data-[side=...]`; and the manual `data-[active=true]`, `peer-data-[size=...]`, `group-has-data-[sidebar=menu-action]` hooks.
  - Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/sidebar.tsx` -> no matches; no `asChild` or `Slot` residue.
  - Verification limited by task scope: no tsc/build run in this pass (wrappers are being migrated in parallel; the orchestrator runs the batch typecheck). All useRender/mergeProps signatures checked against `node_modules/@base-ui/react/use-render/useRender.d.ts` and `merge-props/mergeProps.d.ts`.

## Left alone

- `sheet.tsx`, `tooltip.tsx`, `separator.tsx`, `button.tsx`, `input.tsx`, `skeleton.tsx`: migrated in parallel by other agents; sidebar keeps importing their unchanged public names (Sheet/SheetContent/SheetHeader/SheetTitle/SheetDescription, Tooltip/TooltipContent/TooltipProvider/TooltipTrigger, Separator, Button, Input, Skeleton).
- `TooltipContent side="right" align="center"` call-site props kept — positioning props remain on the wrapper's public API.
- `SheetContent side={side}` and its `[&>button]:hidden` class kept — sheet wrapper's public API.
- `package.json`: `@radix-ui/react-slot` stays installed until the last Slot consumer is migrated; removal is the project-level step.
- `~/hooks/use-mobile`, `~/lib/utils`: no Radix involvement.

## Behavior changes

- Exported API break (compile-time, flagged for the consumer sweep): SidebarMenuButton, SidebarMenuSubButton, SidebarMenuAction, SidebarGroupLabel, SidebarGroupAction no longer accept `asChild`; consumers must switch to `render={<a .../>}` (Base UI render-prop convention).
- Transitional mixed-state gap: the new `data-popup-open:*` styling on SidebarMenuButton/SidebarMenuAction only activates once the project's menu wrappers are on Base UI. While a consumer still composes these buttons into a Radix DropdownMenuTrigger, the trigger sets `data-state="open"`, which no longer matches — the open-state hover/visibility styling is inert until the menus land. Not patched.
- `hidden` on TooltipContent now lands on Base UI's Popup inside a Positioner; the (empty) positioner node stays mounted while the popup is hidden, whereas Radix hid the positioned content element itself. Visually equivalent; flagged, not patched.

## Verify by hand

- Desktop: press Ctrl/Cmd+B — sidebar collapses/expands; gap and container widths animate; SidebarRail hover shows the border line and the resize cursor flips with side/state.
- Collapsed icon mode: hover a SidebarMenuButton that has `tooltip` — tooltip appears immediately (delay 0) to the RIGHT; expand the sidebar — the tooltip must NOT appear (hidden prop path).
- Narrow the viewport below md: sidebar renders as a sheet from the configured side; the sheet's built-in close button stays hidden (`[&>button]:hidden` relies on the migrated sheet keeping its close button a direct child of the popup — glance at the DOM once sheet lands).
- Compose one SidebarMenuButton with `render={<a href="#" />}` — the anchor receives `data-slot`/`data-sidebar`/`data-size`/`data-active` and the className; click still navigates.
- After the menu wrappers are migrated: open a dropdown from a SidebarMenuAction with `showOnHover` — the action must stay visible while the menu is open (`data-popup-open:opacity-100`), and the SidebarMenuButton keeps its accent hover while its menu is open.
