import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiBreakdownBadge } from '../../src/app/ui/breakdown-badge/breakdown-badge';
import { UiBreakdownCard } from '../../src/app/ui/breakdown-card/breakdown-card';

const meta = {
  title: 'UI/Breakdown card',
  component: UiBreakdownCard,
  decorators: [moduleMetadata({ imports: [UiBreakdownBadge] })],
  args: { density: 'compact', prominent: false, status: 'under' },
  argTypes: {
    density: { control: 'select', options: ['compact', 'summary'] },
    prominent: { control: 'boolean' },
    status: { control: 'select', options: ['under', 'exact', 'over', 'missing'] },
  },
  parameters: {
    docs: { description: { component: 'Shared cycle nutrition breakdown surface. It owns density, prominent sizing and status-colored surface; consumers provide metric labels, values, captions and status copy.' } },
  },
} satisfies Meta<UiBreakdownCard>;
export default meta;
type Story = StoryObj<UiBreakdownCard>;

const metric = (args: Record<string, unknown>) => ({ props: args, template: `
  <div style="max-width: 28rem; padding: 1rem; background: var(--app-surface-soft)">
    <article appBreakdownCard [density]="density" [prominent]="prominent" [status]="status" style="display: grid; gap: 0.5rem">
      <div style="display: flex; justify-content: space-between; gap: 1rem">
        <strong style="color: var(--app-text-strong)">Proteins</strong>
        <span appBreakdownBadge kind="status" [status]="status">{{ status }}</span>
      </div>
      <div style="display: flex; justify-content: space-between; gap: 1rem">
        <span>84 / 90 g</span><strong>93%</strong>
      </div>
    </article>
  </div>
` });

export const CompactBelowTarget: Story = { args: { density: 'compact', status: 'under' }, render: metric };
export const Exact: Story = { args: { density: 'compact', status: 'exact' }, render: metric };
export const Over: Story = { args: { density: 'compact', status: 'over' }, render: metric };
export const Missing: Story = { args: { density: 'compact', status: 'missing' }, render: metric };
export const Summary: Story = { args: { density: 'summary', status: 'exact' }, render: metric };
export const Prominent: Story = { args: { density: 'compact', prominent: true, status: 'over' }, render: metric };
