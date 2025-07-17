/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unused-imports/no-unused-vars */

import { p256 } from '@noble/curves/nist';
import { secp256k1 } from '@noble/curves/secp256k1';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import { initWasm as initTrustWallet } from '@trustwallet/wallet-core';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BenchmarkResult {
  library: string;
  operation: string;
  timeMs: number;
  gasEstimate?: number;
  memoryUsed?: number;
}

interface BenchmarkRun {
  timestamp: string;
  results: BenchmarkResult[];
  systemInfo: {
    platform: string;
    nodeVersion: string;
    arch: string;
  };
}

class CryptoLibraryBenchmark {
  private results: BenchmarkResult[] = [];

  async runAllBenchmarks() {
    console.log('Starting Crypto Library Performance Benchmarks...\n');

    // Run benchmarks for each library
    await this.benchmarkTrustWallet();
    await this.benchmarkEthers();
    await this.benchmarkNoble();
    await this.benchmarkNobleP256();
    await this.benchmarkNobleBip32();
    await this.benchmarkViem();

    // Display results
    this.displayResults();

    // Save results to JSON file
    await this.saveResults();

    return this.results;
  }

  private async measurePerformance(
    operation: string,
    library: string,
    fn: () => any | Promise<any>,
    iterations = 100
  ) {
    const startMemory = process.memoryUsage().heapUsed;

    // Warm up
    for (let i = 0; i < 10; i++) {
      await fn();
    }

    // Measure
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    const end = performance.now();

    const endMemory = process.memoryUsage().heapUsed;
    const avgTime = (end - start) / iterations;
    const memoryUsed = (endMemory - startMemory) / 1024 / 1024; // Convert to MB

    this.results.push({
      library,
      operation,
      timeMs: avgTime,
      memoryUsed,
    });

    console.log(`${library} - ${operation}: ${avgTime.toFixed(3)}ms (avg of ${iterations} runs)`);
  }

  private async benchmarkTrustWallet() {
    console.log('Benchmarking TrustWallet Core...');

    const testMnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const testMessage = 'Hello, World!';
    const derivationPath = "m/44'/539'/0'/0/0";

    // Initialize WASM
    const { HDWallet, Curve, Hash } = await initTrustWallet();

    // HD Wallet Generation
    await this.measurePerformance('HD Wallet Generation', 'TrustWallet', () => {
      const wallet = HDWallet.createWithMnemonic(testMnemonic, '');
      return wallet;
    });

    // Key Derivation - P256
    await this.measurePerformance('Key Derivation P256', 'TrustWallet', () => {
      const wallet = HDWallet.createWithMnemonic(testMnemonic, '');
      const privateKey = wallet.getKeyByCurve(Curve.nist256p1, derivationPath);
      return privateKey;
    });

    // Key Derivation - secp256k1
    await this.measurePerformance('Key Derivation secp256k1', 'TrustWallet', () => {
      const wallet = HDWallet.createWithMnemonic(testMnemonic, '');
      const privateKey = wallet.getKeyByCurve(Curve.secp256k1, derivationPath);
      return privateKey;
    });

    // Signing - P256
    await this.measurePerformance('Signing P256', 'TrustWallet', () => {
      const wallet = HDWallet.createWithMnemonic(testMnemonic, '');
      const privateKey = wallet.getKeyByCurve(Curve.nist256p1, derivationPath);
      const hash = Hash.sha256(Buffer.from(testMessage));
      const signature = privateKey.sign(hash, Curve.nist256p1);
      return signature;
    });

    // Signing - secp256k1
    await this.measurePerformance('Signing secp256k1', 'TrustWallet', () => {
      const wallet = HDWallet.createWithMnemonic(testMnemonic, '');
      const privateKey = wallet.getKeyByCurve(Curve.secp256k1, derivationPath);
      const hash = Hash.sha256(Buffer.from(testMessage));
      const signature = privateKey.sign(hash, Curve.secp256k1);
      return signature;
    });

    // Public Key Generation
    await this.measurePerformance('Public Key Generation', 'TrustWallet', () => {
      const wallet = HDWallet.createWithMnemonic(testMnemonic, '');
      const privateKey = wallet.getKeyByCurve(Curve.secp256k1, derivationPath);
      const publicKey = privateKey.getPublicKeySecp256k1(false);
      return publicKey;
    });
  }

  private async benchmarkEthers() {
    console.log('Benchmarking Ethers.js...');

    const testMnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const testMessage = 'Hello, World!';
    const testPrivateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    // HD Wallet Generation
    await this.measurePerformance('HD Wallet Generation', 'Ethers.js', () => {
      const wallet = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(testMnemonic));
      return wallet;
    });

