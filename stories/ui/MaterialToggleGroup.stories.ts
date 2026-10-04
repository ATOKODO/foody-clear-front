import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MaterialPreview } from '../../src/app/stories/material-preview/material-preview';

const meta = {
  title: 'UI/Material/Toggle group', component: MaterialPreview,
  args: {"section":"toggle","label":"Calendar view","multiple":false,"disabled":false},
  argTypes: { section: { table: { disable: true } } },
  parameters: { docs: { description: { component: "Isolated preview of the real Angular Material controls already used by production templates, with the application theme. MaterialPreview is a Storybook-only composition, not a second production implementation. " } } },
} satisfies Meta<MaterialPreview>;
export default meta;
type Story = StoryObj<MaterialPreview>;
export const Single: Story = {};
export const Multiple: Story = { args: {"multiple":true} };
export const Disabled: Story = { args: {"disabled":true} };
