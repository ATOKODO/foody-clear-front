# UI coverage audit

This audit checks **elements inside templates**, not only existing Angular component classes. Its purpose is to prepare design-system analysis without confusing a screen story with complete primitive/variant coverage.

## Current evidence

Run these commands against the current checkout:

```sh
npm run ui:audit
npm run ui:audit -- --json
npm run storybook:check
```

The audit reads production `@Component` metadata and parses both inline and file-based Angular templates. It traverses conditional branches, Angular 22 switch case groups, loops and their empty branches, deferred content, placeholders, loading and error content. Storybook-only preview components are excluded from production counts. The JSON report identifies each candidate's owner, source location, attributes, bound inputs, immediate text, table context and whether it is projected inside a shared empty state.

Snapshot after feedback, native-table and empty-state extraction: **49 production components, 3,065 template element occurrences, 255 stories**. These are source occurrences, not the number of rendered DOM elements or distinct design-system patterns. Loops and repeated branches count once per source occurrence. A future edit may change these counts; command output is authoritative.

## Shared primitives now isolated

| Element family | Production implementation | Dedicated catalog coverage |
| --- | --- | --- |
| Buttons (242 occurrences) | `UiButton` on the native button | 15 stories: variants, sizes, disabled/loading, icons and long labels |
| Status badges (52) | `UiStatusBadge` on the native span | Five tones and long text |
| Notices (12) | `UiAlert` on the original native host | Four tones, action, details and long message |
| Preformatted output (3) | `UiCodePanel` on native `pre` | JSON, wrapping and long-line scrolling |
| Native tables (10) and cells (98) | `UiTable` and `UiTableCell` on native `table`, `th` and `td` | Standard/compact/comfortable density, fixed layout, empty, editable/disabled actions, logical alignment, row headers and long content |
| Native table viewports (10) | `UiTableScroll` on the existing `div` | Outlined/unoutlined, long accessible name and keyboard horizontal scrolling |
| Empty-state roots (70) | `UiEmptyState` on native `p`/`div` | Text/panel/large, small, contextual tone, long copy and action |
| API errors | `UiErrorPanel`, composed from alert/code primitives | API, explicit message and long details |
| Segmented controls, PWA controls, modal behavior | Existing shared components/directive | Their dedicated UI groups |

Host styling for the new feedback primitives lives with the components. Projected alert-copy/details classes remain shared composition styles because the owner supplies that markup. Native hosts preserve caller classes, ARIA and existing layout selectors. Technical data is not copied into stories: previews use demo content.

Native tables preserve `caption`, header `scope`, spanning cells and projected form controls. Their owners still manage row data, validation, selection and submission; the primitives own presentation and the labeled scrolling region. Material tables remain separate library components. Empty-state owners retain translated titles/body content, optional actions, explicit announcement roles and placement constraints. Eight class-named title/body occurrences are now classified as projected empty-state content rather than independent uncovered roots. The shared-root count also includes copy-only states without an old `empty` class; the original 50 class-like occurrences were never 50 distinct patterns.

## Existing library components now isolated

Angular Material already supplies the actual components/directives used by the app. They should not be reimplemented solely to meet a component-count target.

| Family | Production usage | `UI/Material` coverage |
| --- | --- | --- |
| Form fields / inputs | 137 fields, 79 inputs and two textareas | Filled/outlined, disabled, real invalid control, numeric suffix, textarea, native date/time/datetime and long label |
| Select | 56 selects | Single/multiple, disabled, real invalid control, empty options and outlined |
| Checkbox | 10 | Unchecked, checked, indeterminate, disabled and long label |
| Date picker | Day input | Selected, invalid, disabled and outlined |
| Card | 67 | Outlined/raised, action disabled and long title |
| Tabs | Product entry | Interactive and disabled tab |
| Progress bar | Seven | Indeterminate, determinate, buffer and query |
| Toggle group | Six | Single/multiple and disabled |
| Material data table | Seven tables | Populated, empty and disabled selection |

`MaterialPreview` is an isolated **Storybook-only composition** of those real controls, not a new production control implementation. Validation previews use touched reactive controls with validators. Screen/form/list stories continue to cover business integration and translated content.

## Remaining work — not certified complete

The following patterns still live in their business owners. Their owning component/screen has stories, but that does **not** prove dedicated primitive coverage or all business states. Inspect actual markup, styles and interactions before deciding whether to extract a shared component or retain an intentional business composition.

| Candidate family | Source owners | Next verification/extraction |
| --- | --- | --- |
| 63 badge-like occurrences | Calendar, cycle list, template list, home, meal prep, planning, statistics | Separate semantic status from calendar/nutrition/domain badges; consolidate geometry and tones where shared |
| Six notice-like occurrences | Calendar, cycle list | Some overlap the badge inventory or are warning-colored actions/copy, rather than standalone alerts; review semantics and dedicated states before choosing a primitive |
| 16 inline SVG roots | App shell, calendar, planning | Inventory actual glyphs and names, decorative vs named controls; centralize reusable icons and add isolated stories |
| Five native disclosures | Error panel, product JSON, template list, day input | Keep native keyboard semantics; review shared disclosure presentation and expanded/collapsed states |
| 88 surface-like occurrences | Calendar/cycle panels, master/detail business cards, home, inventory, meal prep, planning, shopping, statistics and modal shells | Includes child copy/title/action containers; distinguish reusable surface/card anatomy from business layout before extracting |
| Navigation and specialized actions | App shell, calendar, planning | Theme/language toggles, navigation links, calendar quick actions and selection cards currently retain owner-specific geometry, including `UiButton`'s plain variant |
| Additional dynamic visuals | Cycle color swatches, statistics charts, nutrition comparison and calendar block states | CSS-class heuristics are not exhaustive; inspect bound classes/styles, conditional markup and state-specific stories |

Plain typography, semantic sectioning/list markup and layout containers do not all need Angular wrappers. The goal is reusable UI behavior/presentation and meaningful stories, not one component per HTML node.

## What the gates prove

- Every existing production Angular component has real CSF metadata pointing to it.
- Native buttons use the shared component and cannot also instantiate a Material button component, including FAB/icon and camelCase variants.
- Native text inputs/textareas use the cataloged Material directive.
- Shared feedback classes and preformatted output cannot bypass the new primitives.
- Native tables and their cells cannot bypass shared presentation; Material table ancestry is explicitly excluded, including through conditional branches.
- Class-named empty-state roots use the shared component; their projected title/body markup is not incorrectly treated as a second root. This heuristic does not identify every possible dynamic or unclassified empty message.
- Template traversal itself is tested against branch constructs, malformed templates and inline component templates.

The gates do **not** currently prove that every business-owned pattern listed above has been extracted, has a dedicated story, or has complete visual/accessibility coverage. The element-level goal therefore remains open. Keep this distinction when using the workbench to start design-system analysis.

## Verification of the current extraction

On 4 October 2026, application and Storybook builds, lint, style checks, translation inventory, browser-test type checking and the documentation build passed. Angular unit tests passed **554** cases. The built Storybook passed **526** browser tests, including all 255 stories in desktop light/English and mobile dark/French, plus interaction checks. A targeted application run passed **48** cases covering stock editing, day-entry composers, template lines, scanner/JSON, validation, statistics empty states, calendar navigation and localization. Mobile screenshots of native tables, action-bearing empty states, empty calendar and shopping list were inspected separately.

These are regression checks for the implemented extraction, not exhaustive visual, accessibility or business-variant certification of the remaining families.
