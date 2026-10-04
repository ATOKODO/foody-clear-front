import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MaterialPreview } from '../../src/app/stories/material-preview/material-preview';

const meta = {
  title: 'UI/Material/Checkbox', component: MaterialPreview,
  args: {"section":"checkbox","label":"Select product","disabled":false,"checked":false,"indeterminate":false},
  argTypes: { section: { table: { disable: true } } },
  parameters: { docs: { description: { component: "Isolated preview of the real Angular Material controls already used by production templates, with the application theme. MaterialPreview is a Storybook-only composition, not a second production implementation. " } } },
} satisfies Meta<MaterialPreview>;
export default meta;
type Story = StoryObj<MaterialPreview>;
export const Unchecked: Story = {};
export const Checked: Story = { args: {"checked":true} };
export const Indeterminate: Story = { args: {"indeterminate":true} };
export const Disabled: Story = { args: {"disabled":true,"checked":true} };
export const LongLabel: Story = { args: {"label":"Select this product and all available quantities in the current inventory"} };
