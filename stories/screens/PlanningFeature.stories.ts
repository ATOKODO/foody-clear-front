import type { Meta, StoryObj } from '@storybook/angular-vite';
import { PlanningFeature } from '../../src/features/planning/planning.feature';

const meta = {
  title: 'Screens/PlanningFeature',
  component: PlanningFeature,
  args: {  },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<PlanningFeature>;
export default meta;
type Story = StoryObj<PlanningFeature>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
