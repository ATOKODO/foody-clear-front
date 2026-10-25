import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiMacroProgressCard } from '../../src/app/ui/macro-progress-card/macro-progress-card';

const meta = {
  title: 'UI/Macro progress card',
  component: UiMacroProgressCard,
  args: {
    label: 'Proteins',
    actual: '84 g',
    target: 'Target 90 g',
    delta: 'Delta -6 g',
    progress: 93,
    status: 'under',
  },
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    status: { control: 'select', options: ['neutral', 'under', 'exact', 'over'] },
  },
  parameters: {
    docs: { description: { component: 'Presentational nutrition-progress card used by the home dashboard. The owner supplies localized/formatted copy and its computed progress/status; the component owns the metric layout, track and status color.' } },
  },
} satisfies Meta<UiMacroProgressCard>;
export default meta;
type Story = StoryObj<UiMacroProgressCard>;

export const BelowTarget: Story = { args: { status: 'under', progress: 72 } };
export const Exact: Story = { args: { status: 'exact', progress: 100, actual: '90 g', delta: 'Delta 0 g' } };
export const Over: Story = { args: { status: 'over', progress: 100, actual: '103 g', delta: 'Delta +13 g' } };
export const Unavailable: Story = { args: { status: 'neutral', progress: 0, actual: '—', target: 'Target unavailable', delta: 'No target' } };
export const LongLabel: Story = { args: { label: 'Carbohydrates across the selected day', actual: '218 g', target: 'Target 240 g', delta: 'Delta -22 g', progress: 91 } };
