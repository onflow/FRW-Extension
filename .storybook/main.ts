import path from 'path';

import type { StorybookConfig } from '@storybook/react-webpack5';
import dotenv from 'dotenv';
import webpack from 'webpack';

import packageJson from '../package.json';
const { version } = packageJson;

dotenv.config({ path: ['.env.dev', '.env.pro', '.env.test'] });

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-webpack5-compiler-swc',
    '@storybook/addon-onboarding',
    '@storybook/addon-docs',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    // Ensure config.resolve and config.plugins are initialized
    config.resolve = config.resolve || {};
    config.plugins = config.plugins || [];

    config.resolve.alias = {
      ...config.resolve.alias,
      // Specific hook aliases first
      '@/ui/hooks/use-feature-flags$': path.resolve(
        __dirname,
        '../src/stories/use-feature-flags.mock.ts'
      ),
      '@/ui/hooks/use-account-hooks$': path.resolve(
        __dirname,
        '../src/stories/use-account-hooks.mock.ts'
      ),
      '@/ui/hooks/useNftHook$': path.resolve(__dirname, '../src/stories/use-nft-hooks.mock.ts'),
      '@/ui/hooks/useProfileHook$': path.resolve(
        __dirname,
        '../src/stories/useProfileHook.mock.ts'
      ),
      '@/ui/hooks/useNetworkHook$': path.resolve(
        __dirname,
        '../src/stories/useNetworkHook.mock.ts'
      ),
      // General hooks alias (fallback)
      '@/ui/hooks': path.resolve(__dirname, '../src/stories/ui-hooks.mock.ts'),
      // Other aliases
      '@/ui/utils/WalletContext': path.resolve(__dirname, '../src/stories/wallet-context.mock.ts'),
      'ui/utils$': path.resolve(__dirname, '../src/stories/ui-utils.mock.ts'),
      'react-router-dom': path.resolve(__dirname, '../src/stories/react-router-dom.mock.ts'),
      '@/ui/utils/WalletContext$': path.resolve(__dirname, '../src/stories/wallet-context.mock.ts'),
      '@': path.resolve(__dirname, '../src'),
      ui: path.resolve(__dirname, '../src/ui'),
      background: path.resolve(__dirname, '../src/background'),
      consts: path.resolve(__dirname, '../src/constant/index'),
    };

    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
        dayjs: 'dayjs',
      }),
      new webpack.DefinePlugin({
        'process.env.version': JSON.stringify(`version: ${version}`),
        'process.env.release': JSON.stringify(version),
      })
    );

    config.resolve.fallback = {
      ...config.resolve.fallback,
      process: require.resolve('process/browser'),
    };

    // START: -------- SVG and PNG Handling --------

    // Rule for SVGs
    // Find existing rule for SVGs (if any) and exclude it from handling SVGs that we want for @svgr/webpack
    const imageRule = config.module?.rules?.find(
      (rule) =>
        rule && typeof rule === 'object' && rule.test instanceof RegExp && rule.test.test('.svg')
    );
    if (imageRule && typeof imageRule === 'object') {
      imageRule.exclude = /\.svg$/;
    }

    config.module?.rules?.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            // You can add SVGR options here if needed
            // e.g., icon: true, dimensions: false,
            // To ensure the default export is the URL (content)
            exportType: 'named', // Keeps ReactComponent as named
            namedExport: 'ReactComponent',
            // svgo: false, // if you have issues with svgo, or want to configure it
          },
        },
        {
          loader: 'url-loader', // Or 'file-loader' or use asset modules for the default export (content)
          options: {
            limit: 8192, // Inline files smaller than 8kb as data URIs
            name: 'static/media/[name].[hash:8].[ext]',
          },
        },
      ],
      issuer: /\.(tsx|jsx|ts|js|mjs|mdx)$/, // Only apply to JS/TS/MDX files
    });

    // Rule for PNGs (and other images)
    // This is typically handled by Webpack 5's asset modules.
    // If not already present or if you need specific handling, you can add:
    // We'll ensure it doesn't clash with the SVG rule if it also matches .svg
    const hasPngRule = config.module?.rules?.some(
      (rule) =>
        rule && typeof rule === 'object' && rule.test instanceof RegExp && rule.test.test('.png')
    );

    if (!hasPngRule) {
      config.module?.rules?.push({
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: 'asset/resource', // Handles emitting the file and providing URL
        generator: {
          filename: 'static/media/[name].[hash:8].[ext]',
        },
      });
    }

    // END: -------- SVG and PNG Handling --------

    return config;
  },
};
export default config;
