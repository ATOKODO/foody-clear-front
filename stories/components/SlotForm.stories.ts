import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { SlotForm } from '../../src/components/slot/slot-form/slot-form';
import { state } from '../support/fixtures';

const meta = {
  title: 'Components/SlotForm',
  component: SlotForm,
  args: { submitted: fn(), menuClicked: fn(), mode: 'add', nutritionKeys: state.nutritionKeys, },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<SlotForm>;
export default meta;
type Story = StoryObj<SlotForm>;
export const Create: Story = { args: { mode: 'add' } };

export const Edit: Story = { args: { mode: 'edit', slot: state.slots[0] } };
export const Saving: Story = { args: { mode: 'edit', slot: state.slots[0], saving: true } };
