import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { DaySetForm } from '../../src/components/day-set/day-set-form/day-set-form';
import { state, listSlots } from '../support/fixtures';

const meta = {
  title: 'Components/DaySetForm',
  component: DaySetForm,
  args: { submitted: fn(), menuClicked: fn(), mode: 'add', nutritionKeys: state.nutritionKeys, slots: listSlots, templates: state.templates, },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<DaySetForm>;
export default meta;
type Story = StoryObj<DaySetForm>;
export const Create: Story = {};

export const Edit: Story = { args: { mode: 'edit', daySet: state.daySets[0] } };
export const Saving: Story = { args: { mode: 'edit', daySet: state.daySets[0], saving: true } };
