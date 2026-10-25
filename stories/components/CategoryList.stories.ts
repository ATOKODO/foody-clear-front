import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { CategoryList } from '../../src/components/category/category-list/category-list';
import { listCategories } from '../support/fixtures';

const meta = {
  title: 'Components/CategoryList',
  component: CategoryList,
  args: { addRequested: fn(), editRequested: fn(), deleteRequested: fn(), selected: fn(), selectedMany: fn(), categories: listCategories, mode: 'manage' },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<CategoryList>;
export default meta;
type Story = StoryObj<CategoryList>;
export const Populated: Story = { args: { mode: 'manage' } };

export const Empty: Story = { args: { categories: [] } };
export const SingleSelection: Story = { args: { mode: 'select-single', selectedIds: ['1'] } };
export const MultipleSelection: Story = { args: { mode: 'select-multi', selectedIds: ['1'] } };
export const Embedded: Story = { args: { embedded: true } };
