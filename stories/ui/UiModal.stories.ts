import { UiButton } from '../../src/app/ui/button/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { UiModal } from '../../src/app/ui/modal/modal';
interface ModalStoryArgs { open: boolean; disableClose: boolean; closed: () => void; showAction: boolean }
const meta = {
  title: 'UI/Modal',
  decorators: [moduleMetadata({ imports: [UiModal, UiButton] })],
  args: { open: false, disableClose: false, closed: fn(), showAction: true },
  render: args => ({ props: args, template: `
    <button appButton variant="plain" type="button" (click)="open = true; showAction = true">Open modal</button>
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
} satisfies Meta<ModalStoryArgs>;
export default meta;
type Story = StoryObj<ModalStoryArgs>;
export const Interactive: Story = {};
export const DisableEscape: Story = { args: { disableClose: true } };

export const FocusAfterContentChange: Story = {
  render: args => ({ props: args, template: `
    <button appButton variant="plain" type="button" data-testid="modal-open" (click)="open = true; showAction = true">Open modal</button>
    @if (open) {
      <div class="app-modal-backdrop"></div><div class="app-modal-shell">
        <section class="app-modal-card" appModal aria-labelledby="story-modal-change-title" [appModalDisableClose]="disableClose" (appModalClose)="open = false; closed()">
          <h2 id="story-modal-change-title" class="app-dialog-title">Day entries</h2>
          @if (showAction) {
            <button appButton variant="secondary" type="button" data-testid="replace-focused-action" (click)="showAction = false">Open entry editor</button>
          } @else {
            <label>Product <input data-testid="replacement-editor-input" value="Banane" /></label>
          }
        </section>
      </div>
    }
  ` }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByTestId('modal-open');
    await userEvent.click(trigger);
    await userEvent.click(await canvas.findByTestId('replace-focused-action'));
    const replacement = await canvas.findByTestId('replacement-editor-input');
    await expect(document.activeElement).toBe(replacement);
    await userEvent.keyboard('{Escape}');
    await expect(document.activeElement).toBe(trigger);
  },
};
