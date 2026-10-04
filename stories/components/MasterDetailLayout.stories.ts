import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MasterDetailLayout } from '../../src/components/shared/master-detail-layout/master-detail-layout';
const meta = {
  title: 'Components/Master detail layout', component: MasterDetailLayout,
  args: { sideTitle: 'Templates', sideSubtitle: 'Choose a template', sideAriaLabel: 'Templates', detailAriaLabel: 'Template details', sideWidth: '22rem' },
  render: args => ({ props: args, template: `<app-master-detail-layout [sideTitle]="sideTitle" [sideSubtitle]="sideSubtitle" [sideAriaLabel]="sideAriaLabel" [detailAriaLabel]="detailAriaLabel" [sideWidth]="sideWidth">
    <button side-actions type="button">Add</button><ul side-content><li>Breakfast</li><li>Lunch</li><li>Dinner</li></ul>
    <article detail-content><h2>Breakfast</h2><p>Banane · 120 g · 107 kcal</p><p>The sidebar stacks above the details on mobile.</p></article>
  </app-master-detail-layout>` }),
} satisfies Meta<MasterDetailLayout>;
export default meta;
type Story = StoryObj<MasterDetailLayout>;
export const Populated: Story = {};
export const WideSidebar: Story = { args: { sideWidth: '30rem' } };
