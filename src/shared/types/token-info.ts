/**
 * TokenList types from FlowFans
 * https://github.com/FlowFans/flow-token-list/blob/main/src/lib/tokenlist.ts
 *
 * This is a copy of the TokenList types from FlowFans.
 * We need to keep this in sync with the FlowFans token list.
 */

export interface TokenList {
  readonly name: string;
  readonly logoURI: string;
  readonly tags: { [tag: string]: TagDetails };
  readonly timestamp: string;
  readonly tokens: TokenInfo[];
}

export interface TagDetails {
  readonly name: string;
  readonly description: string;
}

export interface PathDetail {
  readonly vault: string;
  readonly receiver: string;
  readonly balance: string;
}

export interface TokenExtensions {
  readonly website?: string;
  readonly documentation?: string;
  readonly bridgeContract?: string;
  readonly assetContract?: string;
  readonly address?: string;
  readonly explorer?: string;
  readonly twitter?: string;
  readonly github?: string;
  readonly medium?: string;
  readonly tgann?: string;
  readonly tggroup?: string;
  readonly discord?: string;
  readonly coingeckoId?: string;
  readonly imageUrl?: string;
  readonly description?: string;
}

export interface TokenInfo {
  readonly address: string;
  readonly name: string;
  readonly contractName: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly path: PathDetail;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: TokenExtensions;
}
