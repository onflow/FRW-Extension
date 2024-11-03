import React, { useState, useEffect } from 'react';
import { Box, Button, Skeleton, Typography, Drawer, IconButton, Snackbar, Alert, ListItemText, Avatar, CardMedia } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useWallet } from 'ui/utils';
import { useHistory } from 'react-router-dom';
import selectedCover from 'ui/FRWAssets/svg/selectedCover.svg';
import moveSelectDrop from 'ui/FRWAssets/svg/moveSelectDrop.svg';
import MoveCollectionSelect from '../MoveCollectionSelect';
import {
  LLSpinner,
} from 'ui/FRWComponent';
import { isValidEthereumAddress } from 'ui/utils/address';
import AccountMainBox from '../AccountMainBox';
import selected from 'ui/FRWAssets/svg/selected.svg';
import alertMark from 'ui/FRWAssets/svg/alertMark.svg';



interface MoveBoardProps {
  showMoveBoard: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  handleReturnHome: () => void;
}


const MoveToChild = (props: MoveBoardProps) => {


  const usewallet = useWallet();
  const history = useHistory();
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
  const [selectedAccount, setSelectedChildAccount] = useState(null);
  const [currentCollection, setCurrentCollection] = useState<any>({
    CollectionName: '',
    NftCount: 0,
    id: '',
    address: '',
    logo: '',
  });
  // console.log('props.loggedInAccounts', props.current)

  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowError(false);
  };

  const findCollectionByContractName = () => {
    if (collectionList) {
      const collection = collectionList.find(collection => collection.id === selectedCollection);
      console.log('setCurrentCollection ', collection)
      setCurrentCollection(collection);
    }

  };


  const fetchCollectionCache = async (address: string) => {
    try {
      const list = await usewallet.getCollectionCache();
      if (list && list.length > 0) {
        return list;
      } else {
        const list = await fetchLatestCollection(address);
        return list;
      }
    } catch {
      fetchLatestCollection(address);
    } finally {
      console.log('done')
    }
  };

  const fetchLatestCollection = async (address: string) => {
    try {
      const list = await usewallet.refreshCollection(address);
      if (list && list.length > 0) {
        return list
      }
    } catch (err) {
      console.log(err)
    }
  };


  const requestCadenceNft = async () => {
    setIsLoading(true);
    try {
      const address = await usewallet.getCurrentAddress();
      const cadenceResult = await fetchCollectionCache(address!);
      setSelected(cadenceResult![0].collection.id);

      const extractedObjects = cadenceResult!.map(obj => {
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
    } catch (error) {
      console.error('Error fetching NFT data:', error);
      setSelected('');
      setCollectionList(null);
      setCadenceNft(null);
      setIsLoading(false);
    }
  };

  const requestCollectionInfo = async () => {
    if (selectedCollection) {
      try {
        const address = await usewallet.getCurrentAddress();
        const cadenceResult = await usewallet.getSingleCollection(address!, selectedCollection, 0);
        setCollectionDetail(cadenceResult);
        console.log('setCollectionDetail ', cadenceResult);
      } catch (error) {
        console.error('Error requesting collection info:', error);
        setCollectionDetail(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

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
      usewallet.batchTransferNFTToChild(selectedAccount!['address'], '', nftIdArray, collectionDetail.collection).then(async (txID) => {
        usewallet.listenTransaction(txID, true, `Move complete`, `You have moved ${nftIdArray.length} ${collectionDetail.collection.contract_name} to your evm address. \nClick to view this transaction.`,);
        props.handleReturnHome();
        props.handleCloseIconClicked();
        await usewallet.setDashIndex(0);
        setSending(false);
        history.push('/dashboard?activity=1');
      }).catch((err) => {
        console.log('err ', err)
        setSending(false);
        setFailed(true);
      })

    }

  };

  const moveNFTEvm = async () => {
    setSending(true);
    usewallet.batchBridgeNftToEvm(collectionDetail.collection.nftTypeId, nftIdArray).then(async (txID) => {
      usewallet.listenTransaction(txID, true, `Move complete`, `You have moved ${nftIdArray.length} ${collectionDetail.collection.contract_name} to your evm address. \nClick to view this transaction.`,);
      props.handleReturnHome();
      props.handleCloseIconClicked();
      await usewallet.setDashIndex(0);
      setSending(false);
      history.push('/dashboard?activity=1');
    }).catch(() => {
      setSending(false);
      setFailed(true);
    })

  };

  useEffect(() => {
    setIsLoading(true);
    requestCadenceNft();
  }, [])

  useEffect(() => {
    setIsLoading(true);
    requestCollectionInfo();
  }, [selectedCollection])

  useEffect(() => {
    setIsLoading(true);
    findCollectionByContractName();
  }, [collectionList, selectedCollection])

  const replaceIPFS = (url: string | null): string => {
    if (!url) {
      return ''
    }

    const lilicoEndpoint = 'https://gateway.pinata.cloud/ipfs/'

    const replacedURL = url
      .replace('ipfs://', lilicoEndpoint)
      .replace('https://ipfs.infura.io/ipfs/', lilicoEndpoint)
      .replace('https://ipfs.io/ipfs/', lilicoEndpoint)
      .replace('https://lilico.app/api/ipfs/', lilicoEndpoint)

    return replacedURL
  }

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1100 !important' }}
      transitionDuration={300}
      open={props.showMoveBoard}
      PaperProps={{
        sx: { width: '100%', height: 'calc(100% - 56px)', background: '#222', },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', px: '20px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '24px', margin: '20px 0', alignItems: 'center', }}>
          <Box sx={{ width: '40px' }}></Box>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color='text'
            sx={{ fontSize: '20px', textAlign: 'center', fontFamily: 'e-Ukraine', lineHeight: '24px', fontWeight: '700' }}
          >
            {chrome.i18n.getMessage('select')} NFTs
          </Typography>
          <Box>
            <IconButton onClick={props.handleCancelBtnClicked}>
              <CloseIcon
                fontSize="medium"
                sx={{ color: 'icon.navi', cursor: 'pointer' }}
              />
            </IconButton>
          </Box>
        </Box>
      </Box>
      <AccountMainBox isChild={false} setSelectedChildAccount={setSelectedChildAccount} selectedAccount={selectedAccount} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '0', mt: '10px', padding: '0 18px' }}>
        <Box sx={{ height: '24px', padding: '6px 0' }}>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color='text'
            sx={{ fontSize: '14px', textAlign: 'center', lineHeight: '24px', fontWeight: '600' }}
          >
            {chrome.i18n.getMessage('collection')}
          </Typography>
        </Box>
        {currentCollection && collectionDetail &&
          <Button onClick={() => setSelectCollection(true)} >
            {currentCollection.logo && <CardMedia component="img" sx={{ width: '24px', height: '24px', display: 'inline', borderRadius: '8px', marginRight: '8px', objectFit: 'cover', objectPosition: 'left !important' }} image={currentCollection.logo} />}
            <Typography
              variant="body1"
              component="div"
              display="inline"
              color='text'
              sx={{ fontSize: '14px', textAlign: 'center', lineHeight: '24px', fontWeight: '600' }}
            >
              {currentCollection.CollectionName}
            </Typography>

            <CardMedia component="img" sx={{ width: '12px', height: '12px', marginLeft: '4px' }} image={'https://raw.githubusercontent.com/Outblock/Assets/main/ft/flow/logo.png'} />
            <CardMedia component="img" sx={{ width: '16px', height: '16px', marginLeft: '4px' }} image={moveSelectDrop} />
          </Button>

        }
      </Box>
      {!isLoading ?
        <Box sx={{ display: 'flex', mb: '18px', padding: '16px', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-start', height:'150px',overflowY:'scroll' }}>
          {collectionDetail && collectionDetail.nfts.length > 0 ?
            collectionDetail.nfts.map(nft => (
              <Box
                key={nft.id}
                sx={{
                  display: 'flex',
                  position: 'relative',
                  width: '84px',
                  height: '84px',
                  borderRadius: '16px',
                  marginBottom: '3px',
                  border: nftIdArray.includes(nft.id) && '1px solid #41CC5D'
                }}
              >
                <Button onClick={() => toggleSelectNft(nft.id)} sx={{ padding: 0, borderRadius: '16px', backgroundColor: '#333', }}>
                  {nftIdArray.includes(nft.id) &&
                    <Box sx={{ backgroundColor: '#00000099', borderRadius: '16px', position: 'absolute', width: '100%', height: '100%' }}>
                      <CardMedia
                        component="img"
                        sx={{ width: '16px', borderRadius: '16px', height: '16px', top: '8px', right: '8px', zIndex: '2000', position: 'absolute' }}
                        image={selected}
                      />
                    </Box>
                  }
                  <CardMedia
                    component="img"
                    alt={nft.name}
                    height="84px"
                    width="84px"
                    sx={{ borderRadius: '16px', }}
                    image={replaceIPFS(nft.thumbnail)}
                    title={nft.name}
                  />
                </Button>
              </Box>
            ))
            :
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Typography sx={{ color: '#FFFFFF66', fontSize: '14px', fontWeight: '700' }}>0 NFTs</Typography>
            </Box>
          }

        </Box>
        :
        <Box sx={{ display: 'flex', mb: '18px', padding: '18px', gap: '4px' }}>
          <Box sx={{ display: 'flex', width: '84px', height: '84px', borderRadius: '16px', backgroundColor: '#333' }}>
            <Skeleton
              variant="rectangular"
              width={84}
              height={84}
              sx={{ margin: '0 auto', borderRadius: '16px' }}
            />
          </Box>
          <Box sx={{ display: 'flex', width: '84px', height: '84px', borderRadius: '16px', backgroundColor: '#333' }}>
            <Skeleton
              variant="rectangular"
              width={84}
              height={84}
              sx={{ margin: '0 auto', borderRadius: '16px' }}
            />
          </Box>
          <Box sx={{ display: 'flex', width: '84px', height: '84px', borderRadius: '16px', backgroundColor: '#333' }}>
            <Skeleton
              variant="rectangular"
              width={84}
              height={84}
              sx={{ margin: '0 auto', borderRadius: '16px' }}
            />
          </Box>
          <Box sx={{ display: 'flex', width: '84px', height: '84px', borderRadius: '16px', backgroundColor: '#333' }}>
            <Skeleton
              variant="rectangular"
              width={84}
              height={84}
              sx={{ margin: '0 auto', borderRadius: '16px' }}
            />
          </Box>
        </Box>
      }
      <Box sx={{ flex: '1' }}></Box>

      <Button
        onClick={moveNFT}
        // disabled={sending || occupied}
        variant="contained"
        color="success"
        size="large"
        disabled={!collectionDetail || (collectionDetail.nfts && collectionDetail.nfts.length === 0)}
        sx={{
          height: '50px',
          borderRadius: '12px',
          textTransform: 'capitalize',
          display: 'flex',
          gap: '12px',
          marginBottom: '33px',
          mx: '16px',
        }}
      >
        {sending ? (
          <>
            <LLSpinner size={28} />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold' }}
              color="text.primary"
            >
              {chrome.i18n.getMessage('Sending')}
            </Typography>
          </>
        ) :
          (
            <>
              {failed ?
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold' }}
                  color="text.primary"
                >
                  {chrome.i18n.getMessage('Transaction__failed')}
                </Typography>
                :
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold' }}
                  color="text.primary"
                >
                  {chrome.i18n.getMessage('Move')} {nftIdArray.length > 0 && nftIdArray.length} NFT{nftIdArray.length > 1 && 's'}
                </Typography>
              }
            </>
          )}

      </Button>
      {selectCollection &&
        <MoveCollectionSelect
          showMoveBoard={selectCollection}
          handleCloseIconClicked={() => setSelectCollection(false)}
          handleCancelBtnClicked={() => setSelectCollection(false)}
          handleAddBtnClicked={() => setSelectCollection(false)}
          selectedCollection={selectedCollection}
          setSelected={setSelected}
          collectionList={collectionList}
        />
      }
      <Snackbar
        open={errorOpen}
        autoHideDuration={2000}
        onClose={handleErrorClose}
        sx={{ zIndex: '2000' }}
      >
        <Alert
          icon={<img src={alertMark} alt="alert icon" />}
          variant="filled"
          severity="warning"
          sx={{ color: '#FFFFFF', padding: '0 16px', fontSize: '12px', fontWeight: '400', borderRadius: '24px', margin: '0 auto 80px', zIndex: '2000' }}
        >
          {chrome.i18n.getMessage('Cannot_move_more')}
        </Alert>
      </Snackbar>
    </Drawer >
  );
}


export default MoveToChild;