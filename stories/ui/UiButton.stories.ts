import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { UiIcon } from '../../src/app/ui/icon/icon';
import { UiButton } from '../../src/app/ui/button/button';

const meta = {
  title: 'UI/Button', component: UiButton,
  decorators: [moduleMetadata({ imports: [UiIcon] })],
  args: { variant: 'primary', size: 'medium', type: 'button', disabled: false, loading: false, activated: fn() },
  render: args => ({ props: args, template: `<button appButton [variant]="variant" [size]="size" [type]="type" [disabled]="disabled" [loading]="loading" (activated)="activated($event)">Save</button>` }),
  parameters: { docs: { description: { component: 'Shared native button used throughout the application. Project content for labels/icons; retain native click, submit/reset, ARIA, dialog and focus behavior. Use plain for specialized layouts whose geometry is owned by the screen (calendar, navigation, selection cards and backdrops).' } } },
} satisfies Meta<UiButton>;
export default meta;
type Story = StoryObj<UiButton>;
export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Danger: Story = { args: { variant: 'danger' } };
export const Edit: Story = { args: { variant: 'edit' } };
export const EditSmall: Story = { args: { variant: 'edit', size: 'small' } };
export const Filled: Story = { args: { variant: 'filled' } };
export const Raised: Story = { args: { variant: 'raised' } };
export const Text: Story = { args: { variant: 'text' } };
export const Plain: Story = { args: { variant: 'plain' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
export const Small: Story = { args: { size: 'small' } };
export const Medium: Story = { args: { size: 'medium' } };
export const Large: Story = { args: { size: 'large' } };
export const ButtonType: Story = { args: { type: 'button' } };
export const SubmitType: Story = { args: { type: 'submit' } };
export const ResetType: Story = { args: { type: 'reset' } };
export const Icon: Story = {
  args: { variant: 'icon' },
  render: args => ({ props: args, template: `<button appButton variant="icon" [disabled]="disabled" [loading]="loading" aria-label="Add" (activated)="activated($event)"><app-icon name="add" /></button>` }),
};
export const WithIcon: Story = {
  render: args => ({ props: args, template: `<button appButton [variant]="variant" [disabled]="disabled" [loading]="loading" (activated)="activated($event)"><app-icon name="add" size="small" />Add</button>` }),
};
export const LongLabel: Story = {
  render: args => ({ props: args, template: `<button appButton [variant]="variant" [disabled]="disabled" [loading]="loading" style="max-width: 18rem" (activated)="activated($event)">Save all selected products to the inventory</button>` }),
};
