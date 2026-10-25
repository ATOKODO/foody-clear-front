import type { Meta, StoryObj } from '@storybook/angular-vite';
import { PlanningFeature } from '../../src/features/planning/planning.feature';
import { expect, userEvent, within } from 'storybook/test';

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

export const DayActions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const year = await canvas.findByTestId('planning-view-year');
    await userEvent.click(within(year).getByRole('radio'));
    await userEvent.click(await canvas.findByTestId('calendar-year-day-2026-03-25'));
    const actions = await canvas.findByTestId('planning-modal-actions');
    await expect(actions).toBeVisible();
    await userEvent.click(await canvas.findByTestId('planning-action-items'));
    const editor = await canvas.findByTestId('planning-modal-items');
    await expect(editor.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect(editor.isConnected).toBe(false);
  },
};
