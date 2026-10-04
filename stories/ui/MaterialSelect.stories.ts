import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MaterialPreview } from '../../src/app/stories/material-preview/material-preview';

const meta = {
  title: 'UI/Material/Select', component: MaterialPreview,
  args: {"section":"select","label":"Inventory","appearance":"fill","disabled":false,"invalid":false,"multiple":false,"empty":false},
  argTypes: { section: { table: { disable: true } } },
  parameters: { docs: { description: { component: "Isolated preview of the real Angular Material controls already used by production templates, with the application theme. MaterialPreview is a Storybook-only composition, not a second production implementation. Invalid stories use touched reactive form controls with real validators." } } },
} satisfies Meta<MaterialPreview>;
export default meta;
type Story = StoryObj<MaterialPreview>;
export const Single: Story = {};
export const Multiple: Story = { args: {"multiple":true} };
export const Disabled: Story = { args: {"disabled":true} };
export const Invalid: Story = { args: {"invalid":true} };
export const EmptyOptions: Story = { args: {"empty":true,"invalid":true} };
export const Outlined: Story = { args: {"appearance":"outline"} };
