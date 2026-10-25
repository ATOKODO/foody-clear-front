import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '../../src/app/ui/button/button';
import { UiWorkspaceCard } from '../../src/app/ui/workspace-card/workspace-card';

const meta = {
  title: 'UI/Workspace card',
  component: UiWorkspaceCard,
  decorators: [moduleMetadata({ imports: [UiButton] })],
  parameters: {
    docs: { description: { component: 'Neutral solid workspace surface shared by inventory, meal-prep and shopping-list details/editors. The component owns border, radius and background only; owners provide padding, layout, content and interaction.' } },
  },
} satisfies Meta<UiWorkspaceCard>;
export default meta;
type Story = StoryObj<UiWorkspaceCard>;

export const DetailSurface: Story = {
  render: () => ({ template: `
    <div style="max-width: 34rem; padding: 1rem; background: var(--app-surface-soft)">
      <div appWorkspaceCard style="display: grid; gap: 0.75rem; padding: 0.875rem">
        <div><h3 style="margin: 0; color: var(--app-text-strong)">Current stock</h3><p style="margin: 0.25rem 0 0; color: var(--app-text-muted)">Read-only details with owner-managed layout and copy.</p></div>
        <button appButton variant="secondary" type="button">Edit quantities</button>
      </div>
    </div>
  ` }),
};

export const LongContent: Story = {
  render: () => ({ template: `
    <div style="max-width: 34rem; padding: 1rem; background: var(--app-surface-soft)">
      <section appWorkspaceCard style="display: grid; gap: 0.75rem; padding: 0.875rem">
        <h3 style="margin: 0; color: var(--app-text-strong)">Pantry and freezer inventory details</h3>
        <p style="margin: 0; color: var(--app-text-muted)">This shared surface contains long owner-provided descriptions and keeps its neutral background, border and rounded corners without taking ownership of the content layout.</p>
      </section>
    </div>
  ` }),
};
