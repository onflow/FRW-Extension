export type IExtractFromPromise<T> = T extends Promise<infer U> ? U : T;

export enum FCLWalletConnectMethod {
  preAuthz = 'flow_pre_authz',
  authn = 'flow_authn',
  authz = 'flow_authz',
  userSignature = 'flow_user_sign',
  accountProof = 'flow_account_proof',
  accountInfo = 'frw_account_info',
  addDeviceInfo = 'frw_add_device_key',
  proxysign = 'frw_proxy_sign',
  proxyaccount = 'frw_proxy_account',
}

// The initializer function can be converted into a function that takes a type and returns the corresponding enum value
export function getFCLWalletConnectMethod(type: FCLServiceType): FCLWalletConnectMethod | null {
  switch (type) {
    case FCLServiceType.preAuthz:
      return FCLWalletConnectMethod.preAuthz;
    case FCLServiceType.authn:
      return FCLWalletConnectMethod.authn;
    case FCLServiceType.authz:
      return FCLWalletConnectMethod.authz;
    case FCLServiceType.userSignature:
      return FCLWalletConnectMethod.userSignature;
    case FCLServiceType.accountProof:
      return FCLWalletConnectMethod.accountProof;
    default:
      return null;
  }
}

export enum FCLServiceType {
  authn = 'authn',
  authz = 'authz',
  accountProof = 'account-proof',
  preAuthz = 'pre-authz',
  userSignature = 'user-signature',
  backChannel = 'back-channel-rpc',
  localView = 'local-view',
  openID = 'open-id',
}
