export const INTERNAL_REQUEST_ORIGIN = 'https://core.flow.com';

export const INITIAL_OPENAPI_URL = process.env.API_GO_SERVER_URL!;

export const WEB_NEXT_URL = process.env.API_BASE_URL!;

export const EVM_ENDPOINT = {
  mainnet: 'https://mainnet.evm.nodes.onflow.org',
  testnet: 'https://testnet.evm.nodes.onflow.org',
};

export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
