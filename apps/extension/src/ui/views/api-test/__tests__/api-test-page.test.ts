import { describe, expect, it } from 'vitest';

import { createTestGroups } from '@/extension-shared/utils/test-data/test-groups';

import methods from '../openapi-methods.json';

describe('ApiTestPage', () => {
  const dummyParams = {
    address: 'test-address',
    addressEvm: 'test-address-evm',
    network: 'test-network',
    username: 'test-user',
    token: 'test-token',
    password: 'test-password',
    mnemonicExisting: 'test-mnemonic',
    mnemonicGenerated: 'test-mnemonic-new',
    publicKey: {
      P256: { pubK: '', pk: '' },
      SECP256K1: { pubK: '', pk: '' },
    },
    deviceInfo: {
      device_id: 'test-device',
      district: '',
      name: 'Test Device',
      type: '2',
      user_agent: 'Test',
    },
  };

  it('includes all OpenAPI methods that call sendRequest or fetch in testGroups', () => {
    // Create test groups with dummy params

    const testGroups = createTestGroups(dummyParams);

    // Get all method names from openapi-methods.json
    const methodNames = new Set(
      methods
        .filter((method) => method.usesFetchDirectly || method.usesSendRequest)
        .map((method) => method.name)
    );

    // Get all method names from testGroups
    const testGroupMethodNames = new Set(
      Object.values(testGroups)
        .flat()
        .map((func) => func.name)
    );

    // Find methods that are in openapi-methods.json but not in testGroups
    const missingMethods = [...methodNames].filter((name) => !testGroupMethodNames.has(name));

    // Find methods that are in testGroups but not in openapi-methods.json
    const extraMethods = [...testGroupMethodNames].filter((name) => !methodNames.has(name));

    if (missingMethods.length > 0) {
      console.error('Methods missing from testGroups:', missingMethods);
    }

    if (extraMethods.length > 0) {
      console.warn(
        'Extra methods in testGroups that are not in openapi-methods.json:',
        extraMethods
      );
    }

    expect(missingMethods).toEqual([]);
    expect(extraMethods).toEqual([]);
  });

  it('includes all required parameters for each method', () => {
    const testGroups = createTestGroups(dummyParams);
    const flatTestGroups = Object.values(testGroups).flat();

    // Create a map of test methods and their parameters
    const testMethodParams = new Map(
      flatTestGroups.map((func) => [func.name, Object.keys(func.params || {})])
    );

    // Create a map of actual method parameters from openapi-methods.json
    const actualMethodParams = new Map(
      methods
        .filter((method) => method.usesFetchDirectly || method.usesSendRequest)
        .map((method) => [
          method.name,
          method.params
            .map((param) => param.trim())
            .map((param) => {
              // Remove type annotations and default values
              const cleanParam = param
                .split('=')[0] // Remove default value
                .split(':')[0] // Remove type annotation
                .trim();
              return cleanParam;
            }),
        ])
    );

    const parameterMismatches: { method: string; missing: string[]; extra: string[] }[] = [];

    // Check each method's parameters
    actualMethodParams.forEach((expectedParams, methodName) => {
      const testParams = testMethodParams.get(methodName) || [];

      // Find missing and extra parameters
      const missing = expectedParams.filter((param) => !testParams.includes(param));
      const extra = testParams.filter((param) => !expectedParams.includes(param));

      if (missing.length > 0 || extra.length > 0) {
        parameterMismatches.push({
          method: methodName,
          missing,
          extra,
        });
      }
    });

    if (parameterMismatches.length > 0) {
      console.error('Parameter mismatches found:');
      parameterMismatches.forEach(({ method, missing, extra }) => {
        console.error(`\nMethod: ${method}`);
        if (missing.length > 0) console.error('  Missing parameters:', missing);
        if (extra.length > 0) console.error('  Extra parameters:', extra);
        console.error('  Expected:', actualMethodParams.get(method));
        console.error('  Found:', testMethodParams.get(method));
      });
    }

    expect(parameterMismatches).toEqual([]);
  });
});
