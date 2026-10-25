import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiActionCard } from '../../src/app/ui/action-card/action-card';

const meta = {
  title: 'UI/Action card',
  component: UiActionCard,
  args: {
    icon: 'assignment',
    label: 'Cycle',
    title: 'Manage cycle',
    description: 'Add, change, or remove the active assignment for this date.',
    tone: 'accent',
    disabled: false,
  },
  argTypes: {
    icon: { control: 'select', options: ['assignment', 'day_entries', 'external_meal'] },
    tone: { control: 'select', options: ['accent', 'info', 'neutral'] },
  },
  parameters: {
    docs: { description: { component: 'Action-card composition with a native shared button, decorative leading/trailing icons and localized copy. The consumer owns the action handler; tone only changes the illustrative surface.' } },
  },
} satisfies Meta<UiActionCard>;
export default meta;
type Story = StoryObj<UiActionCard>;

export const Accent: Story = { args: { tone: 'accent', icon: 'assignment' } };
export const Info: Story = { args: { icon: 'day_entries', label: 'Day', title: 'Edit day', description: 'Open the entry editor directly for this date and time context.', tone: 'info' } };
export const Neutral: Story = { args: { icon: 'external_meal', label: 'External', title: 'Add external meal', description: 'Add an unplanned restaurant or meal entry with macros and spending, without inventory impact.', tone: 'neutral' } };
export const Disabled: Story = { args: { disabled: true } };
export const LongContent: Story = { args: { label: 'Selected date actions', title: 'Choose an action to manage this day', description: 'Long explanatory copy remains readable when a workflow option needs additional context and can wrap across multiple lines.' } };
