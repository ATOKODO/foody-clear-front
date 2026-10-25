import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UiTable } from '../../src/app/ui/table/table';
import { UiTableCell } from '../../src/app/ui/table-cell/table-cell';
import { UiTableScroll } from '../../src/app/ui/table-scroll/table-scroll';
import { UiEmptyState } from '../../src/app/ui/empty-state/empty-state';
import { UiButton } from '../../src/app/ui/button/button';
import { fn } from 'storybook/test';

const table = `<div appTableScroll label="Inventory products"><table appTable [density]="density" [layout]="layout">
  <caption>Current stock</caption><thead><tr><th appTableCell scope="col">Product</th><th appTableCell scope="col" contentAlign="end">Quantity</th></tr></thead>
  <tbody><tr><th appTableCell scope="row">Banana</th><td appTableCell contentAlign="end">400 g</td></tr><tr><th appTableCell scope="row">Oats</th><td appTableCell contentAlign="end">1 kg</td></tr></tbody>
</table></div>`;
const meta = {
  title: 'UI/Native table', component: UiTable,
  decorators: [moduleMetadata({ imports: [UiTableCell, UiTableScroll, UiEmptyState, UiButton, FormsModule, MatFormFieldModule, MatInputModule] })],
  args: { density: 'standard', layout: 'auto' },
  render: args => ({ props: args, template: table }),
  parameters: { docs: { description: { component: 'Shared native table presentation used by inventory, day input, templates and scanner. UiTableCell owns header/cell styles and inherits density through a CSS variable, including projected form controls. Keep native caption, th scope and colspan; row data, editing and selection remain with the owner. Use UiTableScroll for a labeled keyboard-scrollable viewport. Material tables retain their own library component.' } } },
} satisfies Meta<UiTable>;
export default meta;
type Story = StoryObj<UiTable>;
export const Standard: Story = { args: { density: 'standard', layout: 'auto' } };
export const Compact: Story = { args: { density: 'compact' } };
export const Comfortable: Story = { args: { density: 'comfortable' } };
export const FixedLayout: Story = { args: { layout: 'fixed' } };
export const Empty: Story = {
  render: args => ({ props: args, template: '<table appTable [density]="density"><thead><tr><th appTableCell scope="col">Product</th><th appTableCell scope="col">Quantity</th></tr></thead><tbody><tr><td appTableCell colspan="2"><p appEmptyState>No products available.</p></td></tr></tbody></table>' }),
};
export const Editable: Story = {
  render: args => ({ props: { ...args, quantity: 1, saved: fn() }, template: '<div appTableScroll label="Editable stock"><table appTable [density]="density"><thead><tr><th appTableCell scope="col">Product</th><th appTableCell scope="col">Quantity</th><th appTableCell scope="col">Action</th></tr></thead><tbody><tr><th appTableCell scope="row">Banana</th><td appTableCell><mat-form-field><mat-label>Quantity</mat-label><input matInput type="number" min="0" [(ngModel)]="quantity" /></mat-form-field></td><td appTableCell><button appButton variant="primary" (click)="saved(quantity)">Save</button></td></tr></tbody></table></div>' }),
};
export const DisabledAction: Story = {
  render: args => ({ props: args, template: '<table appTable [density]="density"><thead><tr><th appTableCell scope="col">Product</th><th appTableCell scope="col">Action</th></tr></thead><tbody><tr><th appTableCell scope="row">Banana</th><td appTableCell contentAlign="end"><button appButton variant="danger" disabled>Remove</button></td></tr></tbody></table>' }),
};
