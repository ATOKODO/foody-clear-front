import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiRaisedPanel } from '../../src/app/ui/raised-panel/raised-panel';

const meta = {
  title: 'UI/Raised panel',
  component: UiRaisedPanel,
  parameters: {
    docs: { description: { component: 'Raised themed surface shared by the home dashboard header and content panels. It owns border, radius, background and shadow; consumers own semantic host, layout, padding and content.' } },
  },
} satisfies Meta<UiRaisedPanel>;
export default meta;
type Story = StoryObj<UiRaisedPanel>;

export const HeaderSurface: Story = {
  render: () => ({ template: `
    <header appRaisedPanel style="display: flex; align-items: end; justify-content: space-between; gap: 1rem; padding: 1.15rem">
      <div><p style="margin: 0; color: var(--app-text-muted)">TODAY</p><h2 style="margin: 0.25rem 0 0; color: var(--app-text-strong)">Dashboard overview</h2></div>
      <span style="color: var(--app-text-muted)">Sunday, October 25</span>
    </header>
  ` }),
};

export const ContentPanel: Story = {
  render: () => ({ template: `
    <article appRaisedPanel style="max-width: 34rem; padding: 1rem">
      <h2 style="margin: 0; color: var(--app-text-strong)">Today's progress</h2>
      <p style="margin: 0.35rem 0 0; color: var(--app-text-muted)">Longer owner-provided descriptions remain readable inside the shared raised surface.</p>
    </article>
  ` }),
};
