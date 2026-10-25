import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '../../src/app/ui/button/button';
import { UiCalendarPanel } from '../../src/app/ui/calendar-panel/calendar-panel';

const meta = {
  title: 'UI/Calendar panel',
  component: UiCalendarPanel,
  decorators: [moduleMetadata({ imports: [UiButton] })],
  parameters: {
    docs: { description: { component: 'Shared year/month/week/day calendar surface. The component owns the themed background, border, radius, shadow and clipping; the calendar owner supplies view content, inner summary backgrounds and layout.' } },
  },
} satisfies Meta<UiCalendarPanel>;
export default meta;
type Story = StoryObj<UiCalendarPanel>;

export const YearOverview: Story = {
  render: () => ({ template: `
    <div style="max-width: 48rem; padding: 1rem">
      <div appCalendarPanel class="calendar-year-panel">
        <header style="padding: 1rem; border-bottom: 1px solid var(--app-border); background: var(--app-calendar-summary-bg)">
          <p style="margin: 0; color: var(--app-text-muted)">Year view</p>
          <h2 style="margin: 0.25rem 0 0; color: var(--app-text-strong)">March 2026</h2>
        </header>
        <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; padding: 1rem">
          <button appButton variant="secondary" type="button">January</button>
          <button appButton variant="secondary" type="button">February</button>
          <button appButton variant="primary" type="button">March</button>
          <button appButton variant="secondary" type="button">April</button>
        </div>
      </div>
    </div>
  ` }),
};

export const NarrowSurface: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => ({ template: `
    <div style="padding: 0.5rem">
      <div appCalendarPanel class="calendar-day-panel">
        <header style="padding: 0.75rem; border-bottom: 1px solid var(--app-border); background: var(--app-calendar-summary-bg)">
          <p style="margin: 0; color: var(--app-text-muted)">Day view</p>
          <h2 style="margin: 0.25rem 0 0; color: var(--app-text-strong)">Wednesday 25 March</h2>
        </header>
        <div style="padding: 0.75rem; color: var(--app-text)">The surface clips projected calendar content and keeps its compact viewport radius.</div>
      </div>
    </div>
  ` }),
};
