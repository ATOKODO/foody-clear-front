import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MealPrepFeature } from '../../src/features/meal-prep/meal-prep.feature';

const meta = {
  title: 'Screens/MealPrepFeature',
  component: MealPrepFeature,
  args: {  },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<MealPrepFeature>;
export default meta;
type Story = StoryObj<MealPrepFeature>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
