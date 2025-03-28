import { Box } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { isValidEthereumAddress } from '@/shared/utils/address';
import { NFTDrawer } from '@/ui/FRWComponent/GeneralPages';
import WarningSnackbar from '@/ui/FRWComponent/WarningSnackbar';
import { WarningStorageLowSnackbar } from '@/ui/FRWComponent/WarningStorageLowSnackbar';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useStorageCheck } from '@/ui/utils/useStorageCheck';
import alertMark from 'ui/FRWAssets/svg/alertMark.svg';
import { useWallet } from 'ui/utils';

import AccountMainBox from '../AccountMainBox';
import MoveCollectionSelect from '../MoveCollectionSelect';
import NFTLoader from '../NFTLoader';

interface MoveBoardProps {
  showMoveBoard: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  handleReturnHome: () => void;
}

// Utility functions
const extractContractAddress = (collection) => {
  return collection.split('.')[2];
};

const checkContractAddressInCollections = (nft, activec) => {
  const contractAddressWithout0x = nft.collection.contract_name;
  const isActiveCollect = activec.some((collection) => {
    const extractedAddress = extractContractAddress(collection);
    return extractedAddress === contractAddressWithout0x;
  });
  return isActiveCollect;
};

const MoveFromChild = (props: MoveBoardProps) => {
  const usewallet = useWallet();
  const history = useHistory();
  const { mainAddress, evmWallet } = useProfiles();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [collectionList, setCollectionList] = useState<any>(null);
  const [selectedCollection, setSelected] = useState<string>('');
  const [collectionDetail, setCollectionDetail] = useState<any>(null);
  const [nftIdArray, setNftIdArray] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [errorOpen, setShowError] = useState(false);
  const [selectCollection, setSelectCollection] = useState(false);
  const [selectedAccount, setSelectedChildAccount] = useState(null);
  const [currentCollection, setCurrentCollection] = useState<any>({
    CollectionName: '',
    NftCount: 0,
    id: '',
    address: '',
    logo: '',
  });
  const [loadedNFTs, setLoadedNFTs] = useState<any[]>([]);
  const [activeLoader, setActiveLoader] = useState<string | null>(null);
  const { sufficient: isSufficient, sufficientAfterAction } = useStorageCheck({
    transferAmount: 0,
    // Check if the selected account is an EVM address
    movingBetweenEVMAndFlow: selectedAccount
      ? isValidEthereumAddress(selectedAccount['address'])
      : false,
  });

  const isLowStorage = isSufficient !== undefined && !isSufficient; // isSufficient is undefined when the storage check is not yet completed
  const isLowStorageAfterAction = sufficientAfterAction !== undefined && !sufficientAfterAction;

  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowError(false);
  };

  const findCollectionByContractName = useCallback(() => {
    if (collectionList) {
      const collection = collectionList.find((collection) => collection.id === selectedCollection);
      setCurrentCollection(collection);
    }
  }, [collectionList, selectedCollection]);

  const fetchLatestCollection = useCallback(
    async (address: string) => {
      try {
        const list = await usewallet.refreshCollection(address);
        if (list && list.length > 0) {
          return list;
        }
      } catch (err) {
        console.log(err);
      }
    },
    [usewallet]
  );

  const fetchCollectionCache = useCallback(
    async (address: string) => {
      try {
        const list = await usewallet.getCollectionCache(address);
        if (list && list.length > 0) {
          return list;
        } else {
          const list = await fetchLatestCollection(address);
          return list;
        }
      } catch {
        fetchLatestCollection(address);
      } finally {
        console.log('done');
      }
    },
    [fetchLatestCollection, usewallet]
  );

  const requestCadenceNft = useCallback(async () => {
    setIsLoading(true);
    try {
      const address = await usewallet.getCurrentAddress();
      const parentaddress = await usewallet.getParentAddress();
      if (!parentaddress) {
        throw new Error('Parent address not found');
      }
      const activec = await usewallet.getChildAccountAllowTypes(parentaddress, address!);
      const cadenceResult = await fetchCollectionCache(address!);
      const filteredCadenceResult = cadenceResult!.filter((nft) =>
        checkContractAddressInCollections(nft, activec)
      );

      setSelected(filteredCadenceResult![0].collection.id);

      const extractedObjects = filteredCadenceResult!.map((obj) => {
        return {
          CollectionName: obj.collection.contract_name,
          NftCount: obj.count,
          id: obj.collection.id,
          address: obj.collection.address,
          logo: obj.collection.logo,
        };
      });

      setCollectionList(extractedObjects);
    } catch (error) {
      console.error('Error fetching NFT data:', error);
      setSelected('');
      setCollectionList(null);
      setIsLoading(false);
    }
  }, [fetchCollectionCache, usewallet]);

  const requestCollectionInfo = useCallback(async () => {
    if (selectedCollection) {
      try {
        const address = await usewallet.getCurrentAddress();
        const cadenceResult = await usewallet.getSingleCollection(address!, selectedCollection, 0);
        setCollectionDetail(cadenceResult);
      } catch (error) {
        console.error('Error requesting collection info:', error);
        setCollectionDetail(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedCollection, usewallet]);

  const toggleSelectNft = async (nftId) => {
    const tempIdArray = [...nftIdArray];
    const index = tempIdArray.indexOf(nftId);

    if (index === -1) {
      // If nftId is not in the array, add it
      if (tempIdArray.length < 9) {
        tempIdArray.push(nftId);
      } else {
        // Display an error or warning message that no more than 3 IDs are allowed
        setShowError(true);
      }
    } else {
      // If nftId is in the array, remove it
      tempIdArray.splice(index, 1);
    }

    setNftIdArray(tempIdArray);
  };

  const moveNFT = async () => {
    if (mainAddress === selectedAccount!['address']) {
      moveToParent();
    } else if (isValidEthereumAddress(selectedAccount!['address'])) {
      moveToEvm();
    } else {
      moveToChild();
    }
  };

  const moveToParent = async () => {
    setSending(true);
    const address = await usewallet.getCurrentAddress();
    usewallet
      .batchTransferChildNft(address!, '', nftIdArray, collectionDetail.collection)
      .then(async (txId) => {
        usewallet.listenTransaction(
          txId,
          true,
          `Move complete`,
          `You have moved ${nftIdArray.length} ${collectionDetail.collection.contract_name} to your evm address. \nClick to view this transaction.`
        );
        props.handleReturnHome();
        props.handleCloseIconClicked();
        await usewallet.setDashIndex(0);
        setSending(false);
        history.push(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((err) => {
        console.error(err);
        setSending(false);
        setFailed(true);
      });
  };

  const moveToChild = async () => {
    setSending(true);
    const address = await usewallet.getCurrentAddress();
    usewallet
      .sendChildNFTToChild(
        address!,
        selectedAccount!['address'],
        '',
        nftIdArray,
        collectionDetail.collection
      )
      .then(async (txId) => {
        usewallet.listenTransaction(
          txId,
          true,
          `Move complete`,
          `You have moved ${nftIdArray.length} ${collectionDetail.collection.contract_name} to your evm address. \nClick to view this transaction.`
        );
        props.handleReturnHome();
        props.handleCloseIconClicked();
        await usewallet.setDashIndex(0);
        setSending(false);
        history.push(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((err) => {
        console.error(err);
        setSending(false);
        setFailed(true);
      });
  };

  const moveToEvm = async () => {
    setSending(true);
    const address = await usewallet.getCurrentAddress();
    console.log('collectionDetail.collection ', collectionDetail);
    usewallet
      .batchBridgeChildNFTToEvm(
        address!,
        collectionDetail.collection.nftTypeId,
        nftIdArray,
        collectionDetail.collection
      )
      .then(async (txId) => {
        usewallet.listenTransaction(
          txId,
          true,
          `Move complete`,
          `You have moved ${nftIdArray.length} ${collectionDetail.collection.contract_name} to your evm address. \nClick to view this transaction.`
        );
        props.handleReturnHome();
        props.handleCloseIconClicked();
        await usewallet.setDashIndex(0);
        setSending(false);
        history.push(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((err) => {
        console.error(err);
        setSending(false);
        setFailed(true);
      });
  };

  useEffect(() => {
    setIsLoading(true);
    requestCadenceNft();
  }, [requestCadenceNft]);

  useEffect(() => {
    setIsLoading(true);
    requestCollectionInfo();
  }, [selectedCollection, requestCollectionInfo]);

  useEffect(() => {
    setIsLoading(true);
    findCollectionByContractName();
  }, [collectionList, selectedCollection, findCollectionByContractName]);

  const replaceIPFS = (url: string | null): string => {
    if (!url) {
      return '';
    }

    const lilicoEndpoint = 'https://gateway.pinata.cloud/ipfs/';

    const replacedURL = url
      .replace('ipfs://', lilicoEndpoint)
      .replace('https://ipfs.infura.io/ipfs/', lilicoEndpoint)
      .replace('https://ipfs.io/ipfs/', lilicoEndpoint)
      .replace('https://lilico.app/api/ipfs/', lilicoEndpoint);

    return replacedURL;
  };

  // Callbacks for NFTLoader
  const handleNFTsLoaded = useCallback((nfts) => {
    setLoadedNFTs(nfts);
  }, []);

  const handleLoadingChange = useCallback((loading) => {
    console.log(`NFT loading state changed to: ${loading}`);
    setIsLoading(loading);
  }, []);

  return (
    <Box>
      {activeLoader && (
        <NFTLoader
          key={`loader-${activeLoader}`}
          selectedCollection={activeLoader}
          onNFTsLoaded={handleNFTsLoaded}
          onLoadingChange={handleLoadingChange}
          ownerAddress={evmWallet?.address}
        />
      )}

      <NFTDrawer
        showMoveBoard={props.showMoveBoard}
        handleCancelBtnClicked={props.handleCancelBtnClicked}
        isLoading={isLoading}
        currentCollection={currentCollection}
        collectionDetail={collectionDetail || {}}
        nftIdArray={nftIdArray}
        onCollectionSelect={() => setSelectCollection(true)}
        onNFTSelect={toggleSelectNft}
        sending={sending}
        failed={failed}
        onMove={moveNFT}
        moveType="fromChild"
        AccountComponent={
          <AccountMainBox
            isChild={true}
            setSelectedChildAccount={setSelectedChildAccount}
            selectedAccount={selectedAccount || null}
          />
        }
        nfts={loadedNFTs.length > 0 ? loadedNFTs : collectionDetail?.nfts || []}
        replaceIPFS={replaceIPFS}
      />

      {selectCollection && (
        <MoveCollectionSelect
          showMoveBoard={selectCollection}
          handleCloseIconClicked={() => setSelectCollection(false)}
          handleCancelBtnClicked={() => setSelectCollection(false)}
          handleAddBtnClicked={() => setSelectCollection(false)}
          selectedCollection={selectedCollection}
          setSelected={setSelected}
          collectionList={collectionList}
        />
      )}

      <WarningStorageLowSnackbar
        isLowStorage={isLowStorage}
        isLowStorageAfterAction={isLowStorageAfterAction}
      />

      <WarningSnackbar
        open={errorOpen}
        onClose={handleErrorClose}
        alertIcon={alertMark}
        message={chrome.i18n.getMessage('Cannot_move_more')}
      />
    </Box>
  );
};

export default MoveFromChild;
