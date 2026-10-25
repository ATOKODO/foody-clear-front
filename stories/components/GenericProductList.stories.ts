import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { GenericProductList } from '../../src/components/generic-product/generic-product-list/generic-product-list';
import { listGenericProducts } from '../support/fixtures';

const meta = {
  title: 'Components/GenericProductList',
  component: GenericProductList,
  args: { addRequested: fn(), editRequested: fn(), deleteRequested: fn(), selected: fn(), selectedMany: fn(), genericProducts: listGenericProducts, mode: 'manage' },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<GenericProductList>;
export default meta;
type Story = StoryObj<GenericProductList>;
export const Populated: Story = { args: { mode: 'manage' } };

export const Empty: Story = { args: { genericProducts: [] } };
export const SingleSelection: Story = { args: { mode: 'select-single', selectedIds: ['1'] } };
export const MultipleSelection: Story = { args: { mode: 'select-multi', selectedIds: ['1'] } };
export const Embedded: Story = { args: { embedded: true } };
