import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UiOverviewMetric } from '../../src/app/ui/overview-metric/overview-metric';

const meta = {
  title: 'UI/Overview metric', component: UiOverviewMetric,
  args: { value: 12, label: 'Months covered' },
  render: args => ({ props: args, template: '<div appOverviewMetric [value]="value" [label]="label"></div>' }),
  parameters: { docs: { description: { component: 'Native value/label metric surface used by year, month and week calendar overviews. Preserves border, shadow, spacing, type and muted uppercase caption. Owners supply counts, units, translations and responsive placement; the component does not calculate, format or announce values.' } } },
} satisfies Meta<UiOverviewMetric>;
export default meta;
type Story = StoryObj<UiOverviewMetric>;
export const Count: Story = {};
export const Zero: Story = { args: { value: 0, label: 'Scheduled days' } };
export const LargeValue: Story = { args: { value: 123456, label: 'Tracked kcal' } };
export const FormattedValue: Story = { args: { value: '1 234,5', label: 'Énergie enregistrée (kcal)' } };
export const LongLabel: Story = { args: { value: 284, label: 'Days scheduled across all active calendar months' } };
export const Group: Story = {
  render: args => ({ props: args, template: `<div style="display: flex; flex-wrap: wrap; gap: 12px">
    <div appOverviewMetric [value]="value" [label]="label"></div>
    <div appOverviewMetric [value]="284" label="Scheduled days"></div>
    <div appOverviewMetric [value]="10" label="Active months"></div>
  </div>` }),
};
