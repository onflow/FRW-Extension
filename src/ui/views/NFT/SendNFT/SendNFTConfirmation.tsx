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
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  LLSpinner,
} from 'ui/FRWComponent';
import { useWallet, isEmoji } from 'ui/utils';
import { LLProfile, FRWProfile } from 'ui/FRWComponent';
import IconFlow from '../../../../components/iconfont/IconFlow';
import IconNext from 'ui/FRWAssets/svg/next.svg';
import { MatchMediaType } from '@/ui/utils/url';
import InfoIcon from '@mui/icons-material/Info';
import { Presets } from 'react-component-transition';
import erc721 from 'background/utils/erc721.abi.json';
import Web3 from 'web3';
import { EVM_ENDPOINT } from 'consts'

interface SendNFTConfirmationProps {
  isConfirmationOpen: boolean;
  data: any;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}

const SendNFTConfirmation = (props: SendNFTConfirmationProps) => {
  const wallet = useWallet();
  const history = useHistory();
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tid, setTid] = useState(undefined);
  const [occupied, setOccupied] = useState(false);
  const [isChild, setIsChild] = useState(false);
  const [erc721Contract, setErcContract] = useState<any>(null);
  const [count, setCount] = useState(0);
  const [web3, setWeb3] = useState<any>(null);
  const colorArray = ['#32E35529', '#32E35540', '#32E35559', '#32E35573', '#41CC5D', '#41CC5D', '#41CC5D'];

  const startCount = () => {
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
    setSending(true);
    const activeChild = await wallet.getActiveWallet();
    const { address } = props.data.contact;
    const isEvm = activeChild === 'evm';
    const isEvmAddress = address.length > 20;
    if (!isEvm && isEvmAddress && !isChild) {
      console.log('send flow to evm');
      await flowToEvm();
    } else if (isChild || props.data.linked) {
      console.log('send child nft');
      sendChildNft();
    } else {
      console.log('send nft');
      try {
        const childresp = await wallet.checkUserChildAccount();
        let containsKey = false;

        if (childresp) {
          containsKey = Object.prototype.hasOwnProperty.call(childresp, props.data.contact.address);
        }

        let txID = '';
        if (containsKey) {

          txID = await wallet.sendNFTtoChild(props.data.contact.address, '', parseInt(props.data.nft.id), props.data.contract)

        }
        else if (props.data.contract.contract_name.trim() == 'TopShot') {
          txID = await wallet.sendNBANFT(props.data.contact.address, parseInt(props.data.nft.id), props.data.contract)
        } else {
          txID = await wallet.sendNFT(props.data.contact.address, parseInt(props.data.nft.id), props.data.contract)
        }
        await wallet.setRecent(props.data.contact);
        wallet.listenTransaction(txID, true, `${props.data.media?.title} Sent`, `The ${props.data.contract.name} NFT transaction has been sealed.\nClick to view this transaction.`, props.data.media.url);
        await wallet.setDashIndex(0);
        history.push('/dashboard?activity=1');
        props.handleAddBtnClicked();
      } catch (error) {
        console.log(error);
        setFailed(true);
        setSending(false);
      } finally {
        setSending(false);
      }
    }

  }

  const sendChildNft = async () => {
    setSending(true);
    try {
      let txID = ''
      console.log('props.data ', props.data)

      txID = await wallet.sendNFTfromChild(props.data.userContact.address, props.data.contact.address, '', parseInt(props.data.nft.id), props.data.contract)
      await wallet.setRecent(props.data.contact);
      wallet.listenTransaction(txID, true, `${props.data.media?.title} Sent`, `The ${props.data.contract.name} NFT transaction has been sealed.\nClick to view this transaction.`, props.data.media.url);
      await wallet.setDashIndex(0);
      history.push('/dashboard?activity=1');
      props.handleAddBtnClicked();
    } catch (error) {
      console.log(error);
      setFailed(true);
      setSending(false);
    } finally {
      setSending(false);
    }
  }

  const removeHexPrefix = (address) => {
    return address.startsWith('0x') ? address.slice(2) : address;
  };

  const flowToEvm = async () => {
    setSending(true);
    console.log('props ', props)
    const data = await wallet.getEvmAddress();
    const encodedData = erc721Contract.methods.safeTransferFrom(data, props.data.contact.address, props.data.nft.id).encodeABI();
    const gas = '1312d00';
    setSending(true);
    wallet.bridgeNftToEvmAddress(props.data.nft.contractAddress, props.data.nft.collectionContractName, props.data.nft.id, props.data.contract.evmAddress, encodedData, gas).then(async (txID) => {
      wallet.listenTransaction(txID, true, `Move complete`, `You have moved 1 ${props.data.nft.collectionContractName} to your evm address. \nClick to view this transaction.`,);
      props.handleCloseIconClicked();
      await wallet.setDashIndex(0);
      setSending(false);
      history.push('/dashboard?activity=1');
    }).catch((err) => {
      console.log('send flow to evm encounter error: ', err)
      setSending(false);
      setFailed(true);
    })
  }

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

  const checkChild = async () => {
    const ischild = await wallet.getActiveWallet();
    setIsChild(ischild)
  }

  const initializeContract = async () => {
    const network = await wallet.getNetwork();
    const provider = new Web3.providers.HttpProvider(EVM_ENDPOINT[network]);
    const web3Instance = new Web3(provider);
    console.log('web3Instance ', web3Instance);
    setWeb3(web3Instance);
    const contractInstance = new web3Instance.eth.Contract(erc721, props.data.nft.contractEvmAddress);
    console.log('contractInstance ', contractInstance);
    setErcContract(contractInstance);
  };




  useEffect(() => {
    initializeContract();
    checkChild();
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
                {chrome.i18n.getMessage('Send')} NFT
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '16px' }}>
          {(isChild || props.data.linked) ?
            <LLProfile contact={props.data.userContact} /> :
            <FRWProfile contact={props.data.userContact} />

          }
          <Box sx={{ marginLeft: '-15px', marginRight: '-15px', marginTop: '-32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {colorArray.map((color, index) => (
              <Box sx={{ mx: '5px' }} key={index}>
                {(count === index) ?
                  <CardMedia sx={{ width: '8px', height: '12px', }} image={IconNext} /> :
                  <Box key={index} sx={{ height: '5px', width: '5px', borderRadius: '5px', backgroundColor: color }} />
                }
              </Box>
            ))}
          </Box>
          {isEmoji(props.data.contact.avatar) ?
            <FRWProfile contact={props.data.contact} />
            :
            <LLProfile contact={props.data.contact} />
          }
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: '13px', py: '16px', backgroundColor: '#333333', borderRadius: '16px', my: '10px' }}>
          <Stack direction="row" spacing={1}>
            {(props.data.media && props.data.media?.type === MatchMediaType.IMAGE && props.data.media?.videoURL != null) ?
              getMedia() :
              getUri()
            }
          </Stack>
          <Stack direction="column" spacing={1} sx={{ ml: '18px' }}>
            <Typography color='neutral.contrastText' sx={{ fontSize: '18px', fontWeight: '700' }}>{props.data.media && props.data.media?.title}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <CardMedia sx={{ width: '20px', height: '20px', borderRadius: '20px' }} image={props.data.contract && props.data.contract.logo} />
              <Typography color="text.nonselect" sx={{ fontWeight: '400', display: 'inline-block' }}>{props.data.contract && props.data.contract.name}</Typography>
              <span><IconFlow size={12} style={{ margin: 'auto' }} /></span>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        {/* <Stack direction="row" spacing={1} sx={{marginBottom: '33px'}}>
          <LLPrimaryButton
            label="Send"
            onClick={sendNFT}
            fullWidth
            type="submit"
          />
        </Stack> */}
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
            marginBottom: '33px'
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
                  {chrome.i18n.getMessage('Send')}
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
        sx: { width: '100%', height: '65%', bgcolor: 'background.paper', borderRadius: '18px 18px 0px 0px' },
      }}
    >
      {renderContent()}
    </Drawer>
  );
};

export default SendNFTConfirmation;
