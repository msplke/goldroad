# form

2026-07-14, transformation engine (shadcn react-hook-form composition; no golden pair — base registry serves an empty stub for form; Slot -> useRender per the universal-patterns.md worked example). Verdict: radix-free; FormControl moves from Slot-children to a `render` prop — the one real consumer-facing break.

## Changed

- `src/components/ui/form.tsx`:
  - Removed `import type * as LabelPrimitive from "@radix-ui/react-label"` and `import { Slot } from "@radix-ui/react-slot"`; added `mergeProps` from `@base-ui/react/merge-props` and `useRender` from `@base-ui/react/use-render`.
  - `FormLabel` (form.tsx:91): still renders the project's own `~/components/ui/label` (unchanged usage); its props are now typed `React.ComponentProps<typeof Label>` instead of the Radix `LabelPrimitive.Root` type. label.tsx was concurrently migrated to a native `<label>` in its own pass, so this resolves to `React.ComponentProps<"label">` — same surface (`htmlFor`, `className`, ...).
  - `FormControl` (form.tsx:107): `Slot` -> `useRender` + `mergeProps<"input">`, `defaultTagName: "input"`, prop type `useRender.ComponentProps<"input">`. The injected `data-slot="form-control"`, `id`, `aria-describedby`, `aria-invalid` wiring is unchanged and merges onto the rendered control exactly as Slot did (handlers chained, className joined). The object literal containing `data-slot` is cast `as React.ComponentProps<"input">` per the universal-patterns.md mergeProps excess-property pitfall.
  - Everything react-hook-form (`Form`, `FormField`, `useFormField`, contexts, `FormItem`, `FormDescription`, `FormMessage`) untouched. All exported names and data-slots preserved.
  - Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/form.tsx` -> no matches.

## Left alone

- `src/components/ui/label.tsx`: migrated in its own component pass (already radix-free at time of writing); not touched here.
- Consumers (out of scope for this wrapper-only pass): ~20 `<FormControl>` call sites across `src/components/forms/{add-bank-info,add-benefit,add-kit-api-key,add-payment-plan,add-publication,edit-benefit,edit-plan-pricing,edit-publication}-form.tsx` and `src/components/dashboard/settings/{kit-settings,personal-details}-form.tsx`.

## Behavior changes

- **FormControl API break (consumer-facing, must be fixed in the consumer sweep)**: `<FormControl><Input {...field} /></FormControl>` -> `<FormControl render={<Input {...field} />} />`. There is no Slot in Base UI; `useRender` takes the target element via `render`. Until consumers are updated, the old children form renders children into an `<input>` (React runtime error — a loud failure was chosen via `defaultTagName: "input"` over a silent `<div>` fallback that would break the label/aria wiring undetectably).
- No other runtime deltas: once consumers pass `render`, the merged output (ids, aria attributes, event handlers, className) matches the Slot behavior.

## Verify by hand

1. After the consumer sweep, open any form (e.g. Personal Details): click a `FormLabel` — focus lands in its input (id/htmlFor wiring intact).
2. Submit with an invalid field: input gets `aria-invalid="true"`, `FormMessage` appears, and `aria-describedby` on the input includes the message id (inspect in devtools).
3. Type in a field: RHF state updates normally (Controller flow untouched).
4. Check one Select-based field (Add Bank Info): `FormControl render={<SelectTrigger>...</SelectTrigger>} />` still receives the aria props on the trigger button.
