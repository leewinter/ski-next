import storybook from 'eslint-plugin-storybook';

import { reactConfig } from '@ski-next/eslint-config';

export default [
  ...reactConfig,
  ...storybook.configs['flat/recommended'],
];
