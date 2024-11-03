import React, { useEffect, useState } from 'react';
import { useWallet } from 'ui/utils';
import { useHistory, useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { Typography, IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { StyledEngineProvider } from '@mui/material/styles';
import TokenInfoCard from './TokenInfoCard';
import StackingCard from './StackingCard';
import PriceCard from './PriceCard';
import ClaimTokenCard from './ClaimTokenCard';
import MoveFromEvm from '../EvmMove/MoveFromEvm';
import MoveFromChild from '../EvmMove/MoveFromChild';
import MoveFromFlow from '../EvmMove/MoveFromFlow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PriceProvider } from '@/background/service/networkModel';
import LLComingSoon from '@/ui/FRWComponent/LLComingSoonWarning';
import tips from 'ui/FRWAssets/svg/tips.svg';

const useStyles = makeStyles(() => ({
  page: {
    width: '100%',
    height: '100%',
    overflow: 'auto',
    backgroundColor: 'black',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '0 18px',
    paddingTop: '4px',
    width: '100%',
    paddingBottom: '18px',
  },
}));

const TokenDetail = () => {
  const classes = useStyles();
  const wallet = useWallet();
  const history = useHistory();
  const [price, setPrice] = useState(0);
  const [accessible, setAccessible] = useState(true);
  const token = useParams<{ id: string }>().id.toLowerCase();
  const [network, setNetwork] = useState('mainnet');
  const [walletName, setCurrentWallet] = useState({ name: '' });
  const [moveOpen, setMoveOpen] = useState<boolean>(false);
  const [tokenInfo, setTokenInfo] = useState<any>(undefined);
  const [providers, setProviders] = useState<PriceProvider[]>([]);
  const [childAccount, setChildAccount] = useState<any>({});
  const [childType, setChildType] = useState<string>('');
  const [alertOpen, setAlertOpen] = useState<boolean>(false);

  const Header = () => {
    return (
      <Box sx={{ display: 'flex', mx: '-12px' }}>
        <IconButton onClick={history.goBack}>
          <ArrowBackIcon sx={{ color: 'icon.navi' }} />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        {/* <IconButton >
          <MoreHorizRoundedIcon sx={{ color: 'icon.navi' }} />
        </IconButton> */}
      </Box>
    );
  };

  const getProvider = async () => {
    const result = await wallet.openapi.getPriceProvider(token);
    const tokenResult = await wallet.openapi.getTokenInfo(token);
    if (tokenResult) {
      setTokenInfo(tokenResult);
    }
    setProviders(result);
    if (result.length == 0) {
      const data = await wallet.openapi.getTokenPrices();
      const price = await wallet.openapi.getPricesByAddress(tokenResult!.address, data);
      if (price) {
        setPrice(price);
      }
    }
  };

  const loadNetwork = async () => {
    const network = await wallet.getNetwork();
    const currentWallet = await wallet.getCurrentWallet();
    setCurrentWallet(currentWallet);
    setNetwork(network);
  };

  const requestChildType = async () => {
    const result = await wallet.getActiveWallet();
    const childresp = await wallet.checkUserChildAccount();
    setChildAccount(childresp);
    setChildType(result);
  };

  const renderMoveComponent = () => {
    if (childType === 'evm') {
      return (
        <MoveFromEvm
          isConfirmationOpen={moveOpen}
          data={{ amount: 0 }}
          handleCloseIconClicked={() => setMoveOpen(false)}
          handleCancelBtnClicked={() => setMoveOpen(false)}
          handleAddBtnClicked={() => {
            setMoveOpen(false);
          }}
        />
      );
    } else if (childType) {
      return (
        <MoveFromChild
          isConfirmationOpen={moveOpen}
          data={{ amount: 0 }}
          handleCloseIconClicked={() => setMoveOpen(false)}
          handleCancelBtnClicked={() => setMoveOpen(false)}
          handleAddBtnClicked={() => {
            setMoveOpen(false);
          }}
        />
      );

    }
    else {
      return (
        <MoveFromFlow
          isConfirmationOpen={moveOpen}
          data={{ amount: 0 }}
          handleCloseIconClicked={() => setMoveOpen(false)}
          handleCancelBtnClicked={() => setMoveOpen(false)}
          handleAddBtnClicked={() => {
            setMoveOpen(false);
          }}
        />
      );
    }
  };


  useEffect(() => {
    loadNetwork();
    getProvider();
    requestChildType();
  }, []);

  return (
    <StyledEngineProvider injectFirst>
      <div className={`${classes.page} page`}>
        <div className={classes.container}>
          <Header />
          {!accessible && (
            <Box
              sx={{
                display: 'flex',
                marginBottom: '12px',
                borderRadius: '8px',
                padding: '8px 11px',
                backgroundColor: 'error.light',
              }}
            >
              <img
                style={{ height: '16px', width: '16px', borderRadius: '16px' }}
                src={tips}
              ></img>
              <Typography
                sx={{
                  fontSize: '12px',
                  marginLeft: '5px',
                  color: 'error.main',
                }}
              >
                Flow Wallet doesn’t have access to {`${token}`} in
                {`${walletName.name}`} Account, please check your linked account
                settings.
              </Typography>
            </Box>
          )}
          {tokenInfo &&
            <TokenInfoCard
              price={price}
              token={token}
              setAccessible={setAccessible}
              accessible={accessible}
              setMoveOpen={setMoveOpen}
              tokenInfo={tokenInfo}
              network={network}
              childType={childType}
              childAccount={childAccount}
              setAlertOpen={setAlertOpen}
            />
          }
          {token === 'flow' && <StackingCard network={network} />}
          {/* {network === 'testnet' || network === 'crescendo' && token === 'flow' && <ClaimTokenCard token={token} />} */}
          <ClaimTokenCard token={token} />
          {providers?.length > 0 && (
            <PriceCard
              token={token}
              price={price}
              setPrice={setPrice}
              providers={providers}
            />
          )}
          {
            moveOpen && renderMoveComponent()
          }
          {network === 'mainnet' && (
            <LLComingSoon
              alertOpen={alertOpen}
              handleCloseIconClicked={() => setAlertOpen(false)}
            />
          )}

        </div>
      </div>
    </StyledEngineProvider>
  );
};

export default TokenDetail;
