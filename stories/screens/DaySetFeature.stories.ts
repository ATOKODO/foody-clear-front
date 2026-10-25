import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
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
export const EmbeddedDialog: Story = {
  args: { embedded: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTestId('day-set-add'));
    const dialog = await canvas.findByTestId('day-set-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveClass('app-modal-shell--embedded-day-set');
  },
};
