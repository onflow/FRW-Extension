import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Button, CardMedia, Drawer, IconButton, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { type Contact } from '@/shared/types/network-types';
import { type WalletAccount } from '@/shared/types/wallet-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import { consoleError } from '@/shared/utils/console-log';
import { FRWChildProfile, FRWDropdownProfileCard, LLSpinner } from '@/ui/components';
import IconFlow from '@/ui/components/iconfont/IconFlow';
import SlideRelative from '@/ui/components/SlideRelative';
import StorageExceededAlert from '@/ui/components/StorageExceededAlert';
import { WarningStorageLowSnackbar } from '@/ui/components/WarningStorageLowSnackbar';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useContacts } from '@/ui/hooks/useContactHook';
import { useAllNftList } from '@/ui/hooks/useNftHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useStorageCheck } from '@/ui/hooks/useStorageCheck';
import { useTransferList } from '@/ui/hooks/useTransferListHook';
import { returnFilteredCollections } from '@/ui/utils';
import { MatchMediaType } from '@/ui/utils/url';

interface SendNFTConfirmationProps {
  isConfirmationOpen: boolean;
  data: any;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}

const MoveFromChild = (props: SendNFTConfirmationProps) => {
  const usewallet = useWallet();
  const { childAccountsContacts, evmAccounts, mainAccountContact } = useContacts();
  const { childAccounts } = useProfiles();
  const { occupied } = useTransferList();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const [childWallet, setChildWallet] = useState<WalletAccount | null>(null);
  const [selectedAccount, setSelectedChildAccount] = useState<Contact | null>(null);
  const [childWallets, setChildWallets] = useState<Contact[]>([]);

  const { activeAccountType, network } = useProfiles();
  const allNftList = useAllNftList(network, activeAccountType === 'evm' ? 'evm' : 'flow');

  const { sufficient: isSufficient, sufficientAfterAction } = useStorageCheck({
    transferAmount: '0',
    movingBetweenEVMAndFlow: selectedAccount
      ? isValidEthereumAddress(selectedAccount!['address'])
      : false,
  });

  const isLowStorage = isSufficient !== undefined && !isSufficient; // isSufficient is undefined when the storage check is not yet completed
  const isLowStorageAfterAction = sufficientAfterAction !== undefined && !sufficientAfterAction;

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
    if (isValidEthereumAddress(selectedAccount!['address'])) {
      moveToEvm();
    } else {
      moveNFTToFlow();
    }
  };

  const moveNFTToFlow = async () => {
    setSending(true);
    // setSending(true);
    const filteredCollections = returnFilteredCollections(allNftList, props.data.nft);
    usewallet
      .moveNFTfromChild(props.data.userContact.address, '', props.data.nft.id, filteredCollections)
      .then(async (txId) => {
        usewallet.listenTransaction(
          txId,
          true,
          `Move complete`,
          `You have moved 1 ${props.data.nft.collectionContractName} from linked account to your flow address. \nClick to view this transaction.`
        );
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
    const filteredCollections = returnFilteredCollections(allNftList, props.data.nft);
    const flowIdentifier = props.data.contract.flowIdentifier || props.data.nft.flowIdentifier;
    usewallet
      .batchBridgeChildNFTToEvm(address!, flowIdentifier, [props.data.nft.id], filteredCollections)
      .then(async (txId) => {
        usewallet.listenTransaction(
          txId,
          true,
          `Move complete`,
          `You have moved 1 ${props.data.nft.collectionContractName} from linked account to your evm address. \nClick to view this transaction.`
        );
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

  const transactionDoneHandler = useCallback((request) => {
    if (request.msg === 'transactionError') {
      setFailed(true);
      setErrorMessage(request.errorMessage);
      setErrorCode(request.errorCode);
    }
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(transactionDoneHandler);

    return () => {
      chrome.runtime.onMessage.removeListener(transactionDoneHandler);
    };
  }, [props?.data?.contact, transactionDoneHandler]);

  const getChildResp = useCallback(async () => {
    const walletList = [...mainAccountContact, ...childAccountsContacts, ...evmAccounts];
    setChildWallets(walletList);
    if (walletList && walletList.length > 0) {
      const firstWalletAddress = walletList[0];
      setSelectedChildAccount(firstWalletAddress);
    }
  }, [evmAccounts, childAccountsContacts, mainAccountContact]);

  const getUserContact = useCallback(async () => {
    if (props.data.userContact) {
      setChildWallet(childAccounts?.[props.data.userContact.address] ?? null);
    }
  }, [props.data.userContact, childAccounts]);

  useEffect(() => {
    getChildResp();
    getUserContact();
  }, [getChildResp, getUserContact]);

  const renderContent = () => {
    const getUri = () => {
      return (
        <>
          {props.data.media &&
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
            <Typography variant="h1" align="center" py="14px" fontWeight="bold" fontSize="20px">
              {chrome.i18n.getMessage('Move')} NFT
            </Typography>
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
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: '16px',
          }}
        >
          {childWallet && (
            <FRWChildProfile contact={childWallet} address={props.data.userContact.address} />
          )}
          <Box sx={{ height: '8px' }}></Box>
          {/* <FRWProfileCard contact={props.data.contact} /> */}
          {selectedAccount && (
            <FRWDropdownProfileCard
              contacts={childWallets}
              setSelectedChildAccount={setSelectedChildAccount}
            />
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            mx: '25px',
            px: '14px',
            py: '16px',
            backgroundColor: '#181818',
            borderBottomRightRadius: '16px',
            borderBottomLeftRadius: '16px',
            mt: '-16px',
            mb: '42px',
          }}
        >
          <Stack direction="row" spacing={1}>
            {props.data.media &&
            props.data.media?.type === MatchMediaType.IMAGE &&
            !!props.data.media?.videoURL
              ? getMedia()
              : getUri()}
          </Stack>
          <Stack direction="column" spacing={1} sx={{ ml: '14px' }}>
            <Typography color="neutral.contrastText" sx={{ fontSize: '14px', fontWeight: '700' }}>
              {props.data.media && props.data.media?.title}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', marginTop: '0px !important' }}
            >
              <CardMedia
                sx={{ width: '20px', height: '20px', borderRadius: '20px' }}
                image={props.data.contract && props.data.contract.collectionSquareImage}
              />
              <Typography
                color="text.nonselect"
                sx={{ fontWeight: '400', display: 'inline-block' }}
              >
                {props.data.contract && props.data.contract.collectionContractName}
              </Typography>
              <span>
                <IconFlow size={12} style={{ margin: 'auto' }} />
              </span>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

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
            width: '100%',
            height: '50px',
            borderRadius: '12px',
            textTransform: 'capitalize',
            display: 'flex',
            gap: '12px',
            mb: '33px',
          }}
        >
          {sending ? (
            <>
              <LLSpinner size={28} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                {chrome.i18n.getMessage('Working_on_it')}
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
                  {chrome.i18n.getMessage('Move')}
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
            height: '457px',
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

export default MoveFromChild;
