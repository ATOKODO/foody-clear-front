import type { StorybookConfig } from '@storybook/angular-vite';
import { fileURLToPath } from 'node:url';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/angular-vite',
    options: { tsconfig: '.storybook/tsconfig.json', inlineStylesExtension: 'scss' },
  },
  staticDirs: ['../public'],
  core: { disableTelemetry: true },
  experimental_docgenProvider: (providers = []) => providers.map(provider =>
    provider.moduleSpecifier.includes('@storybook/angular-vite/')
      ? { ...provider, moduleSpecifier: fileURLToPath(new URL('./docgen-worker.mjs', import.meta.url)) }
      : provider),
  viteFinal: async config => {
    const { mergeConfig } = await import('vite');
    return mergeConfig(config, {
      resolve: { alias: [{ find: /^@zxing\/library$/, replacement: fileURLToPath(new URL('../node_modules/@zxing/library/cjs/index.js', import.meta.url)) }] },
    });
  },
};
export default config;
