import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MaterialPreview } from '../../src/app/stories/material-preview/material-preview';

const meta = {
  title: 'UI/Material/Text field', component: MaterialPreview,
  args: {"section":"field","label":"Product","value":"Banana","appearance":"fill","disabled":false,"invalid":false,"fieldType":"text"},
  argTypes: { section: { table: { disable: true } } },
  parameters: { docs: { description: { component: "Isolated preview of the real Angular Material controls already used by production templates, with the application theme. MaterialPreview is a Storybook-only composition, not a second production implementation. Invalid stories use touched reactive form controls with real validators." } } },
} satisfies Meta<MaterialPreview>;
export default meta;
type Story = StoryObj<MaterialPreview>;
export const Filled: Story = {};
export const Outlined: Story = { args: {"appearance":"outline"} };
export const Disabled: Story = { args: {"disabled":true} };
export const Invalid: Story = { args: {"invalid":true} };
export const NumberWithSuffix: Story = { args: {"fieldType":"number","value":"250","label":"Quantity"} };
export const Textarea: Story = { args: {"fieldType":"textarea","label":"Notes","value":"Store in a cool place."} };
export const NativeDate: Story = { args: {"fieldType":"date","label":"Date","value":"2026-03-25"} };
export const NativeTime: Story = { args: {"fieldType":"time","label":"Time","value":"08:30"} };
export const NativeDateTime: Story = { args: {"fieldType":"datetime-local","label":"Consumed at","value":"2026-03-25T08:30"} };
export const LongLabel: Story = { args: {"label":"A descriptive label for the selected product and its serving information"} };
