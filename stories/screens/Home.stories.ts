import type { Meta, StoryObj } from '@storybook/angular-vite';
import { Home } from '../../src/features/home/home';
import type { ExternalMealEntrySummary } from '../../src/interfaces/input-day.interface';

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

const externalEntry: ExternalMealEntrySummary = {
  id: 100, dateLocal: '2026-03-25', name: 'Restaurant meal', paymentStatus: 'paid', priceAmount: 12,
  occurredAt: '2026-03-25T12:30:00+01:00', insertedAt: '2026-03-25T12:30:00+01:00',
  slotId: null, slotKey: 'lunch', nutritionValue: { energyKcal: 550, proteins: 30, carbs: 65, lipids: 18 },
};
export const ExternalEntry: Story = { parameters: { apiExternalEntries: { '2026-03-25': [externalEntry] } } };
