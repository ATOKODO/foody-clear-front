import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
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
export const Month: Story = { args: { initialView: 'month' } };
export const Week: Story = { args: { initialView: 'week' } };
export const Day: Story = { args: { initialView: 'day' } };
export const Empty: Story = { args: { initialView: 'month', cycleAssignments: [], inputDayResponse: null } };
export const Loading: Story = { args: { initialView: 'day', loadingDayItems: true } };
export const Error: Story = { args: { initialView: 'day', dayItemsError: { message: 'Demo API unavailable' } } };
