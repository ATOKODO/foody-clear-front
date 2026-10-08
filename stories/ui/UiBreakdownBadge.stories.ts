import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UiBreakdownBadge } from '../../src/app/ui/breakdown-badge/breakdown-badge';

const meta = {
  title: 'UI/Breakdown badge', component: UiBreakdownBadge,
  args: { kind: 'meta', status: 'under', expanded: false },
  render: args => ({ props: args, template: '<span appBreakdownBadge [kind]="kind" [status]="status" [expanded]="expanded">Cycle details</span>' }),
  parameters: { docs: { description: { component: 'Native cycle metadata, overview warnings and nutrition breakdown statuses. State colors use the existing under/exact/over/missing design tokens. Expanded metadata and overview preserve the single-selection layout. Owners retain status calculations, translated labels and interactions; the badge adds no announcement role or focus target.' } } },
} satisfies Meta<UiBreakdownBadge>;
export default meta;
type Story = StoryObj<UiBreakdownBadge>;
const copy = (label: string): Story['render'] => args => ({ props: args, template: `<span appBreakdownBadge [kind]="kind" [status]="status" [expanded]="expanded">${label}</span>` });

export const Metadata: Story = { args: { kind: 'meta' }, render: copy('3 linked day sets') };
export const ExpandedMetadata: Story = { args: { kind: 'meta', expanded: true }, render: copy('3 linked day sets') };
export const Under: Story = { args: { kind: 'status', status: 'under' }, render: copy('Under target') };
export const Exact: Story = { args: { kind: 'status', status: 'exact' }, render: copy('Exact target') };
export const Over: Story = { args: { kind: 'status', status: 'over' }, render: copy('Over target') };
export const Missing: Story = { args: { kind: 'status', status: 'missing' }, render: copy('Missing breakdown') };
export const OverviewOver: Story = { args: { kind: 'overview', status: 'over' }, render: copy('Slots > day set') };
export const OverviewMissing: Story = { args: { kind: 'overview', status: 'missing' }, render: copy('Slot breakdown missing') };
export const ExpandedOverview: Story = { args: { kind: 'overview', status: 'missing', expanded: true }, render: copy('Slot breakdown missing') };
export const LongMetadata: Story = { args: { kind: 'meta' }, render: copy('A longer description of the linked day sets and their cycle duration') };
