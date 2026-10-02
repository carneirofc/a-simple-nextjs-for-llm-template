---
name: new-ui-primitive
description: Add a shared UI component to src/components/ui (dialog, select, tabs, tooltip, checkbox, card, badge, ...), wrapping Radix when it is interactive. Use when a feature needs a reusable presentational or accessible component.
---

# New UI primitive

Read `src/components/AGENTS.md` and two existing wrappers (`button.tsx`, `label.tsx`) first.

## Decide
- Does an existing primitive already cover it (maybe via `className` or `asChild`)? Prefer that.
- Interactive / needs ARIA, focus or keyboard handling? → wrap the Radix part: `import { X } from "radix-ui"`. Never hand-roll focus traps or ARIA.
- Purely visual? → plain element with `ComponentProps<"el">`.

## Write
- `src/components/ui/<name>.tsx`: one exported component, named export, props spread onto the root, `className` merged last with `cn()` from `@/lib/cn`.
- Compound Radix parts: one file per styled part (`dialog.tsx`, `dialog-content.tsx`, …).
- Styling: Tailwind with semantic tokens from `src/app/globals.css` (`bg-background`, `text-muted-foreground`, `border-border`, `ring-ring`, `bg-primary`, `text-destructive`). Missing a token? Add it there for light **and** dark. Always add `focus-visible:` ring styles to focusable elements.
- Variants: a `const VARIANT_CLASSES = {...} as const` map keyed by a `variant` prop (see `Button`). Add a variant only when two call sites need it.
- No hard-coded copy: user-visible text (including `aria-label`s) comes in via props.
- No `"use client"` unless this file itself calls hooks.

## Test
`src/components/ui/<name>.test.tsx`: query by role/label (not class or test id), cover keyboard interaction for interactive parts, and that a custom `className` overrides a base class.

## Finish
Add it to the Ownership list in `src/components/AGENTS.md`, add a `CHANGELOG.md` entry, run `pnpm check`.
