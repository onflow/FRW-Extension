import { Box } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { isValidEthereumAddress } from '@onflow/flow-wallet-shared/utils/address';
import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

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

const MoveToChild = (props: MoveBoardProps) => {
  const usewallet = useWallet();
  const navigate = useNavigate();
  const { currentWallet } = useProfiles();

  const { network } = useNetwork();
  const nftCollections = useNftCatalogCollections(network, currentWallet.address);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cadenceNft, setCadenceNft] = useState<any>(null);
  const [collectionList, setCollectionList] = useState<any>(null);
  const [selectedCollection, setSelected] = useState<string>('');
  const [collectionDetail, setCollectionDetail] = useState<any>(null);
  const [nftIdArray, setNftIdArray] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [errorOpen, setShowError] = useState(false);
  const [selectCollection, setSelectCollection] = useState(false);
  const [selectedAccount, setSelectedChildAccount] = useState<any>(null);
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
    movingBetweenEVMAndFlow: selectedAccount
      ? isValidEthereumAddress(selectedAccount!['address'])
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
      const cadenceResult = nftCollections;
      if (cadenceResult && cadenceResult.length > 0 && cadenceResult[0].collection) {
        setSelected(cadenceResult![0].collection.id);
        const extractedObjects = cadenceResult!.map((obj) => {
          return {
            CollectionName: obj.collection.contract_name,
            NftCount: obj.count,
            id: obj.collection.id,
            address: obj.collection.address,
            logo: obj.collection.logo,
            nftTypeId: obj.collection.nftTypeId,
          };
        });

        setCollectionList(extractedObjects);
        setCadenceNft(cadenceResult);
      }
    } catch (error) {
      consoleError('Error fetching NFT data:', error);
      setSelected('');
      setCollectionList(null);
      setCadenceNft(null);
      setIsLoading(false);
    }
  }, [nftCollections]);

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
    setSending(true);
    if (isValidEthereumAddress(selectedAccount!['address'])) {
      moveNFTEvm();
    } else {
      usewallet
        .batchTransferNFTToChild(
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
    }
  };

  const moveNFTEvm = async () => {
    setSending(true);
    usewallet
      .batchBridgeNftToEvm(collectionDetail.collection.nftTypeId, nftIdArray)
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
  }, [requestCollectionInfo, selectedCollection]);

  useEffect(() => {
    setIsLoading(true);
    findCollectionByContractName();
  }, [collectionList, findCollectionByContractName, selectedCollection]);

  useEffect(() => {
    if (selectedCollection) {
      // First, set activeLoader to null to unmount the previous loader
      setActiveLoader(null);
      setLoadedNFTs([]);

      // Then, after a small delay, set the new loader
      setTimeout(() => {
        setActiveLoader(selectedCollection);
      }, 100);
    }
  }, [selectedCollection]);

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
          ownerAddress={currentWallet?.address}
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
        moveType="toChild"
        AccountComponent={
          <AccountMainBox
            isChild={false}
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

export default MoveToChild;
