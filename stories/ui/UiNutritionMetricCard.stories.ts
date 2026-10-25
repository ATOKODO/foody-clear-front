import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiNutritionMetricCard } from '../../src/app/ui/nutrition-metric-card/nutrition-metric-card';

const meta = {
  title: 'UI/Nutrition metric card',
  component: UiNutritionMetricCard,
  args: { prominent: false },
  argTypes: { prominent: { control: 'boolean' } },
  parameters: {
    docs: { description: { component: 'Shared nutrition metric surface used by cycle targets. It owns the themed card surface and optional prominent sizing; consumers provide metric labels, values and layout.' } },
  },
} satisfies Meta<UiNutritionMetricCard>;
export default meta;
type Story = StoryObj<UiNutritionMetricCard>;

export const Standard: Story = {
  args: { prominent: false },
  render: args => ({ props: args, template: `
    <div style="max-width: 20rem; padding: 1rem; background: var(--app-surface)">
      <div appNutritionMetricCard [prominent]="prominent" style="padding: 0.625rem 0.75rem">
        <p style="margin: 0; color: var(--app-text-muted); font-size: 0.75rem; text-transform: uppercase">Proteins</p>
        <p style="margin: 0.25rem 0 0; color: var(--app-text-strong); font-size: 1rem; font-weight: 700">84 g</p>
      </div>
    </div>
  ` }),
};

export const Prominent: Story = {
  args: { prominent: true },
  render: Standard.render,
};
