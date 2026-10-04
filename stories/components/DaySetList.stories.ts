import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { DaySetList } from '../../src/components/day-set/day-set-list/day-set-list';
import { listDaySets } from '../support/fixtures';

const meta = {
  title: 'Components/DaySetList',
  component: DaySetList,
  args: { addRequested: fn(), editRequested: fn(), deleteRequested: fn(), selected: fn(), selectedMany: fn(), daySets: listDaySets, mode: 'manage' },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<DaySetList>;
export default meta;
type Story = StoryObj<DaySetList>;
export const Populated: Story = {};

export const Empty: Story = { args: { daySets: [] } };
export const SingleSelection: Story = { args: { mode: 'select-single', selectedIds: ['1'] } };
export const MultipleSelection: Story = { args: { mode: 'select-multi', selectedIds: ['1'] } };
export const Embedded: Story = { args: { embedded: true } };
