# tooltip

2026-07-14, transformation engine (legacy new-york style: rewired the project's own file, kept its classes except mechanical class-mapping rewrites); arrow/positioner shape cross-checked against the live base-nova registry tooltip. Migrated cleanly; this unblocks sidebar.tsx, which already called the Base UI-shaped API.

## Changed

- `src/components/ui/tooltip.tsx` — full rewire from `@radix-ui/react-tooltip` to `import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"`.
  - Provider: `delayDuration` -> `delay` (renamed per overlays.md), wrapper default `0` preserved (tooltip.tsx:8). `Tooltip` still wraps Root in `TooltipProvider` (original structure kept).
  - Content: radix `Portal > Content` -> `Portal > Positioner > Popup` (tooltip.tsx:46-53). Positioning props typed via `Pick<TooltipPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">`, each explicitly destructured AND forwarded to `<TooltipPrimitive.Positioner>` (the declare -> destructure -> forward rule; tooltip.tsx:34-37 declare/destructure, 48-51 forward). Defaults: `side="top"`, `align="center"`, `alignOffset=0`, and `sideOffset` changed 0 -> 4 (golden default per overlays.md/wrapper-shapes.md).
  - Positioner gets `className="isolate z-50"` and no data-slot; Popup keeps `z-50` (wrapper-shapes.md convention).
  - Popup classes: `origin-(--radix-tooltip-content-transform-origin)` -> `origin-(--transform-origin)`; fade/zoom/slide keyframes restated as `transition-[opacity,scale,translate]` with `data-starting-style:opacity-0 data-starting-style:scale-95`, matching `data-ending-style:*`, and per-side entry nudges `data-[side=bottom]:data-starting-style:-translate-y-2` / `data-[side=top]:...translate-y-2` / `data-[side=left]:...translate-x-2` / `data-[side=right]:...-translate-x-2` (exit keeps fade+zoom only, like the original). All other classes verbatim (tooltip.tsx:57).
  - Structure: `Portal` tooltip.tsx:46 > `Positioner` tooltip.tsx:47 > `Popup` tooltip.tsx:54.
  - Arrow: kept the project's visual classes (`z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-primary fill-primary`) and added per-side positioning per wrapper-shapes.md, with pixel values taken from the CURRENT base registry (wrapper-shapes.md says to verify them): `data-[side=bottom]:top-1`, `data-[side=top]:-bottom-2.5`, `data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2`, `data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2` (tooltip.tsx:63). `cn-tooltip-arrow*` companion classes skipped — plain-Tailwind project.
  - Types to `TooltipPrimitive.X.Props`; unused `import type * as React` removed.
  - Every exported symbol name and every `data-slot` attribute unchanged (`data-slot="tooltip-provider"` stays on Provider; inert there under both libraries — Provider renders no DOM).
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/tooltip.tsx` -> no matches.

## Left alone

- `src/components/ui/sidebar.tsx` — only tooltip consumer; already written against this exact target API (`TooltipProvider delay={0}` sidebar.tsx:134, `TooltipTrigger render={button}` sidebar.tsx:546, `TooltipContent side="right" align="center" hidden={...}` sidebar.tsx:547-551). It was broken against the old radix wrapper (`delay`/`render` are not radix props) and starts working with this migration. Not modified. Note: `hidden` falls through to the Popup as a plain DOM attribute.
- `package.json` — `@radix-ui/react-tooltip` left installed until the last radix component migrates.

## Behavior changes

- `TooltipProvider` consumer-facing prop renamed: `delayDuration` -> `delay` (anyone passing `delayDuration` now gets the Trigger default 600ms instead). `skipDelayDuration` -> `timeout` (default changes 300 -> 400ms). `disableHoverableContent` has no Provider equivalent (per-Root `disableHoverablePopup` instead).
- `TooltipContent` default `sideOffset` changed 0 -> 4 (spec'd golden default): tooltips sit 4px further from triggers than before.
- Dropped Content props (no longer accepted): `onEscapeKeyDown`/`onPointerDownOutside` (-> Root `onOpenChange` reason + `cancel()`), `avoidCollisions`/`collisionBoundary`/`collisionPadding`/`arrowPadding`/`sticky`/`hideWhenDetached` (-> Positioner `collisionAvoidance`/`collisionBoundary`/etc., not exposed by this wrapper), `forceMount` (-> Portal `keepMounted`). No consumer uses any of these.
- `onOpenChange` gains `eventDetails`; radix's delayed/instant-open `data-state` values become `data-open`/`data-closed` + `data-instant`.
- Enter/exit now CSS transitions (150ms default) instead of tw-animate keyframes; radix Arrow was an auto-rotated `<svg>`, Base UI Arrow is a `<div>` positioned per side (hence the new per-side classes).
- Logical sides `side="inline-start"/"inline-end"` (Base UI-only values) get no slide-nudge or arrow positioning classes — original was physical-sides-only; flag, not patched.
- Registry-drift note (mapping gap, recorded): the live base-nova registry popup still uses tw-animate keyframes keyed on `data-open`/`data-closed`, while class-mapping.md mandates starting/ending-style transitions; this migration follows class-mapping.md. Arrow pixel values in wrapper-shapes.md (`right-[-13px]`) are stale vs the live registry (`-right-1`/`-left-1`); live registry values used.

## Verify by hand

1. Collapse the sidebar (desktop) and hover a nav item: tooltip appears instantly (delay 0) to the right, arrow tip centered on the item and pointing left.
2. Hover between adjacent collapsed nav items: subsequent tooltips open instantly (provider grouping/timeout).
3. Expand the sidebar: tooltips stay hidden (`hidden` prop path).
4. Scratch-test each `side` value: 2px entry nudge comes from the correct direction; arrow hugs the correct popup edge on all four sides; gap between trigger and tooltip is 4px.
