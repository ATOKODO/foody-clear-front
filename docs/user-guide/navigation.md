# Navigation and dashboard

## Main navigation

The application has nine main destinations:

| Destination | What you do there |
| --- | --- |
| Home | Review today and enter food quickly |
| Catalog | Manage products and their organization |
| Shopping lists | Prepare purchases and reuse shopping templates |
| Inventories | Track products held in stock locations |
| Meal prep | Compose dishes and meals |
| Templates | Save reusable planned food entries |
| Cycles | Configure goals, day sets and time slots |
| Assignments | Apply cycles to dates and open day editors |
| Statistics | Review nutrition, spending and price history |

On narrow screens, open the navigation using the menu button. The page header shows your current destination. Catalog and Cycles contain management views for their supporting data.

## Home: today's dashboard

**Home** shows the current local day and its timezone. The dashboard includes:

- **What is planned today:** food grouped into slots, with conversion actions and a restore-to-template action for converted entries.
- **Today's entries:** food already recorded for this day.
- **Today's progress:** actual energy and macros compared with the active goal source.
- **Today's spending:** purchase total, purchase count and incomplete pricing count.
- **Fill the day:** a quick entry editor loaded when you open it.

Use **Refresh** to reload data, **Day planning** to open the calendar day, or **External entry** to record a meal outside your inventories. The active date refreshes at local midnight and when returning to the app after a date change.

## Lists and editors

Many management screens show a selectable list on the left and details on the right. Selecting a row shows its contents; **Edit** opens the editor. The detail area is often read-only.

Use product search to find a name, barcode, category, generic product or tag. Checkboxes select or check the relevant rows, depending on the screen.

Modal editors keep keyboard focus inside the active dialog. `Tab` and `Shift+Tab` move between controls; `Escape` closes the current dialog when no save is in progress. A nested product picker closes before the underlying editor. Saves disable repeated submission until the request finishes.

## Appearance and language

The theme control switches between light and dark mode. A saved choice is remembered in the browser; otherwise the app follows your system preference.

Use **EN / FR**, beside the theme control, to change the interface language immediately. The choice is remembered in this browser; without a saved choice, French-language browsers start in French and other browsers start in English. Switching languages keeps the current page, open forms and unsaved values.

Dates, numbers and currency follow the selected language. Product names, inventory names, recipe titles and other stored content stay unchanged. API paths, JSON field names, enum values and technical error details also remain unchanged. These documentation pages are in English.
