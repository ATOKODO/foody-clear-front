import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { ProductForm } from '../../src/components/product/product-form/product-form';
import { state } from '../support/fixtures';

const meta = {
  title: 'Components/ProductForm',
  component: ProductForm,
  args: { submitted: fn(), menuClicked: fn(), mode: 'add', categories: state.categories, tags: state.tags, genericProducts: [], nutritionKeys: state.nutritionKeys, quantityUnits: state.quantityUnits, },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<ProductForm>;
export default meta;
type Story = StoryObj<ProductForm>;
export const Create: Story = {};

export const Edit: Story = { args: { mode: 'edit', product: { name: 'Banane', barcode: '3017620422003', categoryId: 1, tagIds: [1], genericProductId: 1, unitType: 'Unite', quantityPerUnit: 120, quantityUnit: 'g', price: 0.49, priceUnit: 'unite', nutritionValues: state.products[0].nutritionValues } } };
export const Saving: Story = { args: { mode: 'edit', product: { name: 'Banane', barcode: '3017620422003', categoryId: 1, tagIds: [1], genericProductId: 1, unitType: 'Unite', quantityPerUnit: 120, quantityUnit: 'g', price: 0.49, priceUnit: 'unite', nutritionValues: state.products[0].nutritionValues }, saving: true } };
