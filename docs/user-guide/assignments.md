# Assignments and calendar

**Assignments** (`/planning`) is the calendar hub backed by your cycle assignments and recorded day data. It connects reusable plans to real dates.

## Browse your plan

Use the calendar view selector to switch between year, month, week and day. The previous and next buttons move the visible period; **Today** returns to the current date. **Refresh** reloads the relevant data.

The day view shows slots, goals, template items and recorded entries. Week and month views summarize days. Select a day or a more precise time to open its actions or editor.

The URL can carry the selected view and date:

```text
/planning?view=day&date=2026-03-25
```

Dates are local calendar dates, not UTC timestamps. The day editor uses a timezone to place timestamped entries correctly.

## Create an assignment

1. Select a date and choose **Manage cycle** from **Day actions**.
2. Select the cycle you want to apply.
3. Set the start date and validate.

The backend computes the inclusive end date from cycle duration. Assignments cannot overlap. Move, change or remove the conflicting assignment if you want to use another cycle in that period.

## Change or remove an assignment

Open **Manage cycle** on an assigned day to choose another cycle or start date. Use **Remove** to remove the assignment.

Removing a calendar assignment removes its planning association; actual food entries are managed separately in the day editor. Check older days after changing a plan because their target context may differ.

## Record food from the calendar

**Day actions** offers:

- **Edit day:** open the day input editor for the selected date and time context.
- **Add external meal:** record a restaurant or other unplanned meal without stock consumption.
- **Manage cycle:** maintain the assignment covering the date.

Template conversion and restoration are also available from supported calendar entries. See [Record your day](./day-input.md) and [External meals](./external-meals.md).

## Overnight slots and precise times

A slot extending over midnight can be drawn in two visible day segments. Recorded entries remain counted once, and actions preserve the selected minute rather than rounding every click to the start of an hour.

When inspecting an entry near midnight, compare its local date, timezone and timestamp. See [Troubleshooting](../troubleshooting.md#dates-or-goals-look-wrong).

## Standalone calendar route

The auxiliary `/calendar` route displays the calendar component by itself. Use **Assignments** for the full application workflow and backend-loaded planning data. The [auxiliary tools guide](./tools.md) describes these direct routes.
