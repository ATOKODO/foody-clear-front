import type { Meta, StoryObj } from '@storybook/angular-vite';
import { HttpErrorResponse } from '@angular/common/http';
import { UiErrorPanel } from '../../src/app/ui/error-panel/error-panel';
const meta = { title: 'UI/Error panel', component: UiErrorPanel, args: { error: new HttpErrorResponse({ status: 503, error: { message: 'Demo API unavailable' } }) } } satisfies Meta<UiErrorPanel>;
export default meta;
type Story = StoryObj<UiErrorPanel>;
export const ApiError: Story = {};
export const CustomMessage: Story = { args: { title: 'Request failed', message: 'Please retry after checking your connection.' } };
export const LongDetails: Story = { args: { error: { message: 'A long diagnostic response', details: Array.from({ length: 10 }, (_, i) => ({ line: i + 1, error: 'Invalid value' })) } } };
