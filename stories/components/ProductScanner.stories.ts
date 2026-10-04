import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { ProductScanner } from '../../src/components/product/product-scanner/product-scanner';
const meta = {
  title: 'Components/Product scanner', component: ProductScanner, args: { active: true, disabled: false, selected: fn() },
  parameters: { docs: { description: { component: 'Manual barcode lookup returns a local demo product. Camera is never started automatically; the camera button requires your browser permission.' } } },
} satisfies Meta<ProductScanner>;
export default meta;
type Story = StoryObj<ProductScanner>;
export const ManualLookup: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Inactive: Story = { args: { active: false } };
