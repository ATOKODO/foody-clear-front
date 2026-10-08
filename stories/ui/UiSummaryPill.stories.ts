import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UiSummaryPill } from '../../src/app/ui/summary-pill/summary-pill';

const meta = {
  title: 'UI/Summary pill', component: UiSummaryPill,
  render: () => ({ template: '<span appSummaryPill>3 products in catalog</span>' }),
  parameters: { docs: { description: { component: 'Native projected summary counts and availability. Preserves the inventory/shopping/meal-prep counter geometry, strong foreground and semibold weight. Owners supply translated copy, layout and data; there is no automatic live region or focus target.' } } },
} satisfies Meta<UiSummaryPill>;
export default meta;
type Story = StoryObj<UiSummaryPill>;
export const Count: Story = {};
export const EmptyCount: Story = { render: () => ({ template: '<span appSummaryPill>0 inventories</span>' }) };
export const Availability: Story = { render: () => ({ template: '<span appSummaryPill>4 possible</span>' }) };
export const LongLabel: Story = { render: () => ({ template: '<span appSummaryPill>Products available in the selected inventories and their linked prepared meals</span>' }) };
export const RichValue: Story = { render: () => ({ template: '<span appSummaryPill><span aria-label="Products available"><strong>12</strong> products available</span></span>' }) };
