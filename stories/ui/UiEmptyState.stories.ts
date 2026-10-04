import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiEmptyState } from '../../src/app/ui/empty-state/empty-state';
import { UiButton } from '../../src/app/ui/button/button';

const meta = {
  title: 'UI/Empty state', component: UiEmptyState,
  decorators: [moduleMetadata({ imports: [UiButton] })],
  args: { appearance: 'text', size: 'medium', tone: 'muted' },
  render: args => ({ props: args, template: '<p appEmptyState [appearance]="appearance" [size]="size" [tone]="tone">No products available.</p>' }),
  parameters: { docs: { description: { component: 'Projected empty-state copy on the original p/div. Text is compact contextual feedback; panel is an outlined state; large is a centered placeholder. Use a div for rich content/actions to preserve valid HTML. Owners translate the text and keep layout constraints; no automatic live announcement is added to static empty content.' } } },
} satisfies Meta<UiEmptyState>;
export default meta;
type Story = StoryObj<UiEmptyState>;
export const Text: Story = {};
export const Panel: Story = { args: { appearance: 'panel' } };
export const Large: Story = { args: { appearance: 'large' } };
export const Small: Story = { args: { appearance: 'panel', size: 'small' } };
export const Contextual: Story = { args: { tone: 'contextual' }, render: args => ({ props: args, template: '<div style="padding: 1rem; background: var(--app-info-bg); color: var(--app-info-text)"><p appEmptyState [tone]="tone" size="small">No logged entry in this slot.</p></div>' }) };
export const LongMessage: Story = { render: args => ({ props: args, template: '<p appEmptyState [appearance]="appearance" style="max-width: 24rem">No product matches your current search. Try a different product name or remove a filter to see available stock.</p>' }) };
export const WithAction: Story = { args: { appearance: 'large' }, render: args => ({ props: args, template: '<div appEmptyState [appearance]="appearance"><strong>No inventory available</strong><p>Create an inventory to track products.</p><button appButton variant="primary">Create inventory</button></div>' }) };
