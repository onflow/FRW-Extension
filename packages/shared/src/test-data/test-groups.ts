import HDWallet from 'ethereum-hdwallet';

import {
  HASH_ALGO_NUM_SHA2_256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
} from '@/shared/constant/algo-constants';

import { type ApiTestResult, type ApiTestResults } from './api-test-results';

export interface ApiTestFunction {
  name: string;
  controlledBy?: ApiTestFunction[]; // if set we may need to go through wallet service
  params: Record<string, unknown>;
  unused?: boolean;
}

export interface ApiTestGroups {
  [key: string]: ApiTestFunction[];
}

export interface CommonParams {
  address: string;
  addressEvm: string;
  network: string;
  username: string;
  token: string;
  password: string;
  mnemonicExisting: string;
  mnemonicGenerated: string;
  publicKey: {
    P256: {
      pubK: string;
      pk?: string;
    };
    SECP256K1: {
      pubK: string;
      pk?: string;
    };
  };
  deviceInfo: {
    device_id: string;
    district: string;
    name: string;
    type: string;
    user_agent: string;
  };
}
const getFrontEndAccountKey = (mnemonic: string) => {
  const hdwallet = HDWallet.fromMnemonic(mnemonic);
  const publicKey = hdwallet.derive("m/44'/539'/0'/0/0").getPublicKey().toString('hex');

  return {
    hashAlgo: HASH_ALGO_NUM_SHA2_256,
    signAlgo: SIGN_ALGO_NUM_ECDSA_secp256k1,
    weight: 1000,
    publicKey,
  };
};
export const createTestGroups = (commonParams: CommonParams): ApiTestGroups => {
  const accountKey = getFrontEndAccountKey(commonParams.mnemonicExisting);
  const generatedAccountKey = getFrontEndAccountKey(commonParams.mnemonicGenerated);

  return {
    core: [{ name: 'sendRequest', params: { method: 'GET', url: '', params: {} } }],
    authentication: [
      { name: 'checkUsername', params: { username: commonParams.username } },
      {
        name: 'register',
        params: { account_key: generatedAccountKey, username: commonParams.username },
      },
      {
        name: 'loginV3',
        params: {
          account_key: accountKey,
          device_info: commonParams.deviceInfo,
          signature: '',
          replaceUser: true,
        },
        controlledBy: [
          {
            name: 'unlock',
            params: { password: commonParams.password },
          },
        ],
      },
      {
        name: 'importKey',
        params: {
          account_key: generatedAccountKey,
          device_info: commonParams.deviceInfo,
          username: commonParams.username,
          backup_info: {},
          address: commonParams.address,
          replaceUser: true,
        },
      },
    ],
    prices: [
      { name: 'getUSDCPrice', params: { provider: 'binance' } },
      { name: 'getTokenPrice', params: { token: 'flow', provider: 'binance' } },
      {
        name: 'getTokenPriceHistoryArray',
        params: { token: 'flow', period: 'oneDay', provider: 'binance' },
      },
    ],
    user: [
      { name: 'coinMap', params: {} },
      { name: 'userInfo', params: {} },
      { name: 'searchUser', params: { keyword: 'webdev18_862' } },
      { name: 'checkImport', params: { key: 'test' } },
      { name: 'getSupportedCurrencies', params: {} },
      {
        name: 'getAccountsWithPublicKey',
        params: { publicKey: commonParams.publicKey.P256.pubK, network: commonParams.network },
      },
    ],
    wallet: [{ name: 'createFlowAddress', params: {} }],
    device: [
      { name: 'getManualAddress', params: {} },
      {
        name: 'synceDevice',
        params: { params: { account_key: accountKey, device_info: commonParams.deviceInfo } },
      },
      { name: 'deviceList', params: {} },
      { name: 'keyList', params: {} },
      { name: 'getLocation', params: {} },
      {
        name: 'addDevice',
        params: { params: { wallet_id: '', device_info: commonParams.deviceInfo } },
      },
    ],
    fetch: [
      {
        name: 'fetchFTList',
        params: { network: commonParams.network, chainType: 'flow' },
      },
      { name: 'getNFTList', params: { network: commonParams.network, chainType: 'flow' } },
    ],
    tokens: [
      {
        name: 'getUserTokens',
        params: { address: commonParams.address, network: 'mainnet' },
      },
      {
        name: 'getUserTokens',
        params: { address: commonParams.addressEvm, network: 'mainnet' },
      },
    ],
    approval: [
      {
        name: 'signPayer',
        controlledBy: [
          {
            name: 'sendTransaction',
            params: {
              cadence: `import FungibleToken from 0xa0225e7000ac82a9
    import FlowToken from 0x4445e7ad11568276
    import EVM from 0xb6763b4399a888c8

    transaction() {
        let auth: auth(IssueStorageCapabilityController, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account

        prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
            let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                    from: /storage/flowTokenVault
                ) ?? panic("Could not borrow reference to the owner's Vault!")

            self.auth = signer
        }

        execute {
            let coa <- EVM.createCadenceOwnedAccount()
            let storagePath = StoragePath(identifier: "evm")!
            let publicPath = PublicPath(identifier: "evm")!
            self.auth.storage.save<@EVM.CadenceOwnedAccount>(<-coa, to: storagePath)
            let addressableCap = self.auth.capabilities.storage.issue<&EVM.CadenceOwnedAccount>(storagePath)
            self.auth.capabilities.unpublish(publicPath)
            self.auth.capabilities.publish(addressableCap, at: publicPath)
        }
    }`,
              args: [],
            },
          },
        ],
        params: {
          transaction: {
            cadence:
              '// Flow Wallet - testnet Script  callContract - v2.48\n// Extension-2.6.6\n\nimport FungibleToken from 0x9a0766d93b6608b7\nimport FlowToken from 0x7e60df042a9c0868\nimport EVM from 0x8c5303eaa26202d6\n\n/// Transfers $FLOW from the signer\'s account Cadence Flow balance to the recipient\'s hex-encoded EVM address.\n/// Note that a COA must have a $FLOW balance in EVM before transferring value to another EVM address.\n///\ntransaction(toEVMAddressHex: String, amount: UFix64, data: [UInt8], gasLimit: UInt64) {\n\n    let coa: auth(EVM.Withdraw, EVM.Call) &EVM.CadenceOwnedAccount\n    let recipientEVMAddress: EVM.EVMAddress\n\n    prepare(signer: auth(BorrowValue, SaveValue) &Account) {\n        if signer.storage.type(at: /storage/evm) == nil {\n            signer.storage.save(<-EVM.createCadenceOwnedAccount(), to: /storage/evm)\n        }\n        self.coa = signer.storage.borrow<auth(EVM.Withdraw, EVM.Call) &EVM.CadenceOwnedAccount>(from: /storage/evm)\n            ?? panic("Could not borrow reference to the signer\'s bridged account")\n\n        self.recipientEVMAddress = EVM.addressFromString(toEVMAddressHex)\n    }\n\n    execute {\n        if self.recipientEVMAddress.bytes == self.coa.address().bytes {\n            return\n        }\n        let valueBalance = EVM.Balance(attoflow: 0)\n        valueBalance.setFLOW(flow: amount)\n        let txResult = self.coa.call(\n            to: self.recipientEVMAddress,\n            data: data,\n            gasLimit: gasLimit,\n            value: valueBalance\n        )\n        assert(\n            txResult.status == EVM.Status.failed || txResult.status == EVM.Status.successful,\n            message: "evm_error=".concat(txResult.errorMessage).concat("\\n")\n        )\n    }\n}',
            refBlock: 'ec1d9fc85900c2d528b89f069212103ad7ef2a51336bb91fa79b1216b5d2536e',
            computeLimit: 9999,
            arguments: [
              { type: 'String', value: '2b7E32BB7F9BA35ea1a0D8181c8D163B3B0D5ea2' },
              { type: 'UFix64', value: '0.10000000' },
              { type: 'Array', value: [] },
              { type: 'UInt64', value: '30000000' },
            ],
            proposalKey: { address: '0x552013bd8742476c', keyId: 0, sequenceNum: 178 },
            payer: '0xcb1cf3196916f9e2',
            authorizers: ['0x552013bd8742476c'],
            payloadSigs: [
              {
                address: '0x552013bd8742476c',
                keyId: 0,
                sig: '09c5616d6ee73e8d1d513fac5bc780a27c2ff2192cdcb2a4be0249f1a8c43b7b6ee198928387e41e2969ce31521c7856c4b3256bad423187abacc9d060477494',
              },
            ],
            envelopeSigs: [{ address: '0xcb1cf3196916f9e2', keyId: 0, sig: null }],
          },
          message: {
            envelope_message:
              '464c4f572d56302e302d7472616e73616374696f6e0000000000000000000000f907e7f9079cb906a62f2f20466c6f772057616c6c6574202d20746573746e657420536372697074202063616c6c436f6e7472616374202d2076322e34380a2f2f20457874656e73696f6e2d322e362e360a0a696d706f72742046756e6769626c65546f6b656e2066726f6d203078396130373636643933623636303862370a696d706f727420466c6f77546f6b656e2066726f6d203078376536306466303432613963303836380a696d706f72742045564d2066726f6d203078386335333033656161323632303264360a0a2f2f2f205472616e73666572732024464c4f572066726f6d20746865207369676e65722773206163636f756e7420436164656e636520466c6f772062616c616e636520746f2074686520726563697069656e742773206865782d656e636f6465642045564d20616464726573732e0a2f2f2f204e6f74652074686174206120434f41206d757374206861766520612024464c4f572062616c616e636520696e2045564d206265666f7265207472616e7366657272696e672076616c756520746f20616e6f746865722045564d20616464726573732e0a2f2f2f0a7472616e73616374696f6e28746f45564d416464726573734865783a20537472696e672c20616d6f756e743a205546697836342c20646174613a205b55496e74385d2c206761734c696d69743a2055496e74363429207b0a0a202020206c657420636f613a20617574682845564d2e57697468647261772c2045564d2e43616c6c29202645564d2e436164656e63654f776e65644163636f756e740a202020206c657420726563697069656e7445564d416464726573733a2045564d2e45564d416464726573730a0a2020202070726570617265287369676e65723a206175746828426f72726f7756616c75652c205361766556616c75652920264163636f756e7429207b0a20202020202020206966207369676e65722e73746f726167652e747970652861743a202f73746f726167652f65766d29203d3d206e696c207b0a2020202020202020202020207369676e65722e73746f726167652e73617665283c2d45564d2e637265617465436164656e63654f776e65644163636f756e7428292c20746f3a202f73746f726167652f65766d290a20202020202020207d0a202020202020202073656c662e636f61203d207369676e65722e73746f726167652e626f72726f773c617574682845564d2e57697468647261772c2045564d2e43616c6c29202645564d2e436164656e63654f776e65644163636f756e743e2866726f6d3a202f73746f726167652f65766d290a2020202020202020202020203f3f2070616e69632822436f756c64206e6f7420626f72726f77207265666572656e636520746f20746865207369676e657227732062726964676564206163636f756e7422290a0a202020202020202073656c662e726563697069656e7445564d41646472657373203d2045564d2e6164647265737346726f6d537472696e6728746f45564d41646472657373486578290a202020207d0a0a2020202065786563757465207b0a202020202020202069662073656c662e726563697069656e7445564d416464726573732e6279746573203d3d2073656c662e636f612e6164647265737328292e6279746573207b0a20202020202020202020202072657475726e0a20202020202020207d0a20202020202020206c65742076616c756542616c616e6365203d2045564d2e42616c616e6365286174746f666c6f773a2030290a202020202020202076616c756542616c616e63652e736574464c4f5728666c6f773a20616d6f756e74290a20202020202020206c6574207478526573756c74203d2073656c662e636f612e63616c6c280a202020202020202020202020746f3a2073656c662e726563697069656e7445564d416464726573732c0a202020202020202020202020646174613a20646174612c0a2020202020202020202020206761734c696d69743a206761734c696d69742c0a20202020202020202020202076616c75653a2076616c756542616c616e63650a2020202020202020290a2020202020202020617373657274280a2020202020202020202020207478526573756c742e737461747573203d3d2045564d2e5374617475732e6661696c6564207c7c207478526573756c742e737461747573203d3d2045564d2e5374617475732e7375636365737366756c2c0a2020202020202020202020206d6573736167653a202265766d5f6572726f723d222e636f6e636174287478526573756c742e6572726f724d657373616765292e636f6e63617428225c6e22290a2020202020202020290a202020207d0a7df8aeb8447b2274797065223a22537472696e67222c2276616c7565223a2232623745333242423746394241333565613161304438313831633844313633423342304435656132227da67b2274797065223a22554669783634222c2276616c7565223a22302e3130303030303030227d9b7b2274797065223a224172726179222c2276616c7565223a5b5d7da47b2274797065223a2255496e743634222c2276616c7565223a223330303030303030227da0ec1d9fc85900c2d528b89f069212103ad7ef2a51336bb91fa79b1216b5d2536e82270f88552013bd8742476c8081b288cb1cf3196916f9e2c988552013bd8742476cf846f8448080b84009c5616d6ee73e8d1d513fac5bc780a27c2ff2192cdcb2a4be0249f1a8c43b7b6ee198928387e41e2969ce31521c7856c4b3256bad423187abacc9d060477494',
          },
        },
      },
      { name: 'signProposer', params: { transaction: {}, message: '' } },
      { name: 'getProposer', params: {} },
      {
        name: 'getTransactionTemplate',
        params: {
          cadence: `
    import FungibleToken from 0xa0225e7000ac82a9
    import FlowToken from 0x4445e7ad11568276
    import EVM from 0xb6763b4399a888c8

    transaction() {
        let auth: auth(IssueStorageCapabilityController, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account

        prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
            let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                    from: /storage/flowTokenVault
                ) ?? panic("Could not borrow reference to the owner's Vault!")

            self.auth = signer
        }

        execute {
            let coa <- EVM.createCadenceOwnedAccount()
            let storagePath = StoragePath(identifier: "evm")!
            let publicPath = PublicPath(identifier: "evm")!
            self.auth.storage.save<@EVM.CadenceOwnedAccount>(<-coa, to: storagePath)
            let addressableCap = self.auth.capabilities.storage.issue<&EVM.CadenceOwnedAccount>(storagePath)
            self.auth.capabilities.unpublish(publicPath)
            self.auth.capabilities.publish(addressableCap, at: publicPath)
        }
    }
    `,
          network: commonParams.network,
        },
      },
    ],
    transactions: [
      { name: 'getTransfers', params: { address: commonParams.address, after: '', limit: 10 } },
      { name: 'getEVMTransfers', params: { address: commonParams.address, after: '', limit: 10 } },
    ],
    addressBook: [
      { name: 'getAddressBook', params: {} },
      {
        name: 'addAddressBook',
        params: {
          contact_name: 'Test',
          address: commonParams.address,
          username: 'test',
          domain: '',
          domain_type: 0,
        },
      },
      {
        name: 'editAddressBook',
        params: {
          id: 26,
          contact_name: 'Test Updated',
          address: commonParams.address,
          domain: '',
          domain_type: 0,
        },
      },
      { name: 'deleteAddressBook', params: { id: 26 } },
      {
        name: 'addExternalAddressBook',
        params: { contact_name: 'Test', address: commonParams.address, domain: '', domain_type: 0 },
      },
    ],
    nft: [
      {
        name: 'nftCatalogList',
        params: {
          address: commonParams.address,
          limit: 10,
          offset: 0,
          network: commonParams.network,
        },
      },
      {
        name: 'nftCatalogCollections',
        params: { address: commonParams.address, network: commonParams.network },
      },
      {
        name: 'nftCatalogCollectionList',
        params: {
          address: commonParams.address,
          contractName: 'cadenceExampleNFTCollection',
          limit: 10,
          offset: 0,
          network: commonParams.network,
        },
      },
      { name: 'nftCollectionList', params: {} },
      { name: 'evmFTList', params: {} },
      {
        name: 'getEvmFT',
        params: { address: commonParams.addressEvm, network: commonParams.network },
      },
      {
        name: 'getEvmNFT',
        params: { address: commonParams.addressEvm, network: commonParams.network },
      },
      {
        name: 'EvmNFTcollectionList',
        params: {
          address: commonParams.addressEvm,
          collectionIdentifier: 'cadenceExampleNFTCollection',
          limit: 24,
          offset: 0,
        },
      },
      { name: 'EvmNFTID', params: { address: commonParams.addressEvm } },
      { name: 'EvmNFTList', params: { address: commonParams.addressEvm, limit: 24, offset: 0 } },
      {
        name: 'getNFTCadenceList',
        params: {
          address: commonParams.address,
          network: commonParams.network,
          offset: 0,
          limit: 5,
        },
      },
      {
        name: 'getNFTV2CollectionList',
        params: { network: commonParams.network },
      },
    ],
    profile: [
      { name: 'updateProfilePreference', params: { privacy: 2 } },
      {
        name: 'updateProfile',
        params: {
          nickname: 'test',
          avatar:
            'https://lilico.app/api/avatar/beam/120/test_862?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA',
        },
      },
    ],
    scripts: [{ name: 'cadenceScriptsV2', params: {} }],
    misc: [
      { name: 'getNews', params: {} },
      { name: 'validateRecaptcha', params: { token: commonParams.token } },
      { name: 'pingNetwork', params: { network: commonParams.network } },
      {
        name: 'getMoonpayURL',
        params: {
          url: `https://buy.moonpay.com?apiKey=pk_live_6YNhgtZH8nyxkJiQRZsotO69G2loIyv0&defaultCurrencyCode=FLOW&colorCode=%23FC814A&walletAddress=${commonParams.address}`,
        },
      },
      {
        name: 'decodeEvmCall',
        params: {
          data: '0x7dc438a4000000000000000000000000000000000000000000000000000000000000006e000000000000000000000000000000000000000000005ebb07aa041da925bbe20000000000000000000000000000000000000000000000000000000000989680000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000053c40000000000000000000000000000000000000000000000000000000000000099',
          address: '0x339d413CCEfD986b1B3647A9cfa9CBbE70A30749',
        },
      },
    ],
  };
};

const updateParamsToParamsUsedForResult = (
  func: ApiTestFunction,
  groupResults: ApiTestResult[]
): ApiTestFunction => {
  if (!func.controlledBy) {
    // We're calling the function directly, so search for the result in the group results
    const groupResult = groupResults.find((result) => result.functionName === func.name);
    if (!groupResult) {
      // we didn't find a result, so don't update the params
      return func;
    }
    // We found a result, so update the params
    return {
      ...func,
      params: groupResult.functionParams ?? {},
    };
  }

  // We're calling the function indirectly, so update the params for each function in the controlledBy array
  return {
    ...func,
    controlledBy: func.controlledBy.map((func) =>
      updateParamsToParamsUsedForResult(func, groupResults)
    ),
  };
};

export const updateTestParamsFromResults = (
  apiTestGroups: ApiTestGroups,
  results: ApiTestResults
) => {
  return Object.fromEntries(
    Object.entries(apiTestGroups).map(([groupName, group]) => {
      return [
        groupName,
        group.map((func: ApiTestFunction) =>
          updateParamsToParamsUsedForResult(func, results[groupName] ?? [])
        ),
      ];
    })
  );
};
