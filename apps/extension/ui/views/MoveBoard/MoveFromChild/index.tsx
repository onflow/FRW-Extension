import { Box } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { isValidEthereumAddress } from '@/shared/utils/address';
import { consoleError } from '@/shared/utils/console-log';
import alertMark from '@/ui/assets/svg/alertMark.svg';
import { NFTDrawer } from '@/ui/components/GeneralPages';
import WarningSnackbar from '@/ui/components/WarningSnackbar';
import { WarningStorageLowSnackbar } from '@/ui/components/WarningStorageLowSnackbar';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useNftCatalogCollections } from '@/ui/hooks/useNftHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useStorageCheck } from '@/ui/hooks/useStorageCheck';

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
  const navigate = useNavigate();

  const { network } = useNetwork();

  const { currentWallet, mainAddress, evmWallet } = useProfiles();
  const nftCollections = useNftCatalogCollections(network, currentWallet.address);

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
    transferAmount: '0',
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
      setIsLoading(false);
    }
  }, [collectionList, selectedCollection]);

  const requestCadenceNft = useCallback(async () => {
    setIsLoading(true);
    try {
      const address = await usewallet.getCurrentAddress();
      const parentaddress = await usewallet.getParentAddress();
      if (!parentaddress) {
        throw new Error('Parent address not found');
      }
      const activec = await usewallet.getChildAccountAllowTypes(parentaddress, address!);
      const cadenceResult = nftCollections;
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
      consoleError('Error fetching NFT data:', error);
      setSelected('');
      setCollectionList(null);
      setIsLoading(false);
    }
  }, [nftCollections, usewallet]);

  const requestCollectionInfo = useCallback(async () => {
    if (selectedCollection) {
      try {
        const address = await usewallet.getCurrentAddress();
        const cadenceResult = await usewallet.getSingleCollection(address!, selectedCollection, 0);
        setCollectionDetail(cadenceResult);
      } catch (error) {
        consoleError('Error requesting collection info:', error);
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
        navigate(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((err) => {
        consoleError(err);
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
        navigate(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((err) => {
        consoleError(err);
        setSending(false);
        setFailed(true);
      });
  };

  const moveToEvm = async () => {
    setSending(true);
    const address = await usewallet.getCurrentAddress();
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
        navigate(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((err) => {
        consoleError(err);
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
