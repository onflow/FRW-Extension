import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Typography, Drawer, Stack, CardMedia, IconButton, Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { type Contact } from '@/shared/types/network-types';
import { type AccountDetails } from '@/shared/types/wallet-types';
import { consoleError } from '@/shared/utils/console-log';
import IconFlow from '@/ui/components/iconfont/IconFlow';
import SlideRelative from '@/ui/components/SlideRelative';
import StorageExceededAlert from '@/ui/components/StorageExceededAlert';
import { WarningNFTNotOnboardedSnackbar } from '@/ui/components/WarningNFTNotOnboardedSnackbar';
import { WarningStorageLowSnackbar } from '@/ui/components/WarningStorageLowSnackbar';
import { useContacts } from '@/ui/hooks/useContactHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useStorageCheck } from '@/ui/hooks/useStorageCheck';
import { useTransferList } from '@/ui/hooks/useTransferListHook';
import { MatchMediaType } from '@/ui/utils/url';
import { LLSpinner, FRWProfileCard, FRWDropdownProfileCard } from 'ui/components';
import { useWallet } from 'ui/utils';

interface SendNFTConfirmationProps {
  isConfirmationOpen: boolean;
  data: any;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}

const MoveNftFromEvm = (props: SendNFTConfirmationProps) => {
  const usewallet = useWallet();
  const history = useHistory();
  const { childAccountsContacts, evmAccounts, mainAccountContact } = useContacts();
  const { mainAddress, childAccounts, parentWallet } = useProfiles();
  const { occupied } = useTransferList();
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const [selectedAccount, setSelectedChildAccount] = useState<Contact | null>(null);
  const { sufficient: isSufficient } = useStorageCheck();

  const isLowStorage = isSufficient !== undefined && !isSufficient; // isSufficient is undefined when the storage check is not yet completed

  const parentAndChildWallets: Contact[] = useMemo(() => {
    return [...mainAccountContact, ...childAccountsContacts, ...evmAccounts];
  }, [childAccountsContacts, mainAccountContact, evmAccounts]);

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
    if (!selectedAccount) {
      throw new Error('No account selected');
    }
    if (mainAddress === selectedAccount.address) {
      moveToParent();
    } else {
      moveToChild();
    }
  };

  const moveToParent = async () => {
    setSending(true);

    usewallet
      .batchBridgeNftFromEvm(props.data.nft.flowIdentifier, [props.data.nft.id])
      .then(async (txId) => {
        usewallet.listenTransaction(
          txId,
          true,
          `Move complete`,
          `You have moved 1 ${props.data.nft.contractName} from evm to your flow address. \nClick to view this transaction.`
        );
        props.handleCloseIconClicked();
        await usewallet.setDashIndex(0);
        setSending(false);
        history.push(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((error) => {
        consoleError(error);
        setSending(false);
        setFailed(true);
      });
  };

  const moveToChild = async () => {
    setSending(true);
    usewallet
      .batchBridgeChildNFTFromEvm(selectedAccount!.address!, props.data.nft.flowIdentifier, [
        props.data.nft.id,
      ])
      .then(async (txId) => {
        usewallet.listenTransaction(
          txId,
          true,
          `Move complete`,
          `You have moved ${[props.data.nft.id].length} ${
            props.data.nft.contractName
          } from evm to your flow address. \nClick to view this transaction.`
        );
        props.handleCloseIconClicked();
        await usewallet.setDashIndex(0);
        setSending(false);
        history.push(`/dashboard?activity=1&txId=${txId}`);
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

  const renderContent = () => {
    const getUri = () => {
      return (
        <>
          {props.data.media &&
            (props.data.media.type !== MatchMediaType.VIDEO ? (
              <CardMedia
                sx={{ width: '72px', height: '72px', borderRadius: '8px' }}
                image={props.data.media ? replaceIPFS(props.data.media.image) : ''}
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
          <FRWProfileCard contact={props.data.userContact} />
          <Box sx={{ height: '8px' }}></Box>
          <FRWDropdownProfileCard
            contacts={parentAndChildWallets}
            setSelectedChildAccount={setSelectedChildAccount}
          />
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
              <Typography
                color="text.nonselect"
                sx={{ fontWeight: '400', display: 'inline-block', fontSize: '14px' }}
              >
                {props.data.contract && props.data.contract.name}
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
            <InfoIcon fontSize="medium" color="primary" style={{ margin: '0px 12px auto 12px' }} />
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '12px' }}>
              {chrome.i18n.getMessage('Your__address__is__currently__processing')}
            </Typography>
          </Box>
        </SlideRelative>
        <WarningStorageLowSnackbar isLowStorage={isLowStorage} />
        <WarningNFTNotOnboardedSnackbar
          isNotOnboarded={props?.data?.nft && !props?.data?.nft?.flowIdentifier}
        />

        <Button
          onClick={sendNFT}
          disabled={sending || occupied || !props?.data?.nft?.flowIdentifier}
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
            mb: '33px',
          }}
        >
          {props?.data?.nft ? (
            renderButtonContent({
              sending,
              failed,
            })
          ) : (
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
              {chrome.i18n.getMessage('Loading')}
            </Typography>
          )}
        </Button>
      </Box>
    );
  };

  const renderButtonContent = ({ sending, failed }: { sending: boolean; failed: boolean }) => {
    if (sending) {
      return (
        <>
          <LLSpinner size={28} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
            {chrome.i18n.getMessage('Working_on_it')}
          </Typography>
        </>
      );
    }

    if (failed) {
      return (
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
          {chrome.i18n.getMessage('Transaction__failed')}
        </Typography>
      );
    }

    return (
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
        {chrome.i18n.getMessage('Move')}
      </Typography>
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

export default MoveNftFromEvm;
