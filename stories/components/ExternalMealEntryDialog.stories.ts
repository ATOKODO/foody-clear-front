import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { fn } from 'storybook/test';
import { ExternalMealEntryDialog } from '../../src/components/external-meal-entry/external-meal-entry-dialog';
import { day } from '../support/fixtures';
const meta = {
  title: 'Components/External meal entry dialog', component: ExternalMealEntryDialog,
  decorators: [applicationConfig({ providers: [
    { provide: MAT_DIALOG_DATA, useValue: { dateLocal: '2026-03-25', occurredAt: '2026-03-25T12:00:00+01:00', timezone: 'Europe/Paris', slots: day.daySet?.slots ?? [] } },
    { provide: MatDialogRef, useValue: { close: fn() } },
  ] })],
  parameters: { docs: { description: { component: 'External meal form with date and slot context. Save uses the isolated API; cancel/close is recorded in Actions.' } } },
} satisfies Meta<ExternalMealEntryDialog>;
export default meta;
type Story = StoryObj<ExternalMealEntryDialog>;
export const Create: Story = {};
