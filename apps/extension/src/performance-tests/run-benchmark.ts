#!/usr/bin/env ts-node
/* eslint-disable no-console */

import { CryptoLibraryBenchmark } from './crypto-libs-benchmark';

async function main() {
  console.log('='.repeat(60));
  console.log('CRYPTO LIBRARY PERFORMANCE BENCHMARK');
  console.log('='.repeat(60));
  console.log('');
  console.log('Testing libraries:');
  console.log('- TrustWallet Core v4.3.6');
  console.log('- Ethers.js v6.15.0');
  console.log('- Noble secp256k1 v1.7.2');
  console.log('- Viem (latest)');
  console.log('');
  console.log('Environment:', process.version);
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('');

  const benchmark = new CryptoLibraryBenchmark();

  try {
    await benchmark.runAllBenchmarks();
  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
