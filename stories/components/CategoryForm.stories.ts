import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { CategoryForm } from '../../src/components/category/category-form/category-form';
import { state } from '../support/fixtures';

const meta = {
  title: 'Components/CategoryForm',
  component: CategoryForm,
  args: { submitted: fn(), menuClicked: fn(), mode: 'add',  },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<CategoryForm>;
export default meta;
type Story = StoryObj<CategoryForm>;
export const Create: Story = { args: { mode: 'add' } };

export const Edit: Story = { args: { mode: 'edit', category: state.categories[0] } };
export const Saving: Story = { args: { mode: 'edit', category: state.categories[0], saving: true } };
