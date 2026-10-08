import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiDisclosure } from '../../src/app/ui/disclosure/disclosure';
import { UiDisclosureSummary } from '../../src/app/ui/disclosure-summary/disclosure-summary';
import { UiCodePanel } from '../../src/app/ui/code-panel/code-panel';
import { UiButton } from '../../src/app/ui/button/button';

const meta = {
  title: 'UI/Disclosure', component: UiDisclosure,
  decorators: [moduleMetadata({ imports: [UiDisclosureSummary, UiCodePanel, UiButton] })],
  args: { appearance: 'inline' },
  render: args => ({ props: args, template: '<details appDisclosure [appearance]="appearance"><summary appDisclosureSummary>Inventory details</summary><p style="margin-top: var(--app-space-2)">Fridge: 400 g available.</p></details>' }),
  parameters: { docs: { description: { component: 'Presentation on the original native details element. Project an appDisclosureSummary as its first child, then owner content. Native open, toggle events, summary keyboard activation, marker and accessibility state remain browser-owned. Set open or bind [open] when the owner chooses an initial/programmatic state; there is no duplicate component state.' } } },
} satisfies Meta<UiDisclosure>;
export default meta;
type Story = StoryObj<UiDisclosure>;
export const Collapsed: Story = {};
export const Panel: Story = { args: { appearance: 'panel' } };
export const Expanded: Story = {
  render: args => ({ props: args, template: '<details appDisclosure [appearance]="appearance" open><summary appDisclosureSummary>Inventory details</summary><p style="margin-top: var(--app-space-2)">Fridge: 400 g available.</p></details>' }),
};
export const Diagnostic: Story = {
  render: args => ({ props: args, template: '<details appDisclosure [appearance]="appearance"><summary appDisclosureSummary emphasis="strong">Technical details</summary><pre appCodePanel wrap style="margin-top: var(--app-space-3)">Demo diagnostic data. No server request.</pre></details>' }),
};
export const WithAction: Story = {
  args: { appearance: 'panel' },
  render: args => ({ props: args, template: '<details appDisclosure [appearance]="appearance" open><summary appDisclosureSummary>JSON example</summary><pre appCodePanel style="margin-block: var(--app-space-3)">Demo product JSON.</pre><button appButton variant="secondary">Use this example</button></details>' }),
};
export const LongSummary: Story = {
  args: { appearance: 'panel' },
  render: args => ({ props: args, template: '<details appDisclosure [appearance]="appearance" style="max-width: 22rem"><summary appDisclosureSummary>Show the quantity available in each inventory before converting this planned item</summary><p>Fridge and pantry stock.</p></details>' }),
};
