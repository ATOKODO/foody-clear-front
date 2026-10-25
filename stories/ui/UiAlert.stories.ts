import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiDisclosure } from '../../src/app/ui/disclosure/disclosure';
import { UiDisclosureSummary } from '../../src/app/ui/disclosure-summary/disclosure-summary';
import { UiAlert } from '../../src/app/ui/alert/alert';
import { UiButton } from '../../src/app/ui/button/button';
import { UiCodePanel } from '../../src/app/ui/code-panel/code-panel';

const meta = {
  title: 'UI/Alert', component: UiAlert,
  decorators: [moduleMetadata({ imports: [UiDisclosure, UiDisclosureSummary, UiButton, UiCodePanel] })],
  args: { tone: 'warning' },
  argTypes: { tone: { control: 'select', options: ['warning', 'error', 'info', 'success'] } },
  render: args => ({ props: args, template: '<p appAlert [tone]="tone">Some planned products are unavailable. Check your inventory.</p>' }),
  parameters: { docs: { description: { component: 'Shared notice surface on the original native element. Project translated text, titles and optional actions. Use role="status" for asynchronous information and role="alert" for urgent errors; static notices need neither. UiErrorPanel composes this component for API errors.' } } },
} satisfies Meta<UiAlert>;
export default meta;
type Story = StoryObj<UiAlert>;
export const Warning: Story = { args: { tone: 'warning' } };
export const Error: Story = { args: { tone: 'error' } };
export const Info: Story = { args: { tone: 'info' } };
export const Success: Story = { args: { tone: 'success' } };
export const WithAction: Story = {
  render: args => ({ props: args, template: '<section appAlert [tone]="tone"><div class="app-alert__copy"><h3 class="app-alert__title">Low stock</h3><p class="app-alert__message">Review quantities before planning the next day.</p></div><button appButton variant="secondary">Review inventory</button></section>' }),
};
export const WithDetails: Story = {
  args: { tone: 'error' },
  render: args => ({ props: args, template: '<section appAlert [tone]="tone" role="alert"><p class="app-alert__message">The request failed.</p><details appDisclosure class="app-alert__details"><summary appDisclosureSummary emphasis="strong">Technical details</summary><pre appCodePanel wrap>Demo diagnostic data. No real server request.</pre></details></section>' }),
};
export const LongMessage: Story = { render: args => ({ props: args, template: '<p appAlert [tone]="tone">The application is offline. Your current screen remains available, but searches and saves require a connection to the server. Check the connection and retry when it is available.</p>' }) };
