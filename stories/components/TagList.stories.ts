import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { TagList } from '../../src/components/tag/tag-list/tag-list';
import { listTags } from '../support/fixtures';

const meta = {
  title: 'Components/TagList',
  component: TagList,
  args: { addRequested: fn(), editRequested: fn(), deleteRequested: fn(), selected: fn(), selectedMany: fn(), tags: listTags, mode: 'manage' },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<TagList>;
export default meta;
type Story = StoryObj<TagList>;
export const Populated: Story = { args: { mode: 'manage' } };

export const Empty: Story = { args: { tags: [] } };
export const SingleSelection: Story = { args: { mode: 'select-single', selectedIds: ['1'] } };
export const MultipleSelection: Story = { args: { mode: 'select-multi', selectedIds: ['1'] } };
export const Embedded: Story = { args: { embedded: true } };
