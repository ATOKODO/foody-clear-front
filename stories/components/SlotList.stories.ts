import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { SlotList } from '../../src/components/slot/slot-list/slot-list';
import { listSlots } from '../support/fixtures';

const meta = {
  title: 'Components/SlotList',
  component: SlotList,
  args: { addRequested: fn(), editRequested: fn(), deleteRequested: fn(), selected: fn(), selectedMany: fn(), slots: listSlots, mode: 'manage' },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<SlotList>;
export default meta;
type Story = StoryObj<SlotList>;
export const Populated: Story = {};

export const Empty: Story = { args: { slots: [] } };
export const SingleSelection: Story = { args: { mode: 'select-single', selectedIds: ['1'] } };
export const MultipleSelection: Story = { args: { mode: 'select-multi', selectedIds: ['1'] } };
export const Embedded: Story = { args: { embedded: true } };
