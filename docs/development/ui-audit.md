# UI coverage audit

This audit checks **elements inside templates**, not only existing Angular component classes. Its purpose is to prepare design-system analysis without confusing a screen story with complete primitive/variant coverage.

## Current evidence

Run these commands against the current checkout:

```sh
npm run ui:audit
npm run ui:audit -- --json
npm run storybook:check
```

The audit reads production `@Component` metadata and parses both inline and file-based Angular templates. It traverses conditional branches, Angular 22 switch case groups, loops and their empty branches, deferred content, placeholders, loading and error content. Storybook-only preview components are excluded from production counts. The JSON report identifies each candidate's owner, source location, attributes, bound inputs, binding kinds/expressions, immediate text, table context and whether it is projected inside a shared empty state. Class/style bindings and palette attributes on raw owner markup are reported separately; they are not confused with ordinary property inputs on existing shared/Material components.

Snapshot after feedback, native-table, empty-state, icon, disclosure, business-status, summary-pill, calendar-tag, cycle-breakdown, overview-metric and date-summary extraction: **57 production components, 3,020 template element occurrences, 366 stories**. These are source occurrences, not the number of rendered DOM elements or distinct design-system patterns. Loops and repeated branches count once per source occurrence. A future edit may change these counts; command output is authoritative.

## Shared primitives now isolated

| Element family | Production implementation | Dedicated catalog coverage |
| --- | --- | --- |
| Buttons (242 occurrences) | `UiButton` on the native button | 15 stories: variants, sizes, disabled/loading, icons and long labels |
| Status badges (69) | `UiStatusBadge` on native span/em | Six tones, seven existing geometries, five weights, outlined/soft/bare appearances, stock/planned/converted/card/count/pricing/origin copy and long text |
| Summary and availability pills (10) | `UiSummaryPill` on the native span | Count, zero, availability, long and rich labels; exact legacy summary geometry and inherited semantics |
| Calendar labels (24) | `UiCalendarTag` on the native span | 22 stories: year status/counts, three Today formats, regular/compact chips, metadata, surface/on-color alerts, assignment/source and long copy |
| Cycle breakdown labels (22) | `UiBreakdownBadge` on the native span | Ten stories: metadata, four nutrition states, overview warnings, expanded metadata/overview and long copy |
| Calendar overview metrics (11) | `UiOverviewMetric` on the native div | Six stories: count, zero, large/owner-formatted values, long label and grouped metrics; year/month/week consuming views |
| Planning date summary (one) | `UiDateBadge` on the native div | Six stories: date, optional time, owner-localized value, absent/empty detail, long caption/value; an opened day-action dialog story |
| Notices (12) | `UiAlert` on the original native host | Four tones, action, details and long message |
| Preformatted output (3) | `UiCodePanel` on native `pre` | JSON, wrapping and long-line scrolling |
| Native tables (10) and cells (98) | `UiTable` and `UiTableCell` on native `table`, `th` and `td` | Standard/compact/comfortable density, fixed layout, empty, editable/disabled actions, logical alignment, row headers and long content |
| Native table viewports (10) | `UiTableScroll` on the existing `div` | Outlined/unoutlined, long accessible name and keyboard horizontal scrolling |
| Empty-state roots (70) | `UiEmptyState` on native `p`/`div` | Text/panel/large, small, contextual tone, long copy and action |
| Local icon uses (16) | `UiIcon` with a typed local SVG registry | Every one of the 13 registered glyphs, decorative/named, small/large and named-button composition |
| Disclosures and summaries (five each) | `UiDisclosure` / `UiDisclosureSummary` on native `details` / `summary` | Collapsed/expanded, inline/panel, diagnostic code, action, long/rich labels, compact and strong summary |
| API errors | `UiErrorPanel`, composed from alert/code primitives | API, explicit message and long details |
| Segmented controls, PWA controls, modal behavior | Existing shared components/directive | Their dedicated UI groups |

Host styling for the new feedback primitives lives with the components. Projected alert-copy/details classes remain shared composition styles because the owner supplies that markup. Native hosts preserve caller classes, ARIA and existing layout selectors. Technical data is not copied into stories: previews use demo content.

Native tables preserve `caption`, header `scope`, spanning cells and projected form controls. Their owners still manage row data, validation, selection and submission; the primitives own presentation and the labeled scrolling region. Material tables remain separate library components. Empty-state owners retain translated titles/body content, optional actions, explicit announcement roles and placement constraints. Eight class-named title/body occurrences are now classified as projected empty-state content rather than independent uncovered roots. The shared-root count also includes copy-only states without an old `empty` class; the original 50 class-like occurrences were never 50 distinct patterns.

