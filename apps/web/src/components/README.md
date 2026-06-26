# src/components/

This folder contains reusable React UI components for the web app.

## Conventions

- Use PascalCase for file names and component exports.
- Keep small presentational components in `src/components/ui/`.
- Prefer shadcn/ui-style primitives for new shared UI before adding one-off local components.
- Use Tailwind CSS utilities for styling; keep extra CSS limited to global tokens or layout shells shared by multiple pages.
- Export shared UI primitives from `src/components/ui/index.ts`.
- Shared theme colors should come from Tailwind theme tokens where possible.
- Project-specific wrappers can live beside shadcn primitives when they preserve an existing API, such as `TextInput`, `NumberInput`, `Toggle`, and `CopyRow`.

## Recommended component APIs

- `className?: string`
- `disabled?: boolean`
- Event props like `onClick`, `onChange`
- Accessibility attributes such as `aria-pressed`, `role`, and focus styles
- Keep UI components free of business logic and side effects

## Theme palette

Prefer the project's muted sage theme when styling or adapting shadcn primitives:

- `bg-sage`, `text-white`
- `bg-sage-soft`, `text-text`
- `bg-surface`, `border-surfaceMuted`
- `text-text`, `text-textMuted`

## Example import

```tsx
import { Button, CopyRow, Metric, Toggle, TextInput } from "./components/ui";
```
