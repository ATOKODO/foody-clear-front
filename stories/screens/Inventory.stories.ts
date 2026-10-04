import type { Meta, StoryObj } from '@storybook/angular-vite';
import { Inventory } from '../../src/features/inventory/inventory';

const meta = {
  title: 'Screens/Inventory',
  component: Inventory,
  args: {  },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<Inventory>;
export default meta;
type Story = StoryObj<Inventory>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
