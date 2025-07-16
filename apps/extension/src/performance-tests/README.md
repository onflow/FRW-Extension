# Crypto Library Performance Benchmark

This benchmark compares the performance of various cryptographic libraries used in Web3 development, specifically for the Flow Reference Wallet use case.

## Libraries Tested

### 1. **TrustWallet Core** (v4.3.6)

- **Current Usage**: Used for key management, HD wallet operations, and signing in the Flow Reference Wallet
- **Language**: C++ with WebAssembly bindings
- **Bundle Size**: ~324KB (includes WASM)
- **Curves Supported**: P256 (NIST), secp256k1, ed25519
- **Pros**:
  - Native performance through WASM
  - Comprehensive crypto support (multiple curves, algorithms)
  - Battle-tested in Trust Wallet
  - Supports both P256 and secp256k1 curves
  - HD wallet support with BIP44 derivation
- **Cons**:
  - Large bundle size due to WASM
  - Complex setup (requires WASM file management)
  - Limited to crypto operations only
  - Heavier memory footprint

### 2. **Ethers.js** (v6.15.0)

- **Language**: TypeScript/JavaScript
- **Bundle Size**: ~284KB (gzipped)
- **Curves Supported**: secp256k1 only
- **Pros**:
  - Full Web3 ecosystem integration
  - Excellent TypeScript support
  - Comprehensive transaction handling
  - Rich ecosystem and documentation
  - HD wallet support with BIP44 derivation
- **Cons**:
  - Slower performance for pure crypto operations
  - Only supports secp256k1 (no P256)
  - Heavier for simple crypto operations
  - More memory usage

### 3. **Noble Curves** (v1.9.3)

- **Language**: TypeScript/JavaScript (pure JS implementation)
- **Bundle Size**: ~45KB (secp256k1), ~35KB (P256)
- **Curves Supported**: secp256k1, P256 (NIST), ed25519, and more
- **Pros**:
  - **Fastest performance** for crypto operations
  - Lightweight and modular
  - Pure JavaScript (no WASM)
  - Excellent TypeScript support
  - Supports both secp256k1 and P256 curves
  - Audited and secure
- **Cons**:
  - No HD wallet support built-in
  - Limited to crypto primitives only
  - No Web3 integration features

### 4. **Viem** (v2.21.54)

- **Language**: TypeScript/JavaScript
- **Bundle Size**: ~150KB (modular)
- **Curves Supported**: secp256k1 only
- **Pros**:
  - Modern Web3 library with excellent performance
  - Type-safe and modular
  - Great developer experience
  - Fast account operations
- **Cons**:
  - Only supports secp256k1 (no P256)
  - Limited crypto operations compared to others
  - No HD wallet support

## Test Operations

The benchmark tests the following operations across all supported libraries:

### Core Operations

1. **HD Wallet Generation** - Creating wallets from mnemonic phrases
2. **Key Derivation** - Deriving keys using BIP44 paths
3. **Signing** - Message signing with different curves
4. **Public Key Generation** - Generating public keys from private keys
5. **Signature Verification** - Verifying signatures
6. **Transaction Creation** - Creating transaction objects

### Curve-Specific Tests

- **P256 (NIST)**: TrustWallet Core, Noble P256
- **secp256k1**: All libraries support this curve

## Running the Benchmark

```bash
# Run the benchmark
pnpm benchmark:crypto

# The benchmark will test each library and display results
```

## Expected Results

Based on typical performance characteristics:

### Performance Ranking (fastest to slowest):

1. **Noble Curves** - Pure JS optimized implementations
2. **Viem** - Modern, optimized Web3 library
3. **TrustWallet Core** - WASM performance with some overhead
4. **Ethers.js** - Feature-rich but slower for pure crypto

### Memory Usage:

- **Noble Curves**: Lowest memory footprint
- **Viem**: Moderate memory usage
- **TrustWallet Core**: Higher due to WASM
- **Ethers.js**: Highest due to full Web3 features

## Recommendations

### For Flow Reference Wallet Use Case:

1. **If you need P256 support**:
   - **TrustWallet Core** (current) - Comprehensive but heavy
   - **Noble P256** - Lightweight and fast alternative

2. **For secp256k1 operations**:
   - **Noble secp256k1** - Best performance and smallest bundle
   - **Viem** - Good balance of features and performance

3. **For full Web3 integration**:
   - **Ethers.js** - Most comprehensive but slowest
   - **Viem** - Modern alternative with better performance

### Migration Strategy:

Consider a hybrid approach:

- Use **Noble Curves** for pure crypto operations (signing, verification)
- Keep **TrustWallet Core** for HD wallet generation and P256 support
- Use **Viem** for Web3 interactions where supported

This would optimize for both performance and bundle size while maintaining all required functionality.

## Bundle Size Impact

Switching from TrustWallet Core to Noble Curves could save ~280KB in bundle size:

- TrustWallet Core: ~324KB
- Noble secp256k1 + P256: ~80KB
- **Savings**: ~244KB (75% reduction)

However, you'd lose HD wallet functionality and would need to implement BIP44 derivation separately.
