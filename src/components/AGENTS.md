# src/components

## Purpose

Shared, feature-agnostic presentational UI primitives (`ui/`), styled with Tailwind only. Behaviour/accessibility comes from [Radix Primitives](https://www.radix-ui.com/primitives) (`radix-ui` package).

## Ownership

- `ui/button.tsx`, `ui/label.tsx`, `ui/text-input.tsx`, `ui/field-errors.tsx`, `ui/data-table.tsx` and their tests.
- Feature-specific UI stays in `src/features/<name>/`.

## Local Contracts

- One component per file, named export, kebab-case filename, colocated `<file>.test.tsx`.
- Props-driven only: no data fetching, no server actions, no `@/server/**` imports, no feature flags.
- Extend native elements via `ComponentProps<"el">` and spread the rest props; merge `className`.
- **Radix first:** any interactive/accessible primitive (dialog, dropdown, popover, tooltip, tabs, checkbox, switch, select, label, …) wraps the matching Radix primitive — never hand-roll focus traps, keyboard nav or ARIA wiring.
  - Import from the unified package only: `import { Dialog } from "radix-ui"` (no individual `@radix-ui/react-*` deps).
  - Wrap in a `ui/<name>.tsx` file that applies Tailwind classes; features import the wrapper, never `radix-ui` directly.
  - Compound primitives: one wrapper per file (`ui/dialog.tsx`, `ui/dialog-content.tsx`, …) to respect the one-component-per-file rule.
  - Polymorphism via `asChild` + `Slot.Root` (see `Button`), not `as` props.
  - Radix parts that use client-only hooks ship their own `"use client"`; wrappers stay directive-free unless they add hooks themselves.
- No `"use client"` unless the component itself uses hooks or browser APIs (consumers add the boundary).
- Promote a component here only once two or more features need it (or it is clearly generic).
- Same size limits as the rest of the repo (file ≤ 150 lines, function ≤ 40); split into more primitives instead.

## Work Guidance

- Prefer composing existing primitives over adding variants; add a variant only when reused.

## Verification

- `pnpm test`, `pnpm lint`.

## Child Index

None.
