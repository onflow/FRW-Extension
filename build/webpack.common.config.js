const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TSConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ESLintWebpackPlugin = require('eslint-webpack-plugin');
// const tsImportPluginFactory = require('ts-import-plugin');
const AssetReplacePlugin = require('./plugins/AssetReplacePlugin');
const FirebaseFixPlugin = require('./plugins/FirebaseFixPlugin');
const { version } = require('../_raw/manifest.json');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const paths = require('./paths');

const config = {
  resolve: {
    fallback: {
      http: require.resolve('stream-http'),
    },
  },
  entry: {
    background: paths.rootResolve('src/background/index.ts'),
    'content-script': paths.rootResolve('src/content-script/index.ts'),
    pageProvider: paths.rootResolve('src/content-script/pageProvider/eth/index.ts'),
    // pageProvider: paths.rootResolve(
    //   'node_modules/@rabby-wallet/page-provider/dist/index.js'
    // ),
    ui: paths.rootResolve('src/ui/index.tsx'),
    script: paths.rootResolve('src/content-script/script.js'),
  },
  output: {
    path: paths.dist,
    filename: '[name].js',
    publicPath: '/',
  },
  experiments: {
    topLevelAwait: true,
    asyncWebAssembly: true,
    syncWebAssembly: true
  },
  module: {
    rules: [
      {
        test: /\.jsx?$|\.tsx?$/,
        exclude: /node_modules/,
        oneOf: [
          {
            // prevent webpack remove this file's output even it's not been used in entry
            sideEffects: true,
            test: /[\\/]pageProvider[\\/]index.ts/,
            loader: 'ts-loader',
          },
          {
            test: /[\\/]ui[\\/]index.tsx/,
            use: [
              {
                loader: 'ts-loader',
                options: {
                  transpileOnly: true,
                  compilerOptions: {
                    module: 'es2015',
                  },
                },
              },
            ],
          },
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'url-loader'],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      },
      // {
      //   test: /\.wasm$/,
      //   include: path.resolve(__dirname, 'node_modules/@trustwallet/wallet-core/dist/lib'),
      //   use: [{
      //     loader: 'file-loader',
      //     options: {
      //       name: '[name].[ext]',
      //       outputPath: '/',
      //     },
      //   }],
      //   type: 'javascript/auto',

      // },
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
        include: /node_modules/,
      },
      {
        test: /\.md$/,
        use: 'raw-loader',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'fonts/', // output folder for fonts
              name: '[name].[ext]', // keep the original file name
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new FirebaseFixPlugin(),
    new ESLintWebpackPlugin({
      extensions: ['ts', 'tsx', 'js', 'jsx'],
    }),
    new CopyPlugin({
      patterns: [
        { from: 'node_modules/@trustwallet/wallet-core/dist/lib/wallet-core.wasm', to: 'wallet-core.wasm' }
      ],
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.popupHtml,
      chunks: ['ui'],
      filename: 'popup.html',
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.notificationHtml,
      chunks: ['ui'],
      filename: 'notification.html',
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.indexHtml,
      chunks: ['ui'],
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.notificationHtml,
      chunks: ['background'],
      filename: 'background.html',
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process',
      dayjs: 'dayjs',
    }),
    // new AssetReplacePlugin({
    //   '#PAGEPROVIDER#': 'pageProvider',
    // }),
    new webpack.DefinePlugin({
      'process.env.version': JSON.stringify(`version: ${version}`),
      'process.env.release': JSON.stringify(version),
    }),

  ],
  resolve: {
    alias: {
      moment: require.resolve('dayjs'),
    },
    plugins: [new TSConfigPathsPlugin()],
    fallback: {
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      "fs": false,
      "fs/promises": false,
    },
    extensions: ['.js', 'jsx', '.ts', '.tsx'],
  },
  stats: 'minimal',
};

module.exports = config;
