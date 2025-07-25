// @ts-nocheck
// import { walletController } from './index';

export function serviceDefinition(address, keyId, type, network, opts = {}) {
  const definition = {
    f_type: 'Service',
    f_vsn: '1.0.0',
    type: type,
    uid: `fcw#${type}`,
    network: network || 'unknown',
    endpoint: 'chrome-extension://hpclkefagolihohboafpheddmmgdffjm/popup.html',
  };

  if (type === 'authn') {
    definition.id = address;
    definition.identity = {
      address: address,
    };
    definition.provider = {
      f_type: 'ServiceProvider', // Its a Service Provider
      f_vsn: '1.0.0', // Follows the v1.0.0 spec for service providers
      address: address, // A flow address owned by the wallet
      name: 'Flow Wallet', // OPTIONAL - The name of your wallet. ie: "Dapper Wallet" or "Blocto Wallet"
      icon: 'https://lilico.app/fcw-logo.png',
      description: 'A wallet created for everyone.',
    };
  }

  if (type === 'authz') {
    definition.method = 'EXT/RPC';
    definition.identity = {
      address: address,
      keyId: Number(keyId),
    };
  }

  if (type === 'pre-authz') {
    definition.method = 'EXT/RPC';
    definition.data = {
      address: address,
      keyId: Number(keyId),
    };
  }

  if (type === 'user-signature') {
    definition.method = 'EXT/RPC';
  }

  if (type === 'account-proof') {
    definition.method = 'EXT/RPC';
    definition.data = opts;
  }

  return definition;
}

export function preAuthzServiceDefinition(address, keyId, payerAddress, payerKeyId, network) {
  return {
    f_type: 'PreAuthzResponse',
    f_vsn: '1.0.0',
    proposer: serviceDefinition(address, keyId, 'authz', network),
    payer: [serviceDefinition(payerAddress, payerKeyId, 'authz', network)],
    authorization: [serviceDefinition(address, keyId, 'authz', network)],
  };
}

export async function authnServiceDefinition(
  address,
  keyId,
  payerAddress,
  payerKeyId,
  isEnabled = false,
  network
) {
  const services = [
    serviceDefinition(address, keyId, 'authn', network),
    serviceDefinition(address, keyId, 'authz', network),
    serviceDefinition(address, keyId, 'user-signature', network),
  ];

  // const isEnabled = await walletController.allowLilicoPay();
  if (isEnabled) {
    services.push(serviceDefinition(payerAddress, payerKeyId, 'pre-authz', network));
  }
  return services;
}
