import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import {
  Box,
  Typography,
  Drawer,
  Stack,
  Grid,
  CardMedia,
  IconButton,
  Button, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  LLSpinner,
} from 'ui/FRWComponent';
import { useWallet } from 'ui/utils';
import { FRWProfileCard, FRWDropdownProfileCard } from 'ui/FRWComponent';
import IconFlow from '../../../../components/iconfont/IconFlow';
import IconNext from 'ui/FRWAssets/svg/next.svg';
import { MatchMediaType } from '@/ui/utils/url';
import InfoIcon from '@mui/icons-material/Info';
import { Presets } from 'react-component-transition';
import { ensureEvmAddressPrefix, isValidEthereumAddress } from '@/ui/utils/address';

interface SendNFTConfirmationProps {
  isConfirmationOpen: boolean;
  data: any;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}

const MovefromParent = (props: SendNFTConfirmationProps) => {
  const wallet = useWallet();
  const history = useHistory();
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tid, setTid] = useState(undefined);
  const [occupied, setOccupied] = useState(false);
  const [childWallets, setChildWallets] = useState({});
  const [selectedAccount, setSelectedChildAccount] = useState(null);
  const [count, setCount] = useState(0);


  const startCount = () => {
    console.log('props.data ', props.data)
    let count = 0;
    let intervalId;
    if (props.data.contact.address) {
      intervalId = setInterval(function () {
        count++;
        if (count === 7) { count = 0 }
        setCount(count);
      }, 500);
    } else if (!props.data.contact.address) {
      clearInterval(intervalId);
    }
  }

  const getPending = async () => {
    const pending = await wallet.getPendingTx();
    if (pending.length > 0) {
      setOccupied(true)
    }
  }

  const updateOccupied = () => {
    setOccupied(false);
  }

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

  const sendNFT = async () => {
    // setSending(true);
    await moveNFTToFlow();

  }




  const returnFilteredCollections = (contractList, NFT) => {
    console.log('contractList ', contractList, NFT)
    return contractList.filter(
      (collection) => collection.name == NFT.collectionName
    );
  };



  const moveNFTToFlow = async () => {
    setSending(true);
    // setSending(true);
    const contractList = await wallet.openapi.getAllNftV2();
    const filteredCollections = returnFilteredCollections(contractList, props.data.nft)
    console.log('selectedAccount ', selectedAccount, contractList)
    console.log('filteredCollections ', filteredCollections)

    if (isValidEthereumAddress(selectedAccount!['address'])) {
      await moveNFTToEvm();
    } else {
      wallet.sendNFTtoChild(selectedAccount!['address'], '', props.data.nft.id, filteredCollections[0]).then(async (txID) => {
        wallet.listenTransaction(txID, true, `Move complete`, `You have moved 1 ${props.data.nft.collectionContractName} from linked account to your flow address. \nClick to view this transaction.`,);
        props.handleCloseIconClicked();
        await wallet.setDashIndex(0);
        setSending(false);
        history.push('/dashboard?activity=1');
      }).catch((err) => {
        console.log('err ', err)
        setSending(false);
        setFailed(true);
      })
    }



  };

  const moveNFTToEvm = async () => {
    setSending(true);
    console.log('props.data ', props.data)
    const identifier = props.data.contract.nftTypeId ? props.data.contract.nftTypeId : props.data.contract.flowIdentifier
    wallet.batchBridgeNftToEvm(identifier, [props.data.nft.id]).then(async (txID) => {
      wallet.listenTransaction(txID, true, `Move complete`, `You have moved 1 ${props.data.nft.collectionContractName} to your evm address. \nClick to view this transaction.`,);
      props.handleCloseIconClicked();
      await wallet.setDashIndex(0);
      setSending(false);
      history.push('/dashboard?activity=1');
    }).catch(() => {
      setSending(false);
      setFailed(true);
    })

  };


  const transactionDoneHanlder = (request) => {
    if (request.msg === 'transactionDone') {
      updateOccupied();
    }
    return true
  }

  useEffect(() => {
    startCount();
    getPending();
    chrome.runtime.onMessage.addListener(transactionDoneHanlder);

    return () => {
      chrome.runtime.onMessage.removeListener(transactionDoneHanlder)
    }
  }, [props.data.contact]);

  const getChildResp = async () => {
    const childresp = await wallet.checkUserChildAccount();
    const ewallet: any = await wallet.getEvmWallet();
    const emojires = await wallet.getEmoji();
    let evmAddress
    if (ewallet.address) {
      evmAddress = ensureEvmAddressPrefix(ewallet.address)
    }
    let evmWallet = {}
    if (evmAddress) {
      evmWallet = {
        [evmAddress!]: {
          "name": emojires[1].name,
          "description": emojires[1].name,
          "thumbnail": {
            "url": emojires[1].emoji
          }
        }
      };
    }

    // Merge wallet lists
    const walletList = { ...childresp, ...evmWallet };
    setChildWallets(walletList)
    const firstWalletAddress = Object.keys(walletList)[0];
    if (firstWalletAddress) {
      setSelectedChildAccount(walletList[firstWalletAddress]);
    }
  }

  useEffect(() => {
    getChildResp();
  }, []);

  const renderContent = () => {
    const getUri = () => {
      return (
        <>
          {props.data.media && (
            props.data.media.type !== MatchMediaType.VIDEO ?
              <CardMedia sx={{ width: '72px', height: '72px', borderRadius: '8px' }} image={replaceIPFS(props.data.media.image)} />
              :
              <>
                <video loop autoPlay preload="auto"
                  style={{ width: '72px', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}>
                  <source src={props.data.media.url} type="video/mp4" />
                </video>
              </>)
          }
        </>
      );
    };

    const getMedia = () => {
      return (
        <>
          <video loop autoPlay playsInline preload="auto" style={{ width: '72px', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}>
            <source src={props.data.media?.videoURL || undefined} type="video/mp4" />
          </video>
        </>
      )
    }
    return (
      <Box
        px="18px"
        sx={{
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          flexDirection: 'column',
          display: 'flex',
        }}
      >
        <Grid
          container
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Grid item xs={1}></Grid>
          <Grid item xs={10}>
            {tid ?
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="h1"
                  align="center"
                  py="14px"
                  fontSize="20px"
                >
                  {chrome.i18n.getMessage('Transaction__created')}
                </Typography>
              </Box>
              :
              <Typography
                variant="h1"
                align="center"
                py="14px"
                fontWeight="bold"
                fontSize="20px"
              >
                {chrome.i18n.getMessage('Move')} NFT
              </Typography>
            }
          </Grid>
          <Grid item xs={1}>
            <IconButton onClick={props.handleCloseIconClicked}>
              <CloseIcon
                fontSize="medium"
                sx={{ color: 'icon.navi', cursor: 'pointer' }}
              />
            </IconButton>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', py: '16px' }}>
          <FRWProfileCard contact={props.data.userContact} />
          <Box sx={{ height: '8px' }}></Box>
          {selectedAccount && <FRWDropdownProfileCard contact={selectedAccount} contacts={childWallets} setSelectedChildAccount={setSelectedChildAccount} />}

        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mx: '25px', px: '14px', py: '16px', backgroundColor: '#181818', borderBottomRightRadius: '16px', borderBottomLeftRadius: '16px', mt: '-16px', mb: '42px' }}>
          <Stack direction="row" spacing={1}>
            {(props.data.media && props.data.media?.type === MatchMediaType.IMAGE && props.data.media?.videoURL != null) ?
              getMedia() :
              getUri()
            }
          </Stack>
          <Stack direction="column" spacing={1} sx={{ ml: '14px' }}>
            <Typography color='neutral.contrastText' sx={{ fontSize: '14px', fontWeight: '700' }}>{props.data.media && props.data.media?.title}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', marginTop: '0px !important' }}>
              <CardMedia sx={{ width: '20px', height: '20px', borderRadius: '20px' }} image={props.data.contract && props.data.contract.collectionSquareImage} />
              <Typography color="text.nonselect" sx={{ fontWeight: '400', display: 'inline-block' }}>{props.data.contract && props.data.contract.collectionContractName}</Typography>
              <span><IconFlow size={12} style={{ margin: 'auto' }} /></span>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        {occupied &&
          <Presets.TransitionSlideUp>
            <Box
              sx={{
                width: '95%',
                backgroundColor: 'error.light',
                mx: 'auto',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                py: '8px',
              }}
            >
              {/* <CardMedia style={{ color:'#E54040', width:'24px',height:'24px', margin: '0 12px 0' }} image={empty} />   */}
              <InfoIcon fontSize='medium' color='primary' style={{ margin: '0px 12px auto 12px' }} />
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '12px' }}>
                {chrome.i18n.getMessage('Your__address__is__currently__processing')}
              </Typography>
            </Box>
          </Presets.TransitionSlideUp>
        }
        <Button
          onClick={sendNFT}
          disabled={sending || occupied}
          variant="contained"
          color="primary"
          size="large"
          sx={{
            height: '50px',
            borderRadius: '12px',
            textTransform: 'capitalize',
            display: 'flex',
            gap: '12px',
            mb: '33px'
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
                {chrome.i18n.getMessage('Working_on_it')}
              </Typography>
            </>
          ) :
            (<>
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
                  {chrome.i18n.getMessage('Move')}
                </Typography>
              }
            </>
            )}

        </Button>

      </Box>
    );
  }

  return (
    <Drawer
      anchor="bottom"
      open={props.isConfirmationOpen}
      transitionDuration={300}
      PaperProps={{
        sx: { width: '100%', height: '457px', bgcolor: 'background.paper', borderRadius: '18px 18px 0px 0px' },
      }}
    >
      {renderContent()}
    </Drawer>
  );
};

export default MovefromParent;
