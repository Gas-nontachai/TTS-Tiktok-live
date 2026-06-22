# src/components/

This folder contains reusable React UI components for the web app.

## Conventions

- Use PascalCase for file names and component exports.
- Keep small presentational components in `src/components/ui/`.
- Use Tailwind CSS utilities only, no additional `.css` files for styling.
- Export shared UI primitives from `src/components/ui/index.ts`.
- Shared theme colors should come from Tailwind theme tokens where possible.

## Recommended component APIs

- `className?: string`
- `disabled?: boolean`
- Event props like `onClick`, `onChange`
- Accessibility attributes such as `aria-pressed`, `role`, and focus styles
- Keep UI components free of business logic and side effects

## Theme palette

Prefer the project's muted sage theme:

- `bg-sage`, `text-white`
- `bg-sage-soft`, `text-text`
- `bg-surface`, `border-surfaceMuted`
- `text-text`, `text-textMuted`

## Example import

```tsx
import { Button, CopyRow, Metric, Toggle, TextInput } from "./components/ui";
```
