import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UiCalendarTag } from '../../src/app/ui/calendar-tag/calendar-tag';

const meta = {
  title: 'UI/Calendar tag', component: UiCalendarTag,
  args: { variant: 'meta', tone: 'neutral', context: 'surface', compact: false, value: null, label: 'Calendar metadata' },
  render: args => ({
    props: args,
    template: `<div [style.background]="context === 'on-color' || variant === 'assignment' ? 'var(--app-accent)' : null"
      [style.color]="context === 'on-color' || variant === 'assignment' ? 'var(--app-text-on-color)' : null" style="padding: 16px">
      <span appCalendarTag [variant]="variant" [tone]="tone" [context]="context" [compact]="compact" [value]="value" [label]="label">
        @if (value === null) { {{ label }} }
      </span>
    </div>`,
  }),
  parameters: { docs: { description: { component: 'Native calendar labels with the existing year/month/week/mobile geometries. Surface and on-color alert contexts, dense desktop chips, assignment and source labels retain their legacy palette and type. Owners supply translated copy, counts and business decisions. No automatic role, live region or focus target is added.' } } },
} satisfies Meta<UiCalendarTag>;
export default meta;
type Story = StoryObj<UiCalendarTag>;

export const YearFree: Story = { args: { variant: 'year-status', tone: 'neutral', label: 'Free' } };
export const YearActive: Story = { args: { variant: 'year-status', tone: 'active', label: 'Active' } };
export const YearCount: Story = { args: { variant: 'year-chip', value: 0, label: 'days' } };
export const YearCycles: Story = { args: { variant: 'year-chip', tone: 'accent', value: 3, label: 'cycles' } };
export const CurrentMonth: Story = { args: { variant: 'year-chip', tone: 'accent', label: 'Current month' } };
export const MonthToday: Story = { args: { variant: 'month-today', label: 'Today' } };
export const WeekToday: Story = { args: { variant: 'week-today', label: 'Today' } };
export const MobileToday: Story = { args: { variant: 'mobile-today', label: 'Today' } };
export const DaySet: Story = { args: { variant: 'chip', tone: 'dayset', label: 'Training day' } };
export const Target: Story = { args: { variant: 'chip', tone: 'target', label: 'Day set targets' } };
export const CompactChip: Story = { args: { variant: 'chip', tone: 'target', compact: true, label: 'Linked template' } };
export const Metadata: Story = { args: { variant: 'meta', label: '3 items' } };
export const SurfaceOver: Story = { args: { variant: 'alert', tone: 'over', context: 'surface', label: 'Over target' } };
export const SurfaceProjected: Story = { args: { variant: 'alert', tone: 'projected', context: 'surface', label: 'Projected' } };
export const SurfaceTemplate: Story = { args: { variant: 'alert', tone: 'template', context: 'surface', label: 'Template pending' } };
export const OnColorOver: Story = { args: { variant: 'alert', tone: 'over', context: 'on-color', label: 'Over target' } };
export const OnColorProjected: Story = { args: { variant: 'alert', tone: 'projected', context: 'on-color', label: 'Projected' } };
export const OnColorTemplate: Story = { args: { variant: 'alert', tone: 'template', context: 'on-color', label: 'Template pending' } };
export const CompactAlert: Story = { args: { variant: 'alert', tone: 'projected', compact: true, label: 'Projected' } };
export const Assignment: Story = { args: { variant: 'assignment', context: 'on-color', label: 'Training day' } };
export const Source: Story = { args: { variant: 'source', label: 'Slot target' } };
export const LongLabel: Story = { args: { variant: 'chip', tone: 'dayset', label: 'A longer day set title for the selected calendar assignment' } };
