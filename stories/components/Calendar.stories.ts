import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Calendar } from '../../src/components/calendar/calendar';
import { cycleAssignments, day, state } from '../support/fixtures';
const meta = {
  title: 'Components/Calendar', component: Calendar,
  args: { initialDateLocal: '2026-03-25', cycleAssignments, inputDayResponse: day, slotCatalog: state.slots,
    dayClick: fn(), hourClick: fn(), monthClick: fn(), manageItems: fn(), manageAssignment: fn(), itemClick: fn(),
    convertTemplateItem: fn(), revertTemplateItem: fn(), openDayView: fn(), viewChanged: fn() },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Responsive calendar with real seeded assignments, targets and day entries. Quick actions emit events to Actions.' } } },
} satisfies Meta<Calendar>;
export default meta;
type Story = StoryObj<Calendar>;
export const Year: Story = { args: { initialView: 'year' } };
export const Month: Story = { args: { initialView: 'month' } };
export const Today: Story = {
  args: { initialView: 'month' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTestId('calendar-today'));
    const today = canvasElement.querySelector('.calendar-month-day--today');
    await expect(today).not.toBeNull();
    await expect(within(today as HTMLElement).getByText('Today')).toBeVisible();
  },
};
export const Week: Story = { args: { initialView: 'week' } };
export const Day: Story = {
  args: { initialView: 'day' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = canvasElement.querySelectorAll('.calendar-day-pilot-card');
    await expect(cards.length).toBeGreaterThan(0);
    await expect(canvas.getByText('Day dashboard')).toBeVisible();
    const firstCard = within(cards[0] as HTMLElement);
    await expect(firstCard.getByText('Logged')).toBeVisible();
    await expect(firstCard.getByText('Target')).toBeVisible();
    await expect(firstCard.getByText('Delta')).toBeVisible();
  },
};
export const Empty: Story = { args: { initialView: 'month', cycleAssignments: [], inputDayResponse: null } };
export const Loading: Story = { args: { initialView: 'day', loadingDayItems: true } };
export const Error: Story = { args: { initialView: 'day', dayItemsError: { message: 'Demo API unavailable' } } };
export const TemplateRevertAction: Story = {
  args: {
    initialView: 'day',
    inputDayResponse: {
      ...day,
      items: day.items.map((item, index) => index === 0 ? { ...item, templateItemId: 1 } : item),
    },
  },
};
