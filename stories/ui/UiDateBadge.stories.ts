import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UiDateBadge } from '../../src/app/ui/date-badge/date-badge';

const meta = {
  title: 'UI/Date badge', component: UiDateBadge,
  args: { label: 'Date', value: '2026-03-25', detail: null },
  render: args => ({ props: args, template: '<div appDateBadge [label]="label" [value]="value" [detail]="detail"></div>' }),
  parameters: { docs: { description: { component: 'Native date summary with a caption, display value and optional time/detail, preserving the planning-action dialog geometry. Owners choose locale, timezone and display formatting. No date parsing, live region or interactive role is introduced.' } } },
} satisfies Meta<UiDateBadge>;
export default meta;
type Story = StoryObj<UiDateBadge>;
export const DateOnly: Story = {};
export const WithTime: Story = { args: { detail: '08:30' } };
export const LocalizedValue: Story = { args: { label: 'Date sélectionnée', value: '25 mars 2026', detail: '08:30' } };
export const EmptyDetail: Story = { args: { detail: '' } };
export const LongLabel: Story = { args: { label: 'Selected date for the calendar entry editor' } };
export const LongValue: Story = { args: { value: 'Wednesday 25 March 2026 in Europe/Paris', detail: 'Morning entry at 08:30' } };
