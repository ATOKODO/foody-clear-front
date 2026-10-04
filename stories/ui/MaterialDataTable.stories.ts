import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MaterialPreview } from '../../src/app/stories/material-preview/material-preview';

const meta = {
  title: 'UI/Material/Data table', component: MaterialPreview,
  args: {"section":"table","label":"Inventory products","empty":false,"disabled":false},
  argTypes: { section: { table: { disable: true } } },
  parameters: { docs: { description: { component: "Isolated preview of the real Angular Material controls already used by production templates, with the application theme. MaterialPreview is a Storybook-only composition, not a second production implementation. " } } },
} satisfies Meta<MaterialPreview>;
export default meta;
type Story = StoryObj<MaterialPreview>;
export const Populated: Story = {};
export const Empty: Story = { args: {"empty":true} };
export const DisabledSelection: Story = { args: {"disabled":true} };
