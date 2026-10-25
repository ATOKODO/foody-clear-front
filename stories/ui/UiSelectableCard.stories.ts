import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { UiButton } from '../../src/app/ui/button/button';
import { UiSelectableCard } from '../../src/app/ui/selectable-card/selectable-card';
import { UiStatusBadge } from '../../src/app/ui/status-badge/status-badge';

const cardTemplate = `
  <div appSelectableCard [active]="active" (selectionRequested)="active = !active">
    <span selectable-card-content class="selectable-card-story__title">Inventory products</span>
    <span selectable-card-content class="selectable-card-story__meta">12 linked products</span>
    <span selectable-card-content appStatusBadge tone="success" size="card" appearance="soft">Stocked</span>
    <div selectable-card-actions class="selectable-card-story__actions">
      <button appButton variant="secondary" type="button">Edit</button>
      <button appButton variant="danger" type="button">Remove</button>
    </div>
  </div>`;

const meta = {
  title: 'UI/Selectable card',
  component: UiSelectableCard,
  decorators: [moduleMetadata({ imports: [UiButton, UiStatusBadge] })],
  args: { active: false },
  render: args => ({ props: args, template: cardTemplate }),
  parameters: {
    docs: { description: { component: 'Native selectable surface for management lists. The owner supplies the active state and projected title, metadata, status and native selection/actions. It adds no click handler, role, focus target or nested interactive semantics.' } },
  },
} satisfies Meta<UiSelectableCard>;
export default meta;
type Story = StoryObj<UiSelectableCard>;

export const Inactive: Story = {};
export const Active: Story = { args: { tone: 'success', active: true } };
export const AccentInactive: Story = { args: { tone: 'accent' } };
export const AccentActive: Story = { args: { tone: 'accent', active: true } };
export const SelectionDisabled: Story = {
  render: args => ({ props: args, template: cardTemplate.replace('[active]="active"', '[active]="active" [disabled]="true"') }),
};
export const LongContent: Story = {
  render: args => ({
    props: args,
    template: cardTemplate
      .replace('Inventory products', 'Seasonal ingredients currently assigned to the long-term household inventory')
      .replace('12 linked products', 'Twelve linked products across pantry, refrigerator and freezer locations'),
  }),
};
export const KeyboardSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selection = canvas.getByRole('button', { name: /Inventory products/ });
    await selection.focus();
    await expect(document.activeElement).toBe(selection);
    await userEvent.keyboard(' ');
    await expect(canvasElement.querySelector('[appSelectableCard]')?.classList.contains('app-selectable-card--active')).toBe(true);
    await expect(canvas.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Remove' })).toBeVisible();
  },
};
