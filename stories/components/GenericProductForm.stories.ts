import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { GenericProductForm } from '../../src/components/generic-product/generic-product-form/generic-product-form';

const meta = {
  title: 'Components/GenericProductForm',
  component: GenericProductForm,
  args: { submitted: fn(), menuClicked: fn(), mode: 'add',  },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<GenericProductForm>;
export default meta;
type Story = StoryObj<GenericProductForm>;
export const Create: Story = {};

export const Edit: Story = { args: { mode: 'edit', genericProduct: { name: 'Fruit', minQuantityUnit: 2, minQuantityUnitType: 'piece', minQuantityMetric: 300, minQuantityMetricType: 'g' } } };
export const Saving: Story = { args: { mode: 'edit', genericProduct: { name: 'Fruit', minQuantityUnit: 2, minQuantityUnitType: 'piece', minQuantityMetric: 300, minQuantityMetricType: 'g' }, saving: true } };
