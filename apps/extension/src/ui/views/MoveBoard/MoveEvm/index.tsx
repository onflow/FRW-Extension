import { Box } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

import { consoleError } from '@/shared/utils/console-log';
import { NFTDrawer } from '@/ui/components/GeneralPages';
import WarningSnackbar from '@/ui/components/WarningSnackbar';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useStorageCheck } from '@/ui/hooks/useStorageCheck';
import alertMark from 'ui/assets/svg/alertMark.svg';
import { useWallet } from 'ui/utils';

import AccountBox from '../AccountBox';
import MoveCollectionSelect from '../MoveCollectionSelect';

interface MoveBoardProps {
  showMoveBoard: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  handleReturnHome: () => void;
}

const MoveEvm = (props: MoveBoardProps) => {
  const usewallet = useWallet();
  const navigate = useNavigate();
  const { mainAddress } = useProfiles();
  const [cadenceNft, setCadenceNft] = useState<any>(null);
  const [collectionList, setCollectionList] = useState<any>(null);
  const [selectedCollection, setSelected] = useState<string>('');
  const [collectionDetail, setCollectionDetail] = useState<any>(null);
  const [collectInfo, setCollectionInfo] = useState<any>(null);
  const [nftIdArray, setNftIdArray] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorOpen, setShowError] = useState(false);
  const [selectCollection, setSelectCollection] = useState(false);
  const [selectedAccount, setSelectedChildAccount] = useState(null);
  const { sufficient: isSufficient, sufficientAfterAction } = useStorageCheck({
    transferAmount: '0',
    // We are moving within the EVM network, the flag should be false
    movingBetweenEVMAndFlow: false,
  });
  const [currentCollection, setCurrentCollection] = useState<any>({
    CollectionName: '',
    NftCount: 0,
    id: '',
    address: '',
    logo: '',
  });

  const isLowStorage = isSufficient !== undefined && !isSufficient; // isSufficient is undefined when the storage check is not yet completed
  const isLowStorageAfterAction = sufficientAfterAction !== undefined && !sufficientAfterAction;

  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowError(false);
  };

  const updateCurrentCollection = useCallback(async () => {
    if (collectionList && cadenceNft) {
      const collection = collectionList.find((collection) => collection.id === selectedCollection);

      const cadenceResult = await usewallet.EvmNFTcollectionList(selectedCollection);
      setCollectionDetail(collection);
      setCollectionInfo(cadenceResult);
    }
  }, [collectionList, cadenceNft, selectedCollection, usewallet]);

  const requestCadenceNft = useCallback(async () => {
    const cadenceResult = await usewallet.reqeustEvmNft();
    const tokensWithNfts = cadenceResult.filter((token) => token.count && token.count > 0);
    const filteredData = tokensWithNfts.filter((item) => item.collection.flowIdentifier);
    if (filteredData.length > 0) {
      setSelected(filteredData[0].collection.id);
      const extractedObjects = filteredData.map((obj) => {
        const flowIdentifierParts = obj.collection.flowIdentifier.split('.');
        return {
          CollectionName: flowIdentifierParts[2],
          NftCount: obj.count,
          id: obj.collection.id,
          address: flowIdentifierParts[1],
          logo: obj.collection.logo,
          flowIdentifier: obj?.collection?.flowIdentifier || '',
        };
      });
      setCadenceNft(filteredData);
      setCollectionList(extractedObjects);
    } else {
      setCollectionInfo({ nfts: [] });
    }
    setLoading(false);
  }, [usewallet]);

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
    } else {
      moveToChild();
    }
  };

  const moveToChild = async () => {
    setSending(true);
    const collection = collectionList.find((collection) => collection.id === selectedCollection);
    usewallet
      .batchBridgeChildNFTFromEvm(
        selectedAccount!['address'],
        collection.flowIdentifier,
        nftIdArray
      )
      .then(async (txId) => {
        usewallet.listenTransaction(
          txId,
          true,
          `Move complete`,
          `You have moved ${nftIdArray.length} ${collection.CollectionName} from evm to your flow address. \nClick to view this transaction.`
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

  const moveToParent = async () => {
    setSending(true);
    const collection = collectionList.find((collection) => collection.id === selectedCollection);
    usewallet
      .batchBridgeNftFromEvm(collection.flowIdentifier, nftIdArray)
      .then(async (txId) => {
        usewallet.listenTransaction(
          txId,
          true,
          `Move complete`,
          `You have moved ${nftIdArray.length} ${collection.CollectionName} from evm to your flow address. \nClick to view this transaction.`
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
    requestCadenceNft();
  }, [requestCadenceNft]);

  useEffect(() => {
    updateCurrentCollection();
  }, [collectionList, cadenceNft, selectedCollection, updateCurrentCollection]);

  useEffect(() => {
    if (collectionList && selectedCollection) {
      const collection = collectionList.find((collection) => collection.id === selectedCollection);
      if (collection) {
        setCurrentCollection(collection);
      }
    }
  }, [collectionList, selectedCollection]);

  return (
    <Box>
      <NFTDrawer
        showMoveBoard={props.showMoveBoard}
        handleCancelBtnClicked={props.handleCancelBtnClicked}
        isLoading={loading}
        currentCollection={currentCollection}
        collectionDetail={collectionDetail || {}}
        nftIdArray={nftIdArray}
        onCollectionSelect={() => setSelectCollection(true)}
        onNFTSelect={toggleSelectNft}
        sending={sending}
        failed={failed}
        onMove={moveNFT}
        moveType="evm"
        AccountComponent={
          <AccountBox
            isChild={true}
            setSelectedChildAccount={setSelectedChildAccount}
            selectedAccount={selectedAccount || null}
            isEvm={true}
          />
        }
        nfts={collectInfo?.nfts || []}
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

      <WarningSnackbar
        open={errorOpen}
        onClose={handleErrorClose}
        alertIcon={alertMark}
        message={chrome.i18n.getMessage('Cannot_move_more')}
      />
    </Box>
  );
};

export default MoveEvm;
