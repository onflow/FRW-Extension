import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Button, CardMedia, Drawer, IconButton, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Web3 from 'web3';

import { EVM_ENDPOINT } from '@/shared/constant/domain-constants';
import erc721 from '@/shared/constant/erc721.abi.json';
import { type Contact } from '@/shared/types/network-types';
import { consoleError } from '@/shared/utils/console-log';
import IconNext from '@/ui/assets/svg/next.svg';
import { FRWProfile, LLProfile, LLSpinner } from '@/ui/components';
import IconFlow from '@/ui/components/iconfont/IconFlow';
import SlideRelative from '@/ui/components/SlideRelative';
import StorageExceededAlert from '@/ui/components/StorageExceededAlert';
import { WarningStorageLowSnackbar } from '@/ui/components/WarningStorageLowSnackbar';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useStorageCheck } from '@/ui/hooks/useStorageCheck';
import { useTransferList } from '@/ui/hooks/useTransferListHook';
import { type MatchMedia, MatchMediaType } from '@/ui/utils/url';

interface SendNFTConfirmationProps {
  isConfirmationOpen: boolean;
  data: {
    contact: Contact;
    contract: any;
    media: MatchMedia | null;
    nft: any;
    userContact: Contact;
    amount?: any;
  };
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}

const SendNFTConfirmation = (props: SendNFTConfirmationProps) => {
  const wallet = useWallet();
  const navigate = useNavigate();
  const { occupied } = useTransferList();
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const [tid, setTid] = useState('');
  const [count, setCount] = useState(0);
  const { sufficient: isSufficient } = useStorageCheck();

  const isLowStorage = isSufficient !== undefined && !isSufficient; // isSufficient is undefined when the storage check is not yet completed

  const colorArray = [
    '#32E35529',
    '#32E35540',
    '#32E35559',
    '#32E35573',
    '#41CC5D',
    '#41CC5D',
    '#41CC5D',
  ];
  const [erc721Contract, setErcContract] = useState<any>(null);

  const startCount = useCallback(() => {
    let count = 0;
    let intervalId;
    if (props.data.contact.address) {
      intervalId = setInterval(function () {
        count++;
        if (count === 7) {
          count = 0;
        }
        setCount(count);
      }, 500);
    } else if (!props.data.contact.address) {
      clearInterval(intervalId);
    }
  }, [props?.data?.contact]);

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

  const sendNFT = async () => {
    // setSending(true);
    const activeAccountType = await wallet.getActiveAccountType();
    const { address } = props.data.contact;
    const isEvm = activeAccountType === 'evm';
    const isEvmAddress = address.length > 20;
    if (isEvm && isEvmAddress) {
      await evmToEvm();
    } else if (isEvm && !isEvmAddress) {
      await evmToFlow();
    }
  };

  const removeHexPrefix = (address) => {
    return address.startsWith('0x') ? address.slice(2) : address;
  };

  const evmToEvm = async () => {
    setSending(true);
    const data = await wallet.getEvmAddress();
    const dataWithoutPrefix = removeHexPrefix(data);
    const contactAddressWithoutPrefix = removeHexPrefix(props.data.contact.address);
    const encodedData = erc721Contract.methods
      .safeTransferFrom(dataWithoutPrefix, contactAddressWithoutPrefix, props.data.nft.id)
      .encodeABI();
    const gas = '1312d00';

    wallet
      .sendEvmTransaction(props.data.nft.evmAddress, gas, '0x0', encodedData)
      .then(async (txId) => {
        await wallet.setRecent(props.data.contact);
        wallet.listenTransaction(
          txId,
          true,
          `${props.data.amount} ${props.data.nft.contractName} Sent`,
          `You have sent 1 ${props.data.nft.contractName} to ${props.data.contact.contact_name}. \nClick to view this transaction.`,
          props.data.nft.collectionSquareImage
        );
        props.handleCloseIconClicked();
        await wallet.setDashIndex(0);
        setSending(false);
        setTid(txId);
        navigate(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((err) => {
        consoleError('err ', err);
        setSending(false);
        setFailed(true);
      });
  };

  const evmToFlow = async () => {
    setSending(true);
    wallet
      .bridgeNftFromEvmToFlow(
        props.data.nft.flowIdentifier,
        props.data.nft.id,
        props.data.contact.address
      )
      .then(async (txId) => {
        wallet.listenTransaction(
          txId,
          true,
          `Move complete`,
          `You have moved 1 ${props.data.nft.contractName} to your evm address. \nClick to view this transaction.`
        );
        props.handleCloseIconClicked();
        await wallet.setDashIndex(0);
        setSending(false);
        navigate(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((err) => {
        consoleError(err);
        setSending(false);
        setFailed(true);
      });
  };

  const transactionDoneHandler = useCallback((request) => {
    // Handle error
    if (request.msg === 'transactionError') {
      setFailed(true);
      setErrorMessage(request.errorMessage);
      setErrorCode(request.errorCode);
    }
  }, []);

  useEffect(() => {
    startCount();
    chrome.runtime.onMessage.addListener(transactionDoneHandler);

    return () => {
      chrome.runtime.onMessage.removeListener(transactionDoneHandler);
    };
  }, [props.data.contact, startCount, transactionDoneHandler]);

  const initializeContract = useCallback(async () => {
    const network = await wallet.getNetwork();
    const provider = new Web3.providers.HttpProvider(EVM_ENDPOINT[network]);
    const web3Instance = new Web3(provider);
    const contractInstance = new web3Instance.eth.Contract(
      erc721,
      props.data.nft.contractEvmAddress
    );
    setErcContract(contractInstance);
  }, [props?.data?.nft?.contractEvmAddress, wallet]);

  useEffect(() => {
    initializeContract();
  }, [initializeContract]);

  const renderContent = () => {
    const getUri = () => {
      return (
        <>
          {props.data.media &&
            props.data.media.image &&
            (props.data.media.type !== MatchMediaType.VIDEO ? (
              <CardMedia
                sx={{ width: '72px', height: '72px', borderRadius: '8px' }}
                image={replaceIPFS(props.data.media.image)}
              />
            ) : (
              <>
                <video
                  loop
                  autoPlay
                  preload="auto"
                  style={{ width: '72px', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}
                >
                  <source src={props.data.media.url} type="video/mp4" />
                </video>
              </>
            ))}
        </>
      );
    };

    const getMedia = () => {
      return (
        <>
          <video
            loop
            autoPlay
            playsInline
            preload="auto"
            style={{ width: '72px', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}
          >
            <source src={props.data.media?.videoURL || undefined} type="video/mp4" />
          </video>
        </>
      );
    };
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
          <Grid size={1}></Grid>
          <Grid size={10}>
            {tid ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h1" align="center" py="14px" fontSize="20px">
                  {chrome.i18n.getMessage('Transaction__created')}
                </Typography>
              </Box>
            ) : (
              <Typography variant="h1" align="center" py="14px" fontWeight="bold" fontSize="20px">
                {chrome.i18n.getMessage('Send')} NFT
              </Typography>
            )}
          </Grid>
          <Grid size={1}>
            <IconButton onClick={props.handleCloseIconClicked}>
              <CloseIcon fontSize="medium" sx={{ color: 'icon.navi', cursor: 'pointer' }} />
            </IconButton>
          </Grid>
        </Grid>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: '16px',
          }}
        >
          <FRWProfile isEvm={true} contact={props.data.userContact} />
          <Box
            sx={{
              marginLeft: '-15px',
              marginRight: '-15px',
              marginTop: '-32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {colorArray.map((color, index) => (
              <Box sx={{ mx: '5px' }} key={index}>
                {count === index ? (
                  <CardMedia sx={{ width: '8px', height: '12px' }} image={IconNext} />
                ) : (
                  <Box
                    key={index}
                    sx={{
                      height: '5px',
                      width: '5px',
                      borderRadius: '5px',
                      backgroundColor: color,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
          <LLProfile contact={props.data.contact} />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            px: '13px',
            py: '16px',
            backgroundColor: '#333333',
            borderRadius: '16px',
            my: '10px',
          }}
        >
          <Stack direction="row" spacing={1}>
            {props.data.media &&
            props.data.media?.type === MatchMediaType.IMAGE &&
            !!props.data.media?.videoURL
              ? getMedia()
              : getUri()}
          </Stack>
          <Stack direction="column" spacing={1} sx={{ ml: '18px' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography color="text" sx={{ fontWeight: '400', display: 'inline-block' }}>
                {props.data.nft && props.data.nft.name}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <CardMedia
                sx={{ width: '20px', height: '20px', borderRadius: '20px' }}
                image={props.data.nft && props.data.nft.collectionSquareImage}
              />
              <Typography
                color="text.nonselect"
                sx={{ fontWeight: '400', display: 'inline-block' }}
              >
                {props.data.nft && props.data.nft.contractName}
              </Typography>
              <span>
                <IconFlow size={12} style={{ margin: 'auto' }} />
              </span>
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
        <SlideRelative direction="down" show={occupied}>
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
            <InfoIcon fontSize="medium" color="primary" style={{ margin: '0px 12px auto 12px' }} />
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '12px' }}>
              {chrome.i18n.getMessage('Your__address__is__currently__processing')}
            </Typography>
          </Box>
        </SlideRelative>
        <WarningStorageLowSnackbar isLowStorage={isLowStorage} />

        <Button
          onClick={sendNFT}
          disabled={sending || occupied}
          variant="contained"
          color="primary"
          size="large"
          sx={{
            height: '50px',
            width: '100%',
            borderRadius: '12px',
            textTransform: 'capitalize',
            display: 'flex',
            gap: '12px',
            marginBottom: '33px',
          }}
        >
          {sending ? (
            <>
              <LLSpinner size={28} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                {chrome.i18n.getMessage('Sending')}
              </Typography>
            </>
          ) : (
            <>
              {failed ? (
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                  {chrome.i18n.getMessage('Transaction__failed')}
                </Typography>
              ) : (
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                  {chrome.i18n.getMessage('Send')}
                </Typography>
              )}
            </>
          )}
        </Button>
      </Box>
    );
  };

  return (
    <>
      <Drawer
        anchor="bottom"
        open={props.isConfirmationOpen}
        transitionDuration={300}
        PaperProps={{
          sx: {
            width: '100%',
            height: '65%',
            bgcolor: 'background.paper',
            borderRadius: '18px 18px 0px 0px',
          },
        }}
      >
        {renderContent()}
      </Drawer>
      <StorageExceededAlert open={errorCode === 1103} onClose={() => setErrorCode(null)} />
    </>
  );
};

export default SendNFTConfirmation;
