import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { InventoryList } from '../../src/components/inventory/inventory-list/inventory-list';
import { listInventories } from '../support/fixtures';

const meta = {
  title: 'Components/InventoryList',
  component: InventoryList,
  args: { addRequested: fn(), editRequested: fn(), deleteRequested: fn(), selected: fn(), selectedMany: fn(), inventories: listInventories, mode: 'manage' },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<InventoryList>;
export default meta;
type Story = StoryObj<InventoryList>;
export const Populated: Story = {};

export const Empty: Story = { args: { inventories: [] } };
export const SingleSelection: Story = { args: { mode: 'select-single', selectedIds: ['1'] } };
export const MultipleSelection: Story = { args: { mode: 'select-multi', selectedIds: ['1'] } };
export const Embedded: Story = { args: { embedded: true } };
