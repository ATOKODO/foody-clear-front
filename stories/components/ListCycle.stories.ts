import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { ListCycle } from '../../src/components/cycle/list-cycle/list-cycle';
import { listCycles } from '../support/fixtures';

const meta = {
  title: 'Components/ListCycle',
  component: ListCycle,
  args: { addRequested: fn(), editRequested: fn(), deleteRequested: fn(), selected: fn(), selectedMany: fn(), cycles: listCycles, mode: 'manage' },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<ListCycle>;
export default meta;
type Story = StoryObj<ListCycle>;
export const Populated: Story = { args: { mode: 'manage' } };

export const Empty: Story = { args: { cycles: [] } };
export const SingleSelection: Story = { args: { mode: 'select-single', selectedIds: [1] } };
export const MultipleSelection: Story = { args: { mode: 'select-multi', selectedIds: [1] } };
export const Embedded: Story = { args: { embedded: true } };
export const WarningContext: Story = {
  args: {
    cycles: listCycles.map((cycle, index) => index === 0 ? {
      ...cycle,
      missingDayCount: 1,
      hasMissingSlotBreakdown: true,
      daySets: cycle.daySets.map(daySet => ({ ...daySet, slotMetrics: [] })),
    } : cycle),
  },
};
