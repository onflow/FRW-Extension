import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, IconButton, CardMedia } from '@mui/material';
import { useHistory, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CoinItem } from 'background/service/coinList';
import theme from '../../style/LLTheme';
import { ThemeProvider } from '@mui/material/styles';
import TransferAmount from './TransferAmount'
import { useWallet } from 'ui/utils';
import { withPrefix } from 'ui/utils/address';
import TransferConfirmation from './TransferConfirmation';
import {
  LLContactCard,
} from 'ui/FRWComponent';
import { Contact } from 'background/service/networkModel';
import { Presets } from 'react-component-transition';
import CancelIcon from '../../../components/iconfont/IconClose';
import { LLHeader } from '@/ui/FRWComponent';

interface ContactState {
  contact: Contact
}

const SendAmount = () => {

  const userContact = {
    address: '',
    id: 0,
    contact_name: '',
    avatar: '',
    domain: {
      domain_type: 999,
      value: '',
    },
  } as unknown as Contact;

  const empty: CoinItem = {
    coin: '',
    unit: '',
    balance: 0,
    price: 0,
    change24h: 0,
    total: 0,
    icon: '',
  }

  const history = useHistory();
  const location = useLocation<ContactState>();
  const usewallet = useWallet();
  const [userWallet, setWallet] = useState<any>(null);
  const [currentCoin, setCurrentCoin] = useState<string>('flow');
  const [coinList, setCoinList] = useState<CoinItem[]>([]);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [exceed, setExceed] = useState(false);
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [secondAmount, setSecondAmount] = useState('0.0');
  const [validated, setValidated] = useState<any>(null);
  const [userInfo, setUser] = useState<Contact>(userContact);
  const [network, setNetwork] = useState('mainnet');
  const [coinInfo, setCoinInfo] = useState<CoinItem>(empty);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [childType, setChildType] = useState<string>('');
  const [minAmount, setMinAmount] = useState<any>(0);

  const setUserWallet = async () => {
    // const walletList = await storage.get('userWallet');
    setLoading(true);
    const token = await usewallet.getCurrentCoin();
    let wallet
    if (childType === 'evm') {
      wallet = await usewallet.getEvmWallet();
    } else {
      wallet = await usewallet.getCurrentWallet();
    }
    console.log('wallet ', wallet)
    const network = await usewallet.getNetwork();
    setNetwork(network);
    setCurrentCoin(token);
    // userWallet
    await setWallet(wallet);
    const coinList = await usewallet.getCoinList()
    setCoinList(coinList);
    const coinInfo = coinList.find(coin => coin.unit.toLowerCase() === token.toLowerCase());
    console.log('coinInfo ', coinInfo)

    setCoinInfo(coinInfo!);
    const info = await usewallet.getUserInfo(false);
    const isChild = await usewallet.getActiveWallet();
    console.log('isChild ', info, isChild)
    if (isChild) {
      if (isChild !== 'evm') {
        const childResp = await usewallet.checkUserChildAccount();
        const cwallet = childResp[wallet.address!];
        userContact.avatar = cwallet.thumbnail.url;
        userContact.contact_name = cwallet.name;

      }
      userContact.address = withPrefix(wallet.address!) || '';
      if (isChild === 'evm') {
        userContact.avatar = '';
        userContact.contact_name = 'evm';

      }
    } else {
      userContact.address = withPrefix(wallet.address) || '';
      userContact.avatar = info.avatar;
      userContact.contact_name = info.username;
    }
    setUserMinAmount();
    setUser(userContact);
  };

  const setUserMinAmount = async () => {
    try {
      // Try fetching the min amount from the API
      const minAmount = await usewallet.openapi.getAccountMinFlow(userContact.address);
      setMinAmount(minAmount);
    } catch (error) {
      // If there's an error, set the min amount to 0.001
      console.error('Error fetching min amount:', error);
      setMinAmount(0.001);
    }
  };


  const checkAddress = async () => {
    const child = await usewallet.getActiveWallet();
    setChildType(child);

    //wallet controller api
    try {
      const address = withPrefix(location.state.contact.address);
      const validatedResult = await usewallet.checkAddress(address!);
      setValidated(validatedResult);
      return validatedResult;
    } catch (err) {
      setValidated(false);
    }
    setLoading(false);
  };

  const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const updateCoinInfo = () => {
    const coin = coinList.find(coin => coin.unit.toLowerCase() === currentCoin.toLowerCase());
    if (coin) {
      setCoinInfo(coin);
    }
  };

  useEffect(() => {
    checkAddress();
  }, [])

  useEffect(() => {
    setUserWallet();
  }, [childType])

  useEffect(() => {
    updateCoinInfo();
  }, [currentCoin])

  return (
    <div className="page">
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <LLHeader title={chrome.i18n.getMessage('Send_to')} help={true} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', px: '16px' }}>
            <Box>
              <Box sx={{ zIndex: 999, backgroundColor: '#121212' }}>
                <LLContactCard contact={location.state.contact} hideCloseButton={false} isSend={true} />
              </Box>
              <Presets.TransitionSlideUp>
                {validated !== null && (
                  validated ? <></> :
                    <Box
                      sx={{
                        width: '95%',
                        backgroundColor: 'error.light',
                        mx: 'auto',
                        borderRadius: '0 0 12px 12px',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <CancelIcon size={24} color={'#E54040'} style={{ margin: '8px' }} />
                        <Typography variant="body1" color="text.secondary">
                          {chrome.i18n.getMessage('Invalid_address_in')}{` ${network}`}
                        </Typography>
                      </Box>
                    </Box>
                )}
              </Presets.TransitionSlideUp>
            </Box>

            <Typography variant="body1"
              sx={{
                alignSelf: 'start',
                fontSize: '14px',
              }}>
              {chrome.i18n.getMessage('Transfer__Amount')}
            </Typography>
            {(coinInfo.unit && minAmount) &&
              <TransferAmount
                coinList={coinList}
                amount={amount}
                setAmount={setAmount}
                secondAmount={secondAmount}
                setSecondAmount={setSecondAmount}
                exceed={exceed}
                setExceed={setExceed}
                coinInfo={coinInfo}
                setCurrentCoin={setCurrentCoin}
                minAmount={minAmount}
              />
            }

            {coinInfo.unit &&
              <>
                <Typography variant="body1"
                  sx={{
                    alignSelf: 'start',
                    fontSize: '14px',
                  }}>
                  {chrome.i18n.getMessage('Available__Balance')}
                </Typography>

                <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CardMedia sx={{ width: '18px', height: '18px' }} image={coinInfo.icon} />
                  <Typography variant="body1"
                    sx={{
                      alignSelf: 'start',
                      fontSize: '15px',
                    }}>
                    {
                      (Math.round(coinInfo.balance * 100) / 100).toFixed(2) + ' ' + coinInfo.unit.toUpperCase() + ' ≈ ' + '$ ' + coinInfo.total
                    }
                  </Typography>
                </Box>
              </>
            }
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', gap: '8px', mx: '18px', mb: '35px', mt: '10px' }}>
            <Button
              onClick={history.goBack}
              variant="contained"
              // @ts-expect-error custom color
              color="neutral"
              size="large"
              sx={{
                height: '48px',
                borderRadius: '8px',
                flexGrow: 1,
                textTransform: 'capitalize',
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="text.primary"
              >
                {chrome.i18n.getMessage('Cancel')}
              </Typography>
            </Button>

            <Button
              onClick={() => { setConfirmationOpen(true) }}
              // disabled={true}
              variant="contained"
              color="success"
              size="large"
              sx={{
                height: '48px',
                flexGrow: 1,
                borderRadius: '8px',
                textTransform: 'capitalize',
              }}
              disabled={validated === null || exceed === true || amount === null || parseFloat(amount || '-1') < 0}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="text.primary"
              >
                {chrome.i18n.getMessage('Next')}
              </Typography>
            </Button>
          </Box>
          {validated
            &&
            <TransferConfirmation
              isConfirmationOpen={isConfirmationOpen}
              data={{ contact: location.state.contact, amount: amount, secondAmount: secondAmount, userContact: userInfo, tokenSymbol: currentCoin, coinInfo: coinInfo, childType }}
              handleCloseIconClicked={() => setConfirmationOpen(false)}
              handleCancelBtnClicked={() => setConfirmationOpen(false)}
              handleAddBtnClicked={() => {
                setConfirmationOpen(false);
              }}
            />
          }

        </Box>
      </ThemeProvider>
    </div>
  );
}


export default SendAmount;