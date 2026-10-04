import type { Meta, StoryObj } from '@storybook/angular-vite';
import { Product } from '../../src/features/product/product';

const meta = {
  title: 'Screens/Product',
  component: Product,
  args: {  },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<Product>;
export default meta;
type Story = StoryObj<Product>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
