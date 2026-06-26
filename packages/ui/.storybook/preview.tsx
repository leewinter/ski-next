import type { Preview } from '@storybook/react-vite';
import React from 'react';
import type { AppThemeMode } from '../src/providers/AppProvider';
import { AppProvider } from '../src/providers/AppProvider';

function getThemeMode(value: unknown): AppThemeMode {
  return value === 'dark' || value === 'compact' ? value : 'default';
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
    (Story, context) => {
      const themeMode = getThemeMode(context.globals.themeMode);

      return (
        <AppProvider themeMode={themeMode}>
          <Story />
        </AppProvider>
      );
    },
  ],
};

export default preview;
