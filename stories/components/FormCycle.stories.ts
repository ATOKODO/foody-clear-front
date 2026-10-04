import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { FormCycle } from '../../src/components/cycle/form-cycle/form-cycle';
import { state, listSlots, listDaySets } from '../support/fixtures';

const meta = {
  title: 'Components/FormCycle',
  component: FormCycle,
  args: { submitted: fn(), mode: 'add', nutritionKeys: state.nutritionKeys, slots: listSlots, daySets: listDaySets, templates: state.templates, },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<FormCycle>;
export default meta;
type Story = StoryObj<FormCycle>;
export const Create: Story = {};

export const Edit: Story = { args: { mode: 'edit', cycle: { titre: 'Maintenance', couleur: 'green', nutritionValues: state.cycles[0].nutritionValues, nombre: 7, typeDuree: 'jour', durationDays: 7, slotIds: [1, 2], daySetOrder: [1, 2, 1, 2, 1, 2, 1], daySetIds: [1, 2], defaultTemplateId: 1 } } };
export const Saving: Story = { args: { mode: 'edit', cycle: { titre: 'Maintenance', couleur: 'green', nutritionValues: state.cycles[0].nutritionValues, nombre: 7, typeDuree: 'jour', durationDays: 7, slotIds: [1, 2], daySetOrder: [1, 2, 1, 2, 1, 2, 1], daySetIds: [1, 2], defaultTemplateId: 1 }, saving: true } };