The former 16 inline glyph roots now use one `UiIcon` implementation. Its registry preserves the application's existing paths and stroke/fill choices, including the three Material-style calendar action glyphs; no font or HTTP icon lookup is added. Icons in named buttons are decorative. A translated `label` explicitly exposes a standalone image when meaningful. The existing Foundation and button stories use the same real icon component. Unicode navigation abbreviations/text and application images are separate patterns, not claimed as covered by the SVG registry.

Disclosures preserve native `open`, `toggle`, marker, focus and keyboard activation. The summary remains the first native child; content, actions, translated copy and initial/programmatic opening belong to the owner. Presentation inputs do not duplicate the browser's open state. Diagnostic-code spacing remains a projected-content composition rule. Icon/disclosure story coverage is independent of the corresponding screen stories.

Four formerly local day-entry statuses now use `UiStatusBadge`: nutrition targets, pending/converted template entries, available/insufficient stock and effective entries originating from a template. Their semantic colors, one-pixel borders, padding and text weight are shared inputs rather than duplicated `.input-day-status` styles. Domain decisions and translated copy remain in the feature. The `danger` tone does not implicitly make a static badge an alert or focus target. Existing medium/bold badges retain their previous defaults; the small and compact variants use the existing spacing/type tokens.

Twelve further stock, card-status, count and pricing occurrences in template list/form, inventory, meal prep, shopping lists and statistics now use that same implementation. `soft` preserves their borderless surfaces; `bare` preserves inherited foreground and no colored background for unknown stock and excluded pricing. Card/counter/chip sizes and semibold emphasis retain the measured legacy padding/type rather than redesigning them during this audit. Owner styles keep only placement constraints such as `width: fit-content`; colors, radius, padding and weights no longer have duplicate local definitions. Dedicated badge stories cover these axes and their meaningful labels independently of screen stories. The gate reads the exported badge unions and requires explicit CSF argument coverage for every variant.

Twenty-four calendar labels and twenty-two cycle breakdown labels now have separate real components. `UiCalendarTag` preserves the year/count anatomy, month/week/mobile Today sizes, compact desktop chips and alert palettes on neutral or assignment-colored backgrounds. The previously missed Active/Free label is included. `UiBreakdownBadge` preserves metadata, overview and nutrition-status geometries, including the 14px/medium metadata in single-selection mode and its larger overview padding. Counts, translated text, status calculations, assignment colors and selection remain with their owners. Legacy root classes and alert/status hooks remain available for integration selectors, but their presentation rules live in the new components. Both APIs require explicit exported story arguments for every declared variant. A dedicated calendar Year story complements the isolated year-label stories.

The eleven calendar metric containers now use `UiOverviewMetric`, a separate value/label surface rather than an inline badge. Its presentation lives with the component; the existing two-column mobile sizing and flex placement remain with the calendar owner. `UiDateBadge` preserves the planning dialog's caption/date/optional-time anatomy without parsing dates or choosing a timezone. Owners still calculate numbers, translate labels and format display values. Legacy rich-part selectors are retained for integration checks. The home external-entry marker now uses the tiny `marker` badge size and `heavy` (850) emphasis on its original native `em`, retaining the existing non-italic display. A seeded external-entry home story and an interactive day-action planning story show these parts in their real business owners. No candidate matching the current badge-class heuristic remains raw; that is not proof that the heuristic discovers all UI presentation.

