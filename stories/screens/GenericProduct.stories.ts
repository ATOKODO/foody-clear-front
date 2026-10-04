import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { GenericProduct } from '../../src/features/generic-product/generic-product';

const meta = {
  title: 'Screens/GenericProduct',
  component: GenericProduct,
  args: { dataChanged: fn() },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<GenericProduct>;
export default meta;
type Story = StoryObj<GenericProduct>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
