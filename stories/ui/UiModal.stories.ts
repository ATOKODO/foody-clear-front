import { UiButton } from '../../src/app/ui/button/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { UiModal } from '../../src/app/ui/modal/modal';
const meta = {
  title: 'UI/Modal',
  decorators: [moduleMetadata({ imports: [UiModal, UiButton] })],
  args: { open: false, disableClose: false, closed: fn() },
  render: args => ({ props: args, template: `
    <button appButton variant="plain" type="button" (click)="open = true">Open modal</button>
    @if (open) {
      <div class="app-modal-backdrop"></div><div class="app-modal-shell">
        <section class="app-modal-card" appModal aria-labelledby="story-modal-title" [appModalDisableClose]="disableClose" (appModalClose)="open = false; closed()">
          <header class="app-dialog-header"><h2 id="story-modal-title" class="app-dialog-title">Day entries</h2><button appButton variant="plain" type="button" (click)="open = false; closed()">Close</button></header>
          <div class="app-dialog-content"><p>Focus is trapped inside this dialog. Escape closes it and restores focus to the trigger.</p><label>Product <input value="Banane" /></label><button appButton variant="plain" type="button">Save</button></div>
        </section>
      </div>
    }
  ` }),
  parameters: { layout: 'fullscreen' },
} satisfies Meta<{ open: boolean; disableClose: boolean; closed: () => void }>;
export default meta;
type Story = StoryObj<{ open: boolean; disableClose: boolean; closed: () => void }>;
export const Interactive: Story = {};
export const DisableEscape: Story = { args: { disableClose: true } };
