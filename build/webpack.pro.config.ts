import Dotenv from 'dotenv-webpack';
import webpack from 'webpack';

const config: webpack.Configuration = {
  mode: 'production',
  devtool: false,
  cache: {
    type: 'filesystem' as const,
  },
  performance: {
    maxEntrypointSize: 2500000,
    maxAssetSize: 2500000,
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    new webpack.DefinePlugin({
      'process.env.BUILD_ENV': JSON.stringify('PRO'),
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new Dotenv({
      path: '.env.pro',
    }),
  ],
  resolve: {
    fallback: {
      buffer: 'buffer',
      url: 'url',
      vm: 'vm-browserify',
    },
  },
};

export default config;
