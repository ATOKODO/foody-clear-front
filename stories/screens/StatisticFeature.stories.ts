import type { Meta, StoryObj } from '@storybook/angular-vite';
import { StatisticFeature } from '../../src/features/statistic/statistic.feature';

const meta = {
  title: 'Screens/StatisticFeature',
  component: StatisticFeature,
  args: {  },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<StatisticFeature>;
export default meta;
type Story = StoryObj<StatisticFeature>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
