import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UiStatusBadge } from '../../src/app/ui/status-badge/status-badge';

const meta = {
  title: 'UI/Status badge', component: UiStatusBadge,
  args: { tone: 'neutral', size: 'medium', emphasis: 'strong', appearance: 'outlined' },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'saving', 'warning', 'info', 'success', 'danger'] },
    size: { control: 'select', options: ['medium', 'small', 'compact', 'card', 'counter', 'chip', 'marker'] },
    emphasis: { control: 'select', options: ['normal', 'medium', 'semibold', 'strong', 'heavy'] },
    appearance: { control: 'select', options: ['outlined', 'soft', 'bare'] },
  },
  render: args => ({ props: args, template: '<span appStatusBadge [tone]="tone" [size]="size" [emphasis]="emphasis" [appearance]="appearance">Loading products…</span>' }),
  parameters: { docs: { description: { component: 'Projected status text on the original span. Tone is visual: keep meaningful words and use role="status" on the surrounding live region only when updates should be announced.' } } },
} satisfies Meta<UiStatusBadge>;
export default meta;
type Story = StoryObj<UiStatusBadge>;
const textStory = (label: string): NonNullable<Story['render']> => args => ({
  props: { ...args, label },
  template: '<span appStatusBadge [tone]="tone" [size]="size" [emphasis]="emphasis" [appearance]="appearance">{{ label }}</span>',
});
export const Neutral: Story = { args: { tone: 'neutral', size: 'medium', emphasis: 'strong', appearance: 'outlined' } };
export const Saving: Story = { args: { tone: 'saving' } };
export const Warning: Story = { args: { tone: 'warning' } };
export const Info: Story = { args: { tone: 'info' } };
export const Success: Story = { args: { tone: 'success' } };
export const Danger: Story = { args: { tone: 'danger' } };
export const Small: Story = { args: { size: 'small' } };
export const Compact: Story = { args: { size: 'compact' } };
export const NormalWeight: Story = { args: { emphasis: 'normal' } };
export const MediumWeight: Story = { args: { emphasis: 'medium' } };
export const StockAvailable: Story = {
  args: { tone: 'success', size: 'small', emphasis: 'medium' },
  render: args => ({ props: args, template: '<span appStatusBadge [tone]="tone" [size]="size" [emphasis]="emphasis" [appearance]="appearance">Stock OK</span>' }),
};
export const LowStock: Story = {
  args: { tone: 'danger', size: 'small', emphasis: 'medium' },
  render: args => ({ props: args, template: '<span appStatusBadge [tone]="tone" [size]="size" [emphasis]="emphasis" [appearance]="appearance">Low stock</span>' }),
};
export const Planned: Story = {
  args: { tone: 'info', size: 'small', emphasis: 'medium' },
  render: args => ({ props: args, template: '<span appStatusBadge [tone]="tone" [size]="size" [emphasis]="emphasis" [appearance]="appearance">Planned</span>' }),
};
export const Converted: Story = {
  args: { tone: 'success', size: 'compact', emphasis: 'medium' },
  render: args => ({ props: args, template: '<span appStatusBadge [tone]="tone" [size]="size" [emphasis]="emphasis" [appearance]="appearance">Effective from template</span>' }),
};
export const LongCompactLabel: Story = {
  args: { tone: 'info', size: 'small', emphasis: 'normal' },
  render: args => ({ props: args, template: '<span appStatusBadge [tone]="tone" [size]="size" [emphasis]="emphasis" [appearance]="appearance">Loading the selected inventory and its linked products…</span>' }),
};
export const LongLabel: Story = { render: args => ({ props: args, template: '<span appStatusBadge [tone]="tone" [size]="size" [emphasis]="emphasis" [appearance]="appearance">Loading the selected inventory and its linked products…</span>' }) };

export const Semibold: Story = { args: { emphasis: 'semibold' } };
export const Soft: Story = { args: { appearance: 'soft', tone: 'info' } };
export const Bare: Story = { args: { appearance: 'bare' } };
export const Card: Story = { args: { size: 'card', appearance: 'soft', tone: 'success' } };
export const Counter: Story = { args: { size: 'counter', appearance: 'soft', emphasis: 'semibold' } };
export const Chip: Story = { args: { size: 'chip', appearance: 'soft', emphasis: 'normal', tone: 'warning' } };
export const TemplateStockAvailable: Story = { args: { tone: 'success', size: 'small', emphasis: 'medium', appearance: 'soft' }, render: textStory('Stock OK') };
export const TemplateLowStock: Story = { args: { tone: 'danger', size: 'small', emphasis: 'medium', appearance: 'soft' }, render: textStory('Low stock') };
export const StockUnknown: Story = { args: { tone: 'neutral', size: 'small', emphasis: 'medium', appearance: 'bare' }, render: textStory('Unknown stock') };
export const SelectedCount: Story = { args: { size: 'counter', emphasis: 'medium', appearance: 'soft' }, render: textStory('3 selected') };
export const StockedCard: Story = { args: { tone: 'success', size: 'card', appearance: 'soft' }, render: textStory('Stocked') };
export const EmptyCard: Story = { args: { tone: 'warning', size: 'card', appearance: 'soft' }, render: textStory('Empty') };
export const PreparedStockReady: Story = { args: { tone: 'success', size: 'card', appearance: 'soft' }, render: textStory('In stock') };
export const PreparedStockMissing: Story = { args: { tone: 'warning', size: 'card', appearance: 'soft' }, render: textStory('Incomplete stock') };
export const ShoppingTemplate: Story = { args: { tone: 'info', size: 'card', appearance: 'soft' }, render: textStory('Template') };
export const ShoppingProgress: Story = { args: { tone: 'warning', size: 'card', appearance: 'soft' }, render: textStory('In progress') };
export const PricingExcluded: Story = { args: { size: 'chip', emphasis: 'normal', appearance: 'bare' }, render: textStory('Excluded') };
export const PricingIncomplete: Story = { args: { tone: 'warning', size: 'chip', emphasis: 'normal', appearance: 'soft' }, render: textStory('Missing price') };

export const Heavy: Story = { args: { emphasis: 'heavy' }, render: textStory('Important status') };
export const Marker: Story = { args: { size: 'marker', tone: 'info', emphasis: 'heavy', appearance: 'soft' }, render: textStory('External') };
export const External: Story = {
  args: { size: 'marker', tone: 'info', emphasis: 'heavy', appearance: 'soft' },
  render: args => ({ props: args, template: '<strong>Restaurant meal <em appStatusBadge [tone]="tone" [size]="size" [emphasis]="emphasis" [appearance]="appearance">External</em></strong>' }),
};
export const LongExternal: Story = {
  args: { size: 'marker', tone: 'info', emphasis: 'heavy', appearance: 'soft' },
  render: args => ({ props: args, template: '<em appStatusBadge [tone]="tone" [size]="size" [emphasis]="emphasis" [appearance]="appearance">Entry recorded outside the managed inventories</em>' }),
};
