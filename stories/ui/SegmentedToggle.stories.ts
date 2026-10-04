import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { SegmentedToggle } from '../../src/app/ui/segmented-toggle/segmented-toggle';
const meta = {
  title: 'UI/Segmented toggle', component: SegmentedToggle,
  args: { value: 'day', ariaLabel: 'Calendar view', options: [{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }], valueChange: fn() },
  render: args => ({ props: args, template: '<app-segmented-toggle [value]="value" [options]="options" [ariaLabel]="ariaLabel" [maxWidth]="maxWidth" (valueChange)="value = $event; valueChange($event)" />' }),
} satisfies Meta<SegmentedToggle>;
export default meta;
type Story = StoryObj<SegmentedToggle>;
export const Interactive: Story = {};
export const TwoOptions: Story = { args: { value: 'stock', options: [{ value: 'stock', label: 'Stock' }, { value: 'templates', label: 'Templates' }] } };
export const Narrow: Story = { args: { maxWidth: '20rem' } };
