import { applicationConfig, type Preview } from '@storybook/angular-vite';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';
import { Settings } from 'luxon';
import { provideStoryEnvironment } from '../stories/support/environment';

// Stable clock for the date-sensitive home, planning, calendar and statistics screens.
Settings.now = () => Date.parse('2026-03-25T12:00:00+01:00');
Settings.defaultZone = 'Europe/Paris';

const preview: Preview = {
  tags: ['autodocs'],
  initialGlobals: { theme: 'light', language: 'en' },
  globalTypes: {
    theme: { description: 'Application theme', toolbar: { icon: 'circlehollow', items: ['light', 'dark'], dynamicTitle: true } },
    language: { description: 'Application language', toolbar: { icon: 'globe', items: [{ value: 'en', title: 'English' }, { value: 'fr', title: 'Français' }], dynamicTitle: true } },
  },
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    viewport: { options: INITIAL_VIEWPORTS },
    options: { storySort: { order: ['Design system', 'UI', 'Components', 'Screens', 'Application'] } },
    a11y: { test: 'todo' },
  },
  decorators: [
    (story, context) => applicationConfig({ providers: provideStoryEnvironment(context) })(story, context),
  ],
};
export default preview;
