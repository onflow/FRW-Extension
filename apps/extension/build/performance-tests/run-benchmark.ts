#!/usr/bin/env ts-node

import { exec } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { CryptoLibraryBenchmark } from './crypto-libs-benchmark';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('='.repeat(60));
  console.log('CRYPTO LIBRARY PERFORMANCE BENCHMARK');
  console.log('='.repeat(60));
  console.log('');
  console.log('Testing libraries:');
  console.log('- TrustWallet Core v4.3.6');
  console.log('- Ethers.js v6.15.0');
  console.log('- Noble secp256k1 v1.7.2');
  console.log('- Noble P256 (NIST curves)');
  console.log('- Noble BIP32');
  console.log('- Viem (latest)');
  console.log('');
  console.log('Environment:', process.version);
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('');

  const benchmark = new CryptoLibraryBenchmark();

  try {
    await benchmark.runAllBenchmarks();

    // Open the visualization HTML file
    const htmlPath = path.join(__dirname, 'benchmark-visualization.html');
    console.log('\nOpening visualization in browser...');

    // Determine the command to open the file based on the platform
    let command: string;
    switch (os.platform()) {
      case 'darwin': // macOS
        command = `open "${htmlPath}"`;
        break;
      case 'win32': // Windows
        command = `start "${htmlPath}"`;
        break;
      default: // Linux and others
        command = `xdg-open "${htmlPath}"`;
        break;
    }

    exec(command, (error) => {
      if (error) {
        console.error('Failed to open visualization:', error.message);
        console.log(`Please open manually: ${htmlPath}`);
      } else {
        console.log('Visualization opened in browser!');
      }
    });
  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

main();
