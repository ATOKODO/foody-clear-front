# Cycles, day sets and slots

Cycles organize a plan over a fixed number of days. They define nutrition targets, default meal slots and an optional default template. Day sets replace individual default days with more specific settings.

Open **Cycles** to switch between cycle, day-set and slot management. These supporting views also have direct routes `/day-set` and `/slot`.

## Time slots

A slot is a named grouping for food entries, such as breakfast or dinner.

1. Open the slot management view and add a slot.
2. Enter a key such as `breakfast`, a title such as `Breakfast`, and a nonnegative sort order.
3. Optionally add nutrition targets for this slot.
4. Save.

Slots are ordered by sort order. Their time ranges are derived for planning; the creation form does not ask you to enter arbitrary start and end timestamps. Preferred times on [template lines](./templates.md) provide more precise planned placement.

## Day sets

A day set defines a particular kind of day, such as `Training` or `Rest`.

Create it with a title, optional daily nutrition targets, selected slots and an optional template. Its slots and template describe that day when the day set appears in a cycle. Select slots that match the associated template's explicit slot references.

You can reuse a day set in a longer cycle. Templates remain food compositions; day sets connect them to daily structure and goals.

## Create a cycle

1. Select the cycle view and choose its add action.
2. Enter a title, color and positive **Number of days**. Duration shortcuts prefill this number; you can adjust it.
3. Add optional cycle nutrition targets.
4. Select **Default cycle slots** and an optional **Default template**.
5. Select day sets to place on specific days.
6. Use **Cycle order** to drag and drop day sets among the default cycle days.
7. Resolve any positions outside the duration, then save.

Default days use the cycle's targets, slots and default template. A day occupied by a day set uses that day set's settings. The day editor identifies the active target source so you can understand a comparison.

## Put the cycle on the calendar

A cycle definition has no real start date. Create an [assignment](./assignments.md) to use it on actual dates. The assignment's inclusive end date is calculated from the cycle's duration.

For a seven-day cycle starting March 1, the assignment covers March 1 through March 7. To use the plan again, add another assignment for the next period.

## Edit a cycle already in use

Changing duration or ordering can affect assigned dates and active day sets. The cycle editor presents **Assignment impact** when applicable. Review the affected assignments before applying the update; conflicting assignment ranges cannot be saved.

Daily targets are planning values you supply. The app tracks and compares them; it does not prescribe nutrition goals. For amount units and target keys, see [Units and nutrition](../reference/units-nutrition.md).
