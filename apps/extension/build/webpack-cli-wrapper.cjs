#!/usr/bin/env node

// Set environment variables for ts-node
process.env.TS_NODE_PROJECT = 'tsconfig.node.json';

// Run webpack-cli with ts-node/esm loader
require('child_process')
  .spawn(
    'node',
    [
      '--loader',
      'ts-node/esm',
      require.resolve('webpack-cli/bin/cli.js'),
      ...process.argv.slice(2),
    ],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        TS_NODE_PROJECT: 'tsconfig.node.json',
      },
    }
  )
  .on('exit', (code) => process.exit(code || 0));
