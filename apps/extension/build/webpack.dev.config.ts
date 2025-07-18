import CopyPlugin from 'copy-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import webpack from 'webpack';

// for extension local test, can build each time
const config: webpack.Configuration = {
  mode: 'development',
  devtool: 'inline-cheap-module-source-map',
  watch: true,
  cache: {
    type: 'filesystem' as const,
  },
  watchOptions: {
    ignored: ['**/public', '**/node_modules'],
    followSymlinks: false,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BUILD_ENV': JSON.stringify('DEV'),
    }),
    new Dotenv({
      path: '.env.dev',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: '_raw/react-devtools.js',
          to: 'react-devtools.js',
        },
      ],
    }),
  ],
  resolve: {
    fallback: {
      fs: false,
      vm: 'vm-browserify',
    },
  },
};

export default config;
