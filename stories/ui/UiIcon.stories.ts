import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiIcon } from '../../src/app/ui/icon/icon';
import { UI_ICON_NAMES } from '../../src/app/ui/icon/glyphs';
import { UiButton } from '../../src/app/ui/button/button';

const meta = {
  title: 'UI/Icon', component: UiIcon,
  decorators: [moduleMetadata({ imports: [UiButton] })],
  args: { name: 'today', size: 'medium', label: '' },
  argTypes: { name: { control: 'select', options: UI_ICON_NAMES } },
  render: args => ({ props: args, template: '<app-icon [name]="name" [size]="size" [label]="label" />' }),
  parameters: { docs: { description: { component: 'The real local SVG glyphs used by the shell, calendar and planning actions. Decorative by default; provide a translated label only for a meaningful standalone image. An icon inside a named button stays decorative, so its glyph does not duplicate the button name. No font download, HTTP lookup or extra focus target. Size defaults to 24px and can follow owner geometry via CSS.' } } },
} satisfies Meta<UiIcon>;
export default meta;
type Story = StoryObj<UiIcon>;
export const Day: Story = { args: { name: 'today', size: 'medium' } };
export const Cycle: Story = { args: { name: 'autorenew' } };
export const Entry: Story = { args: { name: 'edit_note' } };
export const Menu: Story = { args: { name: 'menu' } };
export const Sun: Story = { args: { name: 'sun' } };
export const Moon: Story = { args: { name: 'moon' } };
export const Previous: Story = { args: { name: 'chevron_left' } };
export const Next: Story = { args: { name: 'chevron_right' } };
export const ActionArrow: Story = { args: { name: 'arrow_right' } };
export const Assignment: Story = { args: { name: 'assignment' } };
export const DayEntries: Story = { args: { name: 'day_entries' } };
export const ExternalMeal: Story = { args: { name: 'external_meal' } };
export const Add: Story = { args: { name: 'add' } };
export const Named: Story = { args: { name: 'today', label: 'Calendar day' } };
export const Small: Story = { args: { size: 'small' } };
export const Large: Story = { args: { size: 'large' } };
export const Button: Story = {
  args: { name: 'edit_note' },
  render: args => ({ props: args, template: '<button appButton variant="icon" aria-label="Edit entry"><app-icon [name]="name" [size]="size" /></button>' }),
};
