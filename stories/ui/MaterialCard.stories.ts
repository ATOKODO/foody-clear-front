import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MaterialPreview } from '../../src/app/stories/material-preview/material-preview';

const meta = {
  title: 'UI/Material/Card', component: MaterialPreview,
  args: {"section":"card","label":"Daily summary","cardAppearance":"outlined","disabled":false},
  argTypes: { section: { table: { disable: true } } },
  parameters: { docs: { description: { component: "Isolated preview of the real Angular Material controls already used by production templates, with the application theme. MaterialPreview is a Storybook-only composition, not a second production implementation. " } } },
} satisfies Meta<MaterialPreview>;
export default meta;
type Story = StoryObj<MaterialPreview>;
export const Outlined: Story = {};
export const Raised: Story = { args: {"cardAppearance":"raised"} };
export const DisabledAction: Story = { args: {"disabled":true} };
export const LongTitle: Story = { args: {"label":"A detailed daily summary of consumed and planned nutrition values"} };
