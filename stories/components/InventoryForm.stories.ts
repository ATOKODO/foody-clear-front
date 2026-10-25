import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { InventoryForm } from '../../src/components/inventory/inventory-form/inventory-form';
import { state } from '../support/fixtures';

const meta = {
  title: 'Components/InventoryForm',
  component: InventoryForm,
  args: { submitted: fn(), menuClicked: fn(), mode: 'add',  },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<InventoryForm>;
export default meta;
type Story = StoryObj<InventoryForm>;
export const Create: Story = { args: { mode: 'add' } };

export const Edit: Story = { args: { mode: 'edit', inventory: state.inventories[0] } };
export const Saving: Story = { args: { mode: 'edit', inventory: state.inventories[0], saving: true } };
