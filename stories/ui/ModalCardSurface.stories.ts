import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { MatCardModule } from '@angular/material/card';
import { UiButton } from '../../src/app/ui/button/button';

const meta = {
  title: 'UI/Modal card surface',
  decorators: [moduleMetadata({ imports: [MatCardModule, UiButton] })],
  parameters: {
    docs: { description: { component: 'Catalog preview of the shared app-modal-card surface applied to Angular Material cards. The modal interaction directive and feature-specific sizing/layout are covered separately; this story focuses on the shared border, radius, surface, shadow and wide width.' } },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: () => ({ template: `
    <div class="app-modal-shell" style="position: relative; min-height: 28rem; background: var(--app-surface-soft)">
      <mat-card appearance="outlined" class="app-modal-card" style="padding: 1.25rem">
        <h2 style="margin: 0; color: var(--app-text-strong)">Edit inventory</h2>
        <p style="color: var(--app-text-muted)">A standard modal surface for focused forms and confirmation flows.</p>
        <button appButton variant="secondary" type="button">Cancel</button>
      </mat-card>
    </div>
  ` }),
};

export const Wide: Story = {
  render: () => ({ template: `
    <div class="app-modal-shell" style="position: relative; min-height: 32rem; background: var(--app-surface-soft)">
      <mat-card class="app-modal-card app-modal-card--wide" style="padding: 1.25rem">
        <h2 style="margin: 0; color: var(--app-text-strong)">Choose products</h2>
        <p style="color: var(--app-text-muted)">The wide variant accommodates richer picker content while preserving the shared modal surface.</p>
      </mat-card>
    </div>
  ` }),
};

export const LongContent: Story = {
  render: () => ({ template: `
    <div class="app-modal-shell" style="position: relative; min-height: 28rem; background: var(--app-surface-soft)">
      <mat-card appearance="outlined" class="app-modal-card" style="padding: 1.25rem">
        <h2 style="margin: 0; color: var(--app-text-strong)">Detailed item configuration</h2>
        <p style="color: var(--app-text-muted)">Long owner-provided content remains inside the scrollable modal card. The surface applies a maximum height and keeps overflow available without taking over the feature layout.</p>
        <p style="color: var(--app-text-muted)">Feature-specific forms, picker results and action footers retain their own spacing and responsive behavior.</p>
      </mat-card>
    </div>
  ` }),
};
