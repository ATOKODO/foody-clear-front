import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiDisclosure } from '../../src/app/ui/disclosure/disclosure';
import { UiDisclosureSummary } from '../../src/app/ui/disclosure-summary/disclosure-summary';

const meta = {
  title: 'UI/Disclosure summary', component: UiDisclosureSummary,
  decorators: [moduleMetadata({ imports: [UiDisclosure] })],
  args: { size: 'medium', emphasis: 'normal' },
  render: args => ({ props: args, template: '<details appDisclosure><summary appDisclosureSummary [size]="size" [emphasis]="emphasis">View details</summary><p>Projected inventory information.</p></details>' }),
  parameters: { docs: { description: { component: 'The native summary is the first child of appDisclosure, not a custom button wrapper. The browser owns focus, activation and expanded/collapsed semantics. Compact/normal sizing and normal/strong emphasis replace repeated utility classes; the shared focus ring supports keyboard review.' } } },
} satisfies Meta<UiDisclosureSummary>;
export default meta;
type Story = StoryObj<UiDisclosureSummary>;
export const Standard: Story = {};
export const Compact: Story = { args: { size: 'small' } };
export const Strong: Story = { args: { emphasis: 'strong' } };
export const RichLabel: Story = {
  render: args => ({ props: args, template: '<details appDisclosure><summary appDisclosureSummary [size]="size" [emphasis]="emphasis"><strong>Stock</strong> by inventory</summary><p>Fridge: 400 g.</p></details>' }),
};
