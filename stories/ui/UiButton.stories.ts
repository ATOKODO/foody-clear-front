import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { UiButton } from '../../src/app/ui/button/button';

const meta = {
  title: 'UI/Button', component: UiButton,
  args: { variant: 'primary', size: 'medium', type: 'button', disabled: false, loading: false, activated: fn() },
  render: args => ({ props: args, template: `<button appButton [variant]="variant" [size]="size" [type]="type" [disabled]="disabled" [loading]="loading" (activated)="activated($event)">Save</button>` }),
  parameters: { docs: { description: { component: 'Shared native button used throughout the application. Project content for labels/icons; retain native click, submit/reset, ARIA, dialog and focus behavior. Use plain for specialized layouts whose geometry is owned by the screen (calendar, navigation, selection cards and backdrops).' } } },
} satisfies Meta<UiButton>;
export default meta;
type Story = StoryObj<UiButton>;
export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Danger: Story = { args: { variant: 'danger' } };
export const Edit: Story = { args: { variant: 'edit' } };
export const Filled: Story = { args: { variant: 'filled' } };
export const Raised: Story = { args: { variant: 'raised' } };
export const Text: Story = { args: { variant: 'text' } };
export const Plain: Story = { args: { variant: 'plain' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
export const Small: Story = { args: { size: 'small' } };
export const Large: Story = { args: { size: 'large' } };
export const Icon: Story = {
  args: { variant: 'icon' },
  render: args => ({ props: args, template: `<button appButton variant="icon" [disabled]="disabled" [loading]="loading" aria-label="Add" (activated)="activated($event)"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>` }),
};
export const WithIcon: Story = {
  render: args => ({ props: args, template: `<button appButton [variant]="variant" [disabled]="disabled" [loading]="loading" (activated)="activated($event)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Add</button>` }),
};
export const LongLabel: Story = {
  render: args => ({ props: args, template: `<button appButton [variant]="variant" [disabled]="disabled" [loading]="loading" style="max-width: 18rem" (activated)="activated($event)">Save all selected products to the inventory</button>` }),
};
