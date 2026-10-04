import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UiCodePanel } from '../../src/app/ui/code-panel/code-panel';

const meta = {
  title: 'UI/Code panel', component: UiCodePanel,
  args: { wrap: false },
  render: args => ({ template: '<pre appCodePanel [wrap]="wrap" aria-label="Product JSON">{{ code }}</pre>', props: { ...args, code: '{\n  "name": "Banana",\n  "quantityUnit": "g"\n}' } }),
  parameters: { docs: { description: { component: 'Focusable native preformatted content, shared by JSON previews and error diagnostics. Long code can be scrolled with the keyboard. The owner supplies a useful accessible label when needed; wrap breaks long lines without altering copied text.' } } },
} satisfies Meta<UiCodePanel>;
export default meta;
type Story = StoryObj<UiCodePanel>;
export const Json: Story = {};
export const Wrapped: Story = { args: { wrap: true } };
export const LongLine: Story = { render: args => ({ props: { ...args, code: 'A long demo diagnostic: ' + 'inventory/product/quantity/'.repeat(30) }, template: '<pre appCodePanel [wrap]="wrap" style="max-width: 28rem" aria-label="Diagnostic">{{ code }}</pre>' }) };
