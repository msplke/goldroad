# label

2026-07-14, transformation engine (legacy new-york style: user's own file transformed in place; Radix Label has NO Base UI equivalent -> native `<label>` per SKILL.md hard rule), migrated cleanly.

## Changed

- `src/components/ui/label.tsx` — replaced `@radix-ui/react-label`'s `LabelPrimitive.Root` with a native `<label>` element.
  - Props type: `React.ComponentProps<typeof LabelPrimitive.Root>` -> `React.ComponentProps<"label">` (src/components/ui/label.tsx:7).
  - `data-slot="label"` kept exactly. Exported name `Label` kept exactly. `"use client"` directive kept (harmless, keeps the module boundary identical for consumers).
  - Class string kept byte-for-byte, including `select-none` (this is the documented one-line replacement for Radix Label's only behavioral extra — preventing text selection on double click) and `group-data-[disabled=true]:*` (left as-is: the `=true` marker is set explicitly by form/field wrappers, and the shadcn base registry golden label keeps this exact selector too; class-mapping.md has no rewrite for it).
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/label.tsx` -> no matches.

## Left alone

- `src/components/ui/form.tsx` (still on Radix, out of scope this run) imports this Label at form.tsx:16 and types `FormLabel` props as `React.ComponentProps<typeof LabelPrimitive.Root>` from `@radix-ui/react-label` (form.tsx:3,93). This still compiles against the native-label version (Radix Label props are a superset of `<label>` attrs), but the stale radix type import should be cleaned up when form.tsx is migrated.

## Behavior changes

- Radix Label prevented text selection on double click via a JS `onMouseDown` handler; the native version relies purely on the existing `select-none` class. Same visible outcome; the JS-level guard is gone.
- `asChild` is no longer accepted (native element). No consumer passes it (grepped); if one did, it would previously slot, now it would leak `asChild` onto the DOM.

## Verify by hand

- In a form (e.g. kit settings / add-benefit), click a label: focus moves to the associated input (htmlFor / RHF wiring via FormLabel).
- Double-click a label: no text selection occurs.
- Disable a form field: `peer-disabled:` opacity/cursor styles on the label still apply.
