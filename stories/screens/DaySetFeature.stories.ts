import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { DaySetFeature } from '../../src/features/day-set/day-set.feature';

const meta = {
  title: 'Screens/DaySetFeature',
  component: DaySetFeature,
  args: { dataChanged: fn() },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<DaySetFeature>;
export default meta;
type Story = StoryObj<DaySetFeature>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
