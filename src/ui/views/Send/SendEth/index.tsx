import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, IconButton, CardMedia } from '@mui/material';
import { useHistory, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CoinItem } from 'background/service/coinList';
import theme from '../../../style/LLTheme';
import { ThemeProvider } from '@mui/material/styles';
import TransferAmount from '../TransferAmount'
import { useWallet, isValidEthereumAddress } from 'ui/utils';
import { withPrefix } from 'ui/utils/address';
import ToEthConfirmation from './ToEthConfirmation';
import EvmConfirmation from './EvmConfirmation'
import {
  LLContactCard,
} from 'ui/FRWComponent';
import { Contact } from 'background/service/networkModel';
import { Presets } from 'react-component-transition';
import CancelIcon from '../../../../components/iconfont/IconClose';
import { LLHeader } from '@/ui/FRWComponent';


interface ContactState {
  contact: Contact
}

const SendEth = () => {

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
  const [evmBalance, setEvmBalance] = useState<any>('');
  const [minAmount, setMinAmount] = useState<any>(0);


  const setUserWallet = async () => {
    // const walletList = await storage.get('userWallet');
    setLoading(true);
    const token = await usewallet.getCurrentCoin();
    const wallet = await usewallet.getEvmWallet();
    const network = await usewallet.getNetwork();
    setNetwork(network);
    setCurrentCoin(token);
    // userWallet
    await setWallet(wallet);
    const coinList = await usewallet.getCoinList()
    setCoinList(coinList);
    const coinInfo = coinList.find(coin => coin.unit.toLowerCase() === token.toLowerCase());

    const balance = await usewallet.getBalance(wallet.address);
    const balanceNumber = Number(balance) / 1e18;
    setEvmBalance(balanceNumber);
    coinInfo!.balance = balanceNumber;
    coinInfo!.total = balanceNumber * coinInfo!.price;
    setCoinInfo(coinInfo!);

    const info = await usewallet.getUserInfo(false);
    userContact.address = withPrefix(wallet.address) || '';
    userContact.avatar = info.avatar;
    userContact.contact_name = info.username;
    const minAmount = await usewallet.openapi.getAccountMinFlow(userContact.address);
    setMinAmount(minAmount);
    setUser(userContact);



  };


  const checkAddress = async () => {
    const childType = await usewallet.getActiveWallet();
    setChildType(childType);
    //wallet controller api
    try {
      const address = location.state.contact.address;
      console.log('000000000000000000000002edcb9a31eda963d5 address ', address)
      const validatedResult = isValidEthereumAddress(address)
      console.log('validatedResult address ', validatedResult)
      setValidated(validatedResult);
      return validatedResult;
    } catch (err) {
      console.log('validatedResult err ', err)
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
    setUserWallet();
    checkAddress();
  }, [])

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
            {coinInfo.unit &&
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
                minAmount={minAmount} />
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
              // onClick={() => {}}
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
          {childType === 'evm' ?
            <EvmConfirmation
              isConfirmationOpen={isConfirmationOpen}
              data={{ contact: location.state.contact, amount: amount, secondAmount: secondAmount, userContact: userInfo, tokenSymbol: currentCoin, coinInfo: coinInfo }}
              handleCloseIconClicked={() => setConfirmationOpen(false)}
              handleCancelBtnClicked={() => setConfirmationOpen(false)}
              handleAddBtnClicked={() => {
                setConfirmationOpen(false);
              }}
            />
            :
            <ToEthConfirmation
              isConfirmationOpen={isConfirmationOpen}
              data={{ contact: location.state.contact, amount: amount, secondAmount: secondAmount, userContact: userInfo, tokenSymbol: currentCoin, coinInfo: coinInfo }}
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


export default SendEth;