import type { Meta, StoryObj } from '@storybook/angular-vite';
import { TemplateFeature } from '../../src/features/template/template.feature';

const meta = {
  title: 'Screens/TemplateFeature',
  component: TemplateFeature,
  args: {  },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Live feature with isolated in-memory API. Changes never reach a real backend.' } } },
} satisfies Meta<TemplateFeature>;
export default meta;
type Story = StoryObj<TemplateFeature>;
export const Populated: Story = {};

export const Empty: Story = { parameters: { apiScenario: 'empty' } };
export const Loading: Story = { parameters: { apiScenario: 'loading' } };
export const Error: Story = { parameters: { apiScenario: 'error' } };
