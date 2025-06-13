import webpack from 'webpack';
import { merge } from 'webpack-merge';

import commonConfig from './build/webpack.common.config';
import dev from './build/webpack.dev.config';
import pro from './build/webpack.pro.config';

const configs: Record<'dev' | 'pro' | 'none', webpack.Configuration> = {
  dev,
  pro,
  none: {
    mode: 'development',
    devtool: false,
    cache: {
      type: 'filesystem',
    },
    performance: {
      maxEntrypointSize: 2500000,
      maxAssetSize: 2500000,
    },
    plugins: [
      // new BundleAnalyzerPlugin(),
      new webpack.DefinePlugin({
        'process.env.BUILD_ENV': JSON.stringify('DEV'),
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fallback: {
        buffer: 'buffer',
        url: 'url',
      },
    },
  },
};

const config = (
  env: { config: 'dev' | 'pro' | 'none' },
  _argv: unknown = {}
): webpack.Configuration => {
  if (env.config) {
    return merge(commonConfig(env), configs[env.config]);
  }

  return commonConfig(env);
};

export default config;
