import { applicationConfig, type Preview } from '@storybook/angular-vite';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';
import { Settings } from 'luxon';
import { provideStoryEnvironment } from '../stories/support/environment';
import { addons } from 'storybook/preview-api';
import { STORY_FINISHED, type StoryFinishedPayload } from 'storybook/internal/core-events';

// Canvas content can appear before a play function succeeds or throws. Expose
// Storybook's own completion result so browser coverage waits for interactions.
addons.getChannel().on(STORY_FINISHED, ({ storyId, status }: StoryFinishedPayload) => {
  const root = document.getElementById('storybook-root');
  root?.setAttribute('data-story-finished-id', storyId);
  root?.setAttribute('data-story-finished-status', status);
});

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
