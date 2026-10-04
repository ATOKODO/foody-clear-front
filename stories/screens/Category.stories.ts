import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { Category } from '../../src/features/category/category';

const meta = {
  title: 'Screens/Category',
  component: Category,
  args: { dataChanged: fn() },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<Category>;
export default meta;
type Story = StoryObj<Category>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
