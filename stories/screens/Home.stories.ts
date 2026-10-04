import type { Meta, StoryObj } from '@storybook/angular-vite';
import { Home } from '../../src/features/home/home';

const meta = {
  title: 'Screens/Home',
  component: Home,
  args: {  },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<Home>;
export default meta;
type Story = StoryObj<Home>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
