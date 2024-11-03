import { createPersistStore, getScripts } from 'background/utils';
import * as t from '@onflow/types';
import * as fcl from '@onflow/fcl'
import * as secp from '@noble/secp256k1';
import { keyringService, openapiService, userWalletService } from 'background/service';
import wallet from 'background/controller/wallet';
import { getApp } from 'firebase/app';
import { getAuth } from '@firebase/auth';
import { withPrefix } from '@/ui/utils/address';
import fetchConfig from 'background/utils/remoteConfig';
import { storage } from '@/background/webapi';

interface StakingStore {
    nodeList: Record<string, any>;
}

class Staking {

  store!: StakingStore;

  init = async () => {
    this.store = await createPersistStore<StakingStore>({
      name: 'staking',
      template: {
        nodeList:{},
      },
    });
  };

  withDrawLocked = async(address): Promise<string>=> {

    const script = await getScripts('staking', 'withDrawLocked');

    
    return await userWalletService.sendTransaction(
      script
      ,
      [fcl.arg(address, t.Address),]
    );
  }


  withDrawUnstaked = async(address): Promise<string>=> {
    const script = await getScripts('staking', 'withDrawUnstaked');

    return await userWalletService.sendTransaction(
      script
      ,
      [fcl.arg(address, t.Address),]
    );
  }

  nodeInfo = async(address): Promise<string>=> {
    const script = await getScripts('staking', 'getNodesInfo');

    return await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
  }

  delegateInfo = async(address): Promise<string>=> {
    const script = await getScripts('staking', 'getDelegatesIndo');

    const result =  await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    this.store.nodeList = result;
    return result;
  }

  delegateStore = async() => {
    return this.store.nodeList;
  }

  stakeInfo = async(address): Promise<string>=> {
    const script = await getScripts('staking', 'getStakeInfo');

    const result =  await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return result;
  }

  checkSetup = async(address): Promise<boolean> => {
    const script = await getScripts('staking', 'checkSetup');

    const result =  await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return result;
  }

  setup = async(id): Promise<string>=> {
    const script = await getScripts('staking', 'setup');

    const result =  await userWalletService.sendTransaction(
      script,
      []
    );
    return result;
  }

  createDelegator = async(amount, node): Promise<string>=> {
    const script = await getScripts('staking', 'createDelegator');

    const result =  await userWalletService.sendTransaction(
      script
      ,
      [fcl.arg(node, t.String), fcl.arg(amount, t.UFix64),]
    );
    return result;
  }

  createStake = async(amount, node, delegate): Promise<string>=> {
    const script = await getScripts('staking', 'createStake');

    const result =  await userWalletService.sendTransaction(
      script,
      [fcl.arg(node, t.String), fcl.arg(delegate, t.UInt32), fcl.arg(amount, t.UFix64),]
    );
    return result;
  }


  withdrawReward = async(amount, node, delegate): Promise<string>=> {
    const script = await getScripts('staking', 'withdrawReward');

    const result =  await userWalletService.sendTransaction(
      script,
      [fcl.arg(node, t.String), fcl.arg(delegate, t.UInt32), fcl.arg(amount, t.UFix64),]
    );
    return result;
  }


  restakeReward = async(amount, node, delegate): Promise<string>=> {
    const script = await getScripts('staking', 'restakeReward');

    const result =  await userWalletService.sendTransaction(
      script,
      [fcl.arg(node, t.String), fcl.arg(delegate, t.UInt32), fcl.arg(amount, t.UFix64),]
    );
    return result;
  }


  restakeUnstaked = async(amount, node, delegate): Promise<string>=> {
    const script = await getScripts('staking', 'restakeUnstaked');


    const result =  await userWalletService.sendTransaction(
      script,
      [fcl.arg(node, t.String), fcl.arg(delegate, t.UInt32), fcl.arg(amount, t.UFix64),]
    );
    return result;
  }


  withdrawUnstaked = async(amount, node, delegate): Promise<string>=> {
    const script = await getScripts('staking', 'withdrawUnstaked');

    const result =  await userWalletService.sendTransaction(
      script,
      [fcl.arg(node, t.String), fcl.arg(delegate, t.UInt32), fcl.arg(amount, t.UFix64),]
    );
    return result;
  }


  unstake = async(amount, node, delegate): Promise<string>=> {
    console.log(amount);
    console.log(node);
    console.log(delegate);
    const script = await getScripts('staking', 'unstake');

    const result =  await userWalletService.sendTransaction(
      script,
      [fcl.arg(node, t.String), fcl.arg(delegate, t.UInt32), fcl.arg(amount, t.UFix64),]
    );
    return result;
  }


  getApr = async(): Promise<string>=> {
    const script = await getScripts('staking', 'getApr');

    return await fcl.query({
      cadence: script
    });

  }



}

export default new Staking();
