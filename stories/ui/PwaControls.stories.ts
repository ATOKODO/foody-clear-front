import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { PwaControls } from '../../src/app/ui/pwa-controls/pwa-controls';
import { PwaService } from '../../src/services/pwa-service';
const meta = { title: 'UI/PWA controls', component: PwaControls, parameters: { docs: { description: { component: 'Manual installation instructions. The preview never installs an app or registers a service worker.' } } } } satisfies Meta<PwaControls>;
export default meta;
type Story = StoryObj<PwaControls>;
export const ManualInstructions: Story = {};
export const Installed: Story = {
  render: () => ({ template: '<p>The application is already installed: the install button is intentionally hidden.</p><app-pwa-controls />' }),
  decorators: [applicationConfig({ providers: [{ provide: PwaService, useValue: { installed: signal(true), installAvailable: signal(false), installing: signal(false), online: signal(true), updateAvailable: signal(false) } }] })],
};
