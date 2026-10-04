import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MaterialPreview } from '../../src/app/stories/material-preview/material-preview';

const meta = {
  title: 'UI/Material/Tabs', component: MaterialPreview,
  args: {"section":"tabs","disabled":false},
  argTypes: { section: { table: { disable: true } } },
  parameters: { docs: { description: { component: "Isolated preview of the real Angular Material controls already used by production templates, with the application theme. MaterialPreview is a Storybook-only composition, not a second production implementation. " } } },
} satisfies Meta<MaterialPreview>;
export default meta;
type Story = StoryObj<MaterialPreview>;
export const Interactive: Story = {};
export const DisabledTab: Story = { args: {"disabled":true} };
