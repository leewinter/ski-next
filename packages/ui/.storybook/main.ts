// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from "node:module";
import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';
import type { PluginOption } from 'vite';

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [getAbsolutePath("@storybook/addon-docs")],

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  viteFinal: (config) => ({
    ...config,
    plugins: config.plugins?.filter((plugin) => !isDtsPlugin(plugin)),
  }),
};

function isDtsPlugin(plugin: PluginOption): boolean {
  if (!plugin || typeof plugin !== 'object' || Array.isArray(plugin)) {
    return false;
  }

  return 'name' in plugin && plugin.name === 'vite:dts';
}

export default config;
