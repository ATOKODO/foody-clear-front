import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UiStatusBadge } from '../../src/app/ui/status-badge/status-badge';

const meta = {
  title: 'UI/Status badge', component: UiStatusBadge,
  args: { tone: 'neutral' },
  argTypes: { tone: { control: 'select', options: ['neutral', 'saving', 'warning', 'info', 'success'] } },
  render: args => ({ props: args, template: '<span appStatusBadge [tone]="tone">Loading products…</span>' }),
  parameters: { docs: { description: { component: 'Projected status text on the original span. Tone is visual: keep meaningful words and use role="status" on the surrounding live region only when updates should be announced.' } } },
} satisfies Meta<UiStatusBadge>;
export default meta;
type Story = StoryObj<UiStatusBadge>;
export const Neutral: Story = {};
export const Saving: Story = { args: { tone: 'saving' } };
export const Warning: Story = { args: { tone: 'warning' } };
export const Info: Story = { args: { tone: 'info' } };
export const Success: Story = { args: { tone: 'success' } };
export const LongLabel: Story = { render: args => ({ props: args, template: '<span appStatusBadge [tone]="tone">Loading the selected inventory and its linked products…</span>' }) };
