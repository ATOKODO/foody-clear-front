import type { Meta, StoryObj } from '@storybook/angular-vite';
import { CycleFeature } from '../../src/features/cycle/cycle.feature';

const meta = {
  title: 'Screens/CycleFeature',
  component: CycleFeature,
  args: {  },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<CycleFeature>;
export default meta;
type Story = StoryObj<CycleFeature>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
