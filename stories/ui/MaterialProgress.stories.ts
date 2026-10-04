import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MaterialPreview } from '../../src/app/stories/material-preview/material-preview';

const meta = {
  title: 'UI/Material/Progress', component: MaterialPreview,
  args: {"section":"progress","label":"Loading products","progressMode":"indeterminate"},
  argTypes: { section: { table: { disable: true } } },
  parameters: { docs: { description: { component: "Isolated preview of the real Angular Material controls already used by production templates, with the application theme. MaterialPreview is a Storybook-only composition, not a second production implementation. " } } },
} satisfies Meta<MaterialPreview>;
export default meta;
type Story = StoryObj<MaterialPreview>;
export const Indeterminate: Story = {};
export const Determinate: Story = { args: {"progressMode":"determinate"} };
export const Buffer: Story = { args: {"progressMode":"buffer"} };
export const Query: Story = { args: {"progressMode":"query"} };
