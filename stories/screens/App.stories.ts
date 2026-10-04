import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { inject, provideAppInitializer } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '../../src/app/app';
const meta = {
  title: 'Application/Shell', component: App,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Complete shell, sidebar, theme and language controls. Navigation uses in-memory demo data only.' } } },
  decorators: [applicationConfig({ providers: [provideAppInitializer(() => inject(Router).navigateByUrl('/home'))] })],
} satisfies Meta<App>;
export default meta;
type Story = StoryObj<App>;
export const Home: Story = {};
