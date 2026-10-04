import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiTableScroll } from '../../src/app/ui/table-scroll/table-scroll';
import { UiTable } from '../../src/app/ui/table/table';
import { UiTableCell } from '../../src/app/ui/table-cell/table-cell';

const meta = {
  title: 'UI/Table viewport', component: UiTableScroll,
  decorators: [moduleMetadata({ imports: [UiTable, UiTableCell] })],
  args: { label: 'Inventory products', outlined: true },
  render: args => ({ props: args, template: '<div appTableScroll [label]="label" [outlined]="outlined" style="max-width: 26rem"><table appTable style="min-width: 56rem"><thead><tr><th appTableCell scope="col">Product</th><th appTableCell scope="col">Inventory</th><th appTableCell scope="col">Quantity</th></tr></thead><tbody><tr><th appTableCell scope="row">Banana</th><td appTableCell>Fridge</td><td appTableCell>400 g</td></tr></tbody></table></div>' }),
  parameters: { docs: { description: { component: 'Labeled native region around a wide table. The viewport itself is keyboard focusable and scrollable; projected inputs/buttons retain their own focus targets. Content width belongs to the owner.' } } },
} satisfies Meta<UiTableScroll>;
export default meta;
type Story = StoryObj<UiTableScroll>;
export const Outlined: Story = {};
export const Unoutlined: Story = { args: { outlined: false } };
export const LongLabel: Story = { args: { label: 'Products and current quantities in the selected inventory' } };