Visual/source inspection also found eight anonymous summary spans styled by their ancestor containers. They were absent from the original class-name-only badge heuristic. They and two meal-prep availability labels now use `UiSummaryPill`, preserving the common 0.4rem/0.7rem padding, 0.8rem type, semibold weight and strong foreground. Their duplicate descendant rules and unused summary mixin were removed. The parser/gate follows known summary ancestors through branches and nested elements and rejects raw counter roots; projected rich-value copy is explicitly excluded. This does not statically interpret every possible SCSS descendant selector. The separately styled meal-prep completion feedback was also discovered and remains a notice candidate, not silently counted as covered.

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
| Five notice-like occurrences | Calendar, cycle list, meal prep | These include warning-colored actions/copy rather than only standalone alerts. The meal-prep completion-feedback paragraph has its own local pill-shaped success style; review semantics and dedicated states before choosing a primitive. The two calendar alert-label roots now have separate component stories |
| 88 surface-like occurrences | Calendar/cycle panels, master/detail business cards, home, inventory, meal prep, planning, shopping, statistics and modal shells | Includes 29 existing Material hosts, four shared native action buttons, one shared status badge and 54 other native nodes including child copy/title/action containers. These are not 88 missing surface components; distinguish reusable surface/card anatomy and specialized variants from business layout before extracting |
| Navigation and specialized actions | App shell, calendar, planning | Theme/language toggles, navigation links, calendar quick actions and selection cards currently retain owner-specific geometry, including `UiButton`'s plain variant |
| Additional dynamic visuals (51 bound occurrences) | Raw calendar/cycle layouts and block states, stock comparison copy, selectable/checked business cards, chart fills and embedded-dialog placement | Use `bound-visual-composition` and the typed binding metadata to distinguish presentation/state from intentional layout changes; then review semantic content and state-specific stories. Existing shared/Material hosts are excluded from this count, so owner-colored controls such as cycle swatches still need separate manual review. Static SCSS and indirect CSS selectors also require inspection |
| Focus when dialog content changes | Planning day actions → day-entry editor inside the same `UiModal` host | An isolated browser reproduction confirmed that removing the focused action leaves focus on `body`, outside the dialog, and Escape no longer closes the editor. `UiModal` initializes focus on creation and listens for Escape on its host; that does not certify focus continuity after in-place content changes. Add an isolated changing-content modal story and regression coverage before claiming this path is keyboard-complete. The current integration check closes the editor through its explicit Close button |

Plain typography, semantic sectioning/list markup and layout containers do not all need Angular wrappers. The goal is reusable UI behavior/presentation and meaningful stories, not one component per HTML node.

The next surface pass has two concrete reuse candidates in `_feature-mixins.scss`: inventory, meal-prep and shopping-list cards share `selectable-card`, `selectable-card-control` and `selectable-card-active`; their detail/editor containers also reuse `workspace-card` with different owner spacing. The five selectable source roots keep a native selection button and separate edit/remove controls, so a shared surface must not turn the whole container into a second clickable button or nest buttons. Preserve selection handlers and accessible names in the owners; isolate inactive/active, hover, keyboard focus, disabled selection, long content and independent secondary actions in stories. Workspace presentation needs its own density/placement review instead of assuming that all detail panels have identical geometry.

## What the gates prove

- Every existing production Angular component has real CSF metadata pointing to it.
- Native buttons use the shared component and cannot also instantiate a Material button component, including FAB/icon and camelCase variants.
- Native text inputs/textareas use the cataloged Material directive.
- Shared feedback classes and preformatted output cannot bypass the new primitives.
- Migrated business status/count classes cannot restore locally styled badge implementations. Each badge tone, size, emphasis and appearance declared in the production API has explicit exported story arguments.
- Known calendar and cycle label classes cannot bypass their dedicated components. Calendar variant/tone/context and breakdown kind/status unions have explicit exported story arguments; retained integration classes are excluded from raw-composition counts. Internal year-count parts and metric containers are not incorrectly treated as label roots.
- Calendar overview metrics, planning date-summary roots and home origin-marker classes cannot bypass their respective shared components. Remaining responsive placement belongs to the owner, not an unregistered duplicate of the surface presentation. Native emphasis markup remains available for the origin badge.
- Summary counters cannot bypass their shared component, even when the styled span has no class or is nested below its known container. Projected rich-value copy is not incorrectly treated as another root.
- Native tables and their cells cannot bypass shared presentation; Material table ancestry is explicitly excluded, including through conditional branches.
- Class-named empty-state roots use the shared component; their projected title/body markup is not incorrectly treated as a second root. This heuristic does not identify every possible dynamic or unclassified empty message.
- Glyph SVG implementation is restricted to the shared icon file, and every registered local glyph needs explicit icon-story arguments. Native disclosures and summaries cannot bypass their shared components.
- Template traversal itself is tested against branch constructs, malformed templates and inline component templates.

The gates do **not** currently prove that every business-owned pattern listed above has been extracted, has a dedicated story, or has complete visual/accessibility coverage. The element-level goal therefore remains open. Keep this distinction when using the workbench to start design-system analysis.

## Verification history

On 4 October 2026, application and Storybook builds, lint, style checks, translation inventory, browser-test type checking and the documentation build passed. Angular unit tests passed **554** cases. The built Storybook passed **526** browser tests, including all 255 stories in desktop light/English and mobile dark/French, plus interaction checks. A targeted application run passed **48** cases covering stock editing, day-entry composers, template lines, scanner/JSON, validation, statistics empty states, calendar navigation and localization. Mobile screenshots of native tables, action-bearing empty states, empty calendar and shopping list were inspected separately.

