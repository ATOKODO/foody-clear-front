import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiTableCell } from '../../src/app/ui/table-cell/table-cell';
import { UiTable } from '../../src/app/ui/table/table';

const meta = {
  title: 'UI/Table cell', component: UiTableCell,
  decorators: [moduleMetadata({ imports: [UiTable] })],
  args: { contentAlign: 'start' },
  render: args => ({ props: args, template: '<table appTable style="max-width: 28rem"><thead><tr><th appTableCell scope="col" [contentAlign]="contentAlign">Quantity</th></tr></thead><tbody><tr><td appTableCell [contentAlign]="contentAlign">400 g</td></tr></tbody></table>' }),
  parameters: { docs: { description: { component: 'Presentation on native th/td, without extra wrappers. Set scope="col" for column headers or scope="row" for row headers. Use the native colspan/rowspan attributes. Logical start/end alignment supports RTL.' } } },
} satisfies Meta<UiTableCell>;
export default meta;
type Story = StoryObj<UiTableCell>;
export const Start: Story = { args: { contentAlign: 'start' } };
export const Center: Story = { args: { contentAlign: 'center' } };
export const End: Story = { args: { contentAlign: 'end' } };
export const RowHeader: Story = { render: args => ({ props: args, template: '<table appTable><tbody><tr><th appTableCell scope="row" [contentAlign]="contentAlign">Product</th><td appTableCell>Banana</td></tr></tbody></table>' }) };
export const LongContent: Story = { render: args => ({ props: args, template: '<table appTable style="max-width: 24rem"><tbody><tr><td appTableCell [contentAlign]="contentAlign">A long product name with serving information and additional description for design-system layout review.</td></tr></tbody></table>' }) };
