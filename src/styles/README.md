# Foody Clear design system

`src/styles.scss` is the global entry point. Its partials have one responsibility each:

- `_material-theme.scss` configures the Angular Material theme and exposes the application tokens.
- `_tokens.scss` is the only source for raw colors, typography, spacing, radii, motion, elevation, breakpoints, and semantic state values.
- `_mixins.scss` contains reusable component-level patterns that preserve Angular style encapsulation.
- `_base.scss` contains the reset and document defaults.
- `_primitives.scss` contains global application primitives such as pages, alerts, dialogs, and status pills.
- `_tones.scss` maps persisted cycle colors to the shared data-visualisation palette.
- `_tailwind.scss` maps semantic application tokens to Tailwind utilities.

## Conventions

- Use `var(--app-*)` in SCSS; define new literal color values only in `_tokens.scss`.
- Use semantic template utilities such as `bg-app-surface`, `text-app-text-strong`, and `border-app-border`. Do not use palette names such as `slate-200` or `red-700`.
- Prefer Angular Material's public override mixins over internal MDC selectors.
- Keep component styles encapsulated. Shared patterns belong in `_mixins.scss`; shared feature composition belongs in `features/_feature-mixins.scss`.
- Use `media-up`, `media-down`, `media-below`, and `reduced-motion` so breakpoints and motion preferences stay centralized.
- Avoid `::ng-deep`, `!important`, and `:host-context`. Theme-dependent values should resolve through tokens.
- The `.dark` class on `<html>` is the single DOM theme switch. `ThemeService` owns its runtime state.

Run `npm run style:check` before committing style changes.
