import type { Meta, StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { TagForm } from '../../src/components/tag/tag-form/tag-form';
import { state } from '../support/fixtures';

const meta = {
  title: 'Components/TagForm',
  component: TagForm,
  args: { submitted: fn(), menuClicked: fn(), mode: 'add',  },
  parameters: { docs: { description: { component: 'Production component. Inputs are editable in Controls; outputs appear in Actions.' } } },
} satisfies Meta<TagForm>;
export default meta;
type Story = StoryObj<TagForm>;
export const Create: Story = {};

export const Edit: Story = { args: { mode: 'edit', tag: state.tags[0] } };
export const Saving: Story = { args: { mode: 'edit', tag: state.tags[0], saving: true } };
