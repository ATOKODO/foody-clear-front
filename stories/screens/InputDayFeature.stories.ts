import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { InputDayFeature } from '../../src/features/input-day/input-day.feature';

const meta = {
  title: 'Screens/InputDayFeature',
  component: InputDayFeature,
  args: { itemsChanged: fn(), initialDateLocal: '2026-03-25' },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<InputDayFeature>;
export default meta;
type Story = StoryObj<InputDayFeature>;
export const Populated: Story = {};
export const Embedded: Story = { args: { displayMode: 'embedded', lockDate: true } };

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