    // Key Derivation
    await this.measurePerformance('Key Derivation', 'Ethers.js', () => {
      const mnemonic = ethers.Mnemonic.fromPhrase(testMnemonic);
      const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
      return wallet;
    });

    // Signing
    await this.measurePerformance('Signing', 'Ethers.js', () => {
      const wallet = new ethers.Wallet(testPrivateKey);
      const signature = wallet.signingKey.sign(ethers.keccak256(ethers.toUtf8Bytes(testMessage)));
      return signature;
    });

    // Public Key Generation
    await this.measurePerformance('Public Key Generation', 'Ethers.js', () => {
      const wallet = new ethers.Wallet(testPrivateKey);
      return wallet.signingKey.publicKey;
    });

    // Transaction Creation
    await this.measurePerformance('Transaction Creation', 'Ethers.js', () => {
      const wallet = new ethers.Wallet(testPrivateKey);
      const tx = {
        to: '0x742d35Cc6634C0532925a3b8D94d0c3F96e7d1c3',
        value: ethers.parseEther('1.0'),
        gasLimit: 21000,
        gasPrice: ethers.parseUnits('20', 'gwei'),
        nonce: 0,
      };
      return tx;
    });
  }

  private async benchmarkNoble() {
    console.log('Benchmarking Noble secp256k1...');

    const testMessage = 'Hello, World!';
    const testPrivateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    // Key Generation
    await this.measurePerformance('Key Generation', 'Noble secp256k1', () => {
      const privateKey = secp256k1.utils.randomPrivateKey();
      return privateKey;
    });

    // Signing
    await this.measurePerformance('Signing', 'Noble secp256k1', async () => {
      const msgHash = new TextEncoder().encode(testMessage);
      const signature = await secp256k1.sign(msgHash, testPrivateKey);
      return signature;
    });

    // Public Key Generation
    await this.measurePerformance('Public Key Generation', 'Noble secp256k1', () => {
      const publicKey = secp256k1.getPublicKey(testPrivateKey);
      return publicKey;
    });

    // Signature Verification
    await this.measurePerformance('Signature Verification', 'Noble secp256k1', async () => {
      const msgHash = new TextEncoder().encode(testMessage);
      const signature = await secp256k1.sign(msgHash, testPrivateKey);
      const publicKey = secp256k1.getPublicKey(testPrivateKey);
      const isValid = secp256k1.verify(signature, msgHash, publicKey);
      return isValid;
    });
  }

  private async benchmarkNobleP256() {
    console.log('Benchmarking Noble P256...');

    const testMessage = 'Hello, World!';
    const testPrivateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    // Key Generation
    await this.measurePerformance('Key Generation', 'Noble P256', () => {
      const privateKey = p256.utils.randomPrivateKey();
      return privateKey;
    });

    // Signing
    await this.measurePerformance('Signing', 'Noble P256', async () => {
      const msgHash = new TextEncoder().encode(testMessage);
      const signature = await p256.sign(msgHash, testPrivateKey);
      return signature;
    });

    // Public Key Generation
    await this.measurePerformance('Public Key Generation', 'Noble P256', () => {
      const publicKey = p256.getPublicKey(testPrivateKey);
      return publicKey;
    });

    // Signature Verification
    await this.measurePerformance('Signature Verification', 'Noble P256', async () => {
      const msgHash = new TextEncoder().encode(testMessage);
      const signature = await p256.sign(msgHash, testPrivateKey);
      const publicKey = p256.getPublicKey(testPrivateKey);
      const isValid = p256.verify(signature, msgHash, publicKey);
      return isValid;
    });
  }

  private async benchmarkNobleBip32() {
    console.log('Benchmarking Noble BIP32...');

    const testMnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const testMessage = 'Hello, World!';
    const derivationPath = "m/44'/539'/0'/0/0";

    // HD Wallet Generation
    await this.measurePerformance('HD Wallet Generation', 'Noble BIP32', () => {
      const seed = mnemonicToSeedSync(testMnemonic);
      const hdkey = HDKey.fromMasterSeed(seed);
      return hdkey;
    });

    // Key Derivation
    await this.measurePerformance('Key Derivation', 'Noble BIP32', () => {
      const seed = mnemonicToSeedSync(testMnemonic);
      const hdkey = HDKey.fromMasterSeed(seed);
      const derived = hdkey.derive(derivationPath);
      return derived;
    });

    // Signing (uses secp256k1 only)
    await this.measurePerformance('Signing', 'Noble BIP32', () => {
      const seed = mnemonicToSeedSync(testMnemonic);
      const hdkey = HDKey.fromMasterSeed(seed);
      const derived = hdkey.derive(derivationPath);
      // Create a proper 32-byte hash
      const msgHash = new Uint8Array(32);
      const msgBytes = new TextEncoder().encode(testMessage);
      msgHash.set(msgBytes.slice(0, 32));
      const signature = derived.sign(msgHash);
      return signature;
    });

    // Public Key Generation
    await this.measurePerformance('Public Key Generation', 'Noble BIP32', () => {
      const seed = mnemonicToSeedSync(testMnemonic);
      const hdkey = HDKey.fromMasterSeed(seed);
      const derived = hdkey.derive(derivationPath);
      return derived.publicKey;
    });

    // Signature Verification
    await this.measurePerformance('Signature Verification', 'Noble BIP32', () => {
      const seed = mnemonicToSeedSync(testMnemonic);
      const hdkey = HDKey.fromMasterSeed(seed);
      const derived = hdkey.derive(derivationPath);
      // Create a proper 32-byte hash
      const msgHash = new Uint8Array(32);
      const msgBytes = new TextEncoder().encode(testMessage);
      msgHash.set(msgBytes.slice(0, 32));
      const signature = derived.sign(msgHash);
      const isValid = derived.verify(msgHash, signature);
      return isValid;
    });
  }

  private async benchmarkViem() {
    console.log('Benchmarking Viem...');

    const testPrivateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    // Account Creation
    await this.measurePerformance('Account Creation', 'Viem', () => {
      const account = privateKeyToAccount(testPrivateKey);
      return account;
    });

    // Wallet Client Creation
    await this.measurePerformance('Wallet Client Creation', 'Viem', () => {
      const client = createWalletClient({
        chain: mainnet,
        transport: http(),
      });
      return client;
    });

    // Address Generation
    await this.measurePerformance('Address Generation', 'Viem', () => {
      const account = privateKeyToAccount(testPrivateKey);
      return account.address;
    });
  }

  private async saveResults() {
    const benchmarkRun: BenchmarkRun = {
      timestamp: new Date().toISOString(),
      results: this.results,
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        arch: process.arch,
      },
    };

    // Save to JSON file in the same directory
    const outputPath = path.join(__dirname, 'benchmark-results.json');

    try {
      // Read existing results if file exists
      let allRuns: BenchmarkRun[] = [];
      if (fs.existsSync(outputPath)) {
        const existingData = fs.readFileSync(outputPath, 'utf8');
        allRuns = JSON.parse(existingData);
      }

      // Add new run
      allRuns.push(benchmarkRun);

      // Keep only last 10 runs
      if (allRuns.length > 10) {
        allRuns = allRuns.slice(-10);
      }

      // Write back to file
      fs.writeFileSync(outputPath, JSON.stringify(allRuns, null, 2));
      console.log(`\nBenchmark results saved to: ${outputPath}`);

      // Also save a "latest" file for easy access by the visualization
      const latestPath = path.join(__dirname, 'benchmark-latest.json');
      fs.writeFileSync(latestPath, JSON.stringify(benchmarkRun, null, 2));
      console.log(`Latest results saved to: ${latestPath}`);
    } catch (error) {
      console.error('Error saving benchmark results:', error);
    }
  }

  private displayResults() {
    console.log('\n' + '='.repeat(80));
    console.log('BENCHMARK RESULTS SUMMARY');
    console.log('='.repeat(80));

    // Group by library
    const byLibrary = this.results.reduce(
      (acc, result) => {
        if (!acc[result.library]) acc[result.library] = [];
        acc[result.library].push(result);
        return acc;
      },
      {} as Record<string, BenchmarkResult[]>
    );

    Object.entries(byLibrary).forEach(([library, results]) => {
      console.log(`\n${library}:`);
      console.log('-'.repeat(library.length + 1));

      results.forEach((result) => {
        const memStr = result.memoryUsed ? ` (${result.memoryUsed.toFixed(2)}MB)` : '';
        console.log(`  ${result.operation}: ${result.timeMs.toFixed(3)}ms${memStr}`);
      });

      const avgTime = results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;
      const totalMemory = results.reduce((sum, r) => sum + (r.memoryUsed || 0), 0);
      console.log(`  Average: ${avgTime.toFixed(3)}ms (${totalMemory.toFixed(2)}MB total)`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('FASTEST BY OPERATION:');
    console.log('='.repeat(80));

    // Group by operation
    const byOperation = this.results.reduce(
      (acc, result) => {
        if (!acc[result.operation]) acc[result.operation] = [];
        acc[result.operation].push(result);
        return acc;
      },
      {} as Record<string, BenchmarkResult[]>
    );

    Object.entries(byOperation).forEach(([operation, results]) => {
      const fastest = results.reduce((min, r) => (r.timeMs < min.timeMs ? r : min));
      console.log(`${operation}: ${fastest.library} (${fastest.timeMs.toFixed(3)}ms)`);
    });
  }
}

export { CryptoLibraryBenchmark };
