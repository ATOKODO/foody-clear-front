import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UiChartBar } from '../../src/app/ui/chart-bar/chart-bar';

const meta = {
  title: 'UI/Chart bar',
  component: UiChartBar,
  args: { variant: 'expense', height: 64 },
  render: args => ({
    props: args,
    template: '<div style="height: 8rem; display: flex; align-items: flex-end"><app-chart-bar [variant]="variant" [height]="height" /></div>',
  }),
  argTypes: {
    variant: { control: 'select', options: ['expense', 'goal', 'actual'] },
    height: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
  parameters: {
    docs: { description: { component: 'Presentational vertical mark used by the statistics timelines. The owner supplies the normalized height; the component owns bar geometry and semantic color.' } },
  },
} satisfies Meta<UiChartBar>;
export default meta;
type Story = StoryObj<UiChartBar>;

export const Expense: Story = { args: { variant: 'expense', height: 64 } };
export const TargetGoal: Story = { args: { variant: 'goal', height: 80 } };
export const TargetActual: Story = { args: { variant: 'actual', height: 48 } };
