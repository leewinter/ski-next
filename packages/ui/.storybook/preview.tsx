import type { Preview, StoryContext, StoryFn } from '@storybook/react';
import type {
  AppThemeMode,
  SupportedLanguage,
} from '../src/providers/AppProvider';
import { AppProvider } from '../src/providers/AppProvider';

function getThemeMode(value: unknown): AppThemeMode {
  return value === 'dark' || value === 'compact' ? value : 'default';
}

function getLanguage(value: unknown): SupportedLanguage {
  return value === 'fr' ? value : 'en';
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    language: {
      description: 'Locale',
      defaultValue: 'en',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'fr', title: 'French' },
        ],
        dynamicTitle: true,
      },
    },
    themeMode: {
      description: 'Ant Design theme',
      defaultValue: 'default',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Default' },
          { value: 'dark', title: 'Dark' },
          { value: 'compact', title: 'Compact' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story: StoryFn, context: StoryContext) => {
      const language = getLanguage(context.globals.language);
      const themeMode = getThemeMode(context.globals.themeMode);

      return (
        <AppProvider language={language} themeMode={themeMode}>
          <Story />
        </AppProvider>
      );
    },
  ],
};

export default preview;
