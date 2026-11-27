import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { ProductList } from '../../src/components/product/product-list/product-list';
import { listProducts } from '../support/fixtures';

const meta = {
  title: 'Components/ProductList',
  component: ProductList,
  args: { addRequested: fn(), editRequested: fn(), deleteRequested: fn(), selected: fn(), selectedMany: fn(), products: listProducts, mode: 'manage' },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<ProductList>;
export default meta;
type Story = StoryObj<ProductList>;
export const Populated: Story = { args: { mode: 'manage' } };
export const LongName: Story = {
  args: { products: listProducts.map((product, index) => index === 0
    ? { ...product, name: 'Biscotte blé complet et céréales croquantes – recette originale' }
    : product) },
};

export const Empty: Story = { args: { products: [] } };
export const SingleSelection: Story = { args: { mode: 'select-single', selectedIds: ['1'] } };
export const MultipleSelection: Story = { args: { mode: 'select-multi', selectedIds: ['1'] } };
export const SingleEdit: Story = { args: { mode: 'single-edit', selectedIds: ['1'] } };
export const MultiEdit: Story = { args: { mode: 'multi-edit', selectedIds: ['1'] } };
export const Embedded: Story = { args: { embedded: true } };