On 8 October 2026, the icon/disclosure extraction passed **573** Angular unit tests and the complete **582** Storybook browser tests against the rebuilt catalog of 282 stories. A targeted application run passed **29** cases for JSON entry, calendar/planning actions, template stock/details, template conversion and localization. Application/Storybook builds, component and glyph coverage gates, nine element-inventory regression checks, lint, style checks, translations, browser-test typing and documentation build passed. Mobile calendar glyphs, shell controls and an expanded action-bearing disclosure were visually inspected. All 16 production SVG path sets were compared with the previous commit and preserved exactly; the old Foundation-only duplicates now use those actual production glyphs. Native Enter/Space disclosure toggling, hidden content, projected-control focus and decorative/named icon semantics were verified in the browser.

The subsequent compact day-entry badge migration passed **575** Angular unit tests, **34** targeted Storybook badge/geometry/semantics tests, **10** day-entry screen story checks and **seven** application cases covering standalone entry, editing/deletion, successful template conversion and insufficient stock. The catalog was rebuilt with 292 stories. Application/Storybook builds, ten inventory regression checks, lint, style checks, translations, browser-test typing and documentation build passed. This follow-up used targeted browser suites; the earlier complete 582-test catalog run preceded the ten new badge stories.

The business-badge/summary-pill follow-up passed **581** Angular unit tests, **150** targeted Storybook checks for badge/summary APIs, measured geometry, static semantics and the consuming template/day-entry/inventory/meal-prep/shopping/statistics screens in desktop light/English and mobile dark/French, plus **14** application cases for inventories, template CRUD/stock, conversion and statistics. Application and Storybook builds, twelve inventory regressions, variant-coverage gates, lint, style checks, translations, browser-test typing and documentation build passed. Mobile consuming screens were inspected visually. The catalog contains 315 stories; this was a targeted follow-up, not a full-catalog run.

The calendar-tag/cycle-breakdown follow-up passed **598** Angular unit tests, **129** targeted Storybook checks for the two new component APIs, measured geometry/palettes/static semantics and consuming calendar/cycle/day-set/planning/day-entry stories in desktop light/English and mobile dark/French, plus **seven** application cases for calendar navigation, cycle/day-set CRUD, duration impacts and assignment creation/edit/removal. The consuming Year and single-selection stories explicitly verify the extracted labels and their rich-count/expanded metadata styles. Application and Storybook builds, thirteen inventory regressions, variant-coverage gates, lint, style checks, translations, browser-test typing and documentation build passed. Five mobile captures of year/month/week/day calendars and cycle selection were inspected. The catalog contains 348 stories; this is a targeted follow-up, not a full-catalog run. No domain calculations or action handlers were changed.

The overview-metric/date-summary/origin-marker follow-up added **18** stories, bringing the catalog to **366**. The catalog gate now waits for the requested story's `STORY_FINISHED` success, including its asynchronous `play` interaction. An initial complete **768**-case browser run passed **767** tests: all 366 canvases passed in both variants, but the strict mobile metric integration check exposed horizontal overflow in the unchanged calendar navigation header. Its fixed 200px title minimum pushed the next-period button outside the viewport, particularly with the French Today label. The responsive header now permits title shrinkage on mobile, preserves all three buttons, and retains the 200px minimum on desktop. The original no-page-overflow assertion was kept unchanged.

After that correction and rebuilding both artifacts, **606** Angular unit tests, **66** targeted Storybook tests and **nine** application cases passed. The targeted suite includes every primitive browser check, the calendar/home/planning canvases, shell navigation, and four new navigation checks covering English/French at 320px/390px across year/month/week/day views and the retained desktop title minimum. Fourteen inventory regressions, component/variant gates, lint, style checks, translations and browser-test typing passed. Three fresh mobile captures of the calendar, external-entry dashboard and day-action dialog were inspected; a separate French calendar measurement confirmed a 390px page width with no overflowing nodes. The complete catalog was not rerun after the responsive correction; the earlier 767-pass result and this 66-pass follow-up are separate runs, not a claim that the current 772-case complete suite passed. An isolated changing-content modal reproduction also confirmed the remaining focus issue documented above. No domain calculations or action handlers were changed.

These are regression checks for the implemented extraction, not exhaustive visual, accessibility or business-variant certification of the remaining families.
