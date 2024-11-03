import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button, Typography, Drawer, IconButton, Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { CoinItem } from 'background/service/coinList';
import { ThemeProvider } from '@mui/material/styles';
import TransferFrom from '../TransferFrom';
import TransferTo from '../TransferTo';
import MoveToken from './MoveToken'
import { useWallet } from 'ui/utils';
import { withPrefix } from 'ui/utils/address';
import IconSwitch from '../../../../../../../../components/iconfont/IconSwitch';
import {
  LLSpinner,
} from 'ui/FRWComponent';
import { Contact } from 'background/service/networkModel';
import wallet from '@/background/controller/wallet';


interface TransferConfirmationProps {
  isConfirmationOpen: boolean;
  data: any;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}


const MoveFromEvm = (props: TransferConfirmationProps) => {

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

  const evmContact = {
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

  const usewallet = useWallet();
  const history = useHistory();
  const [userWallet, setWallet] = useState<any>(null);
  const [currentCoin, setCurrentCoin] = useState<string>('flow');
  const [coinList, setCoinList] = useState<CoinItem[]>([]);
  // const [exceed, setExceed] = useState(false);
  const [amount, setAmount] = useState<string | undefined>('');
  // const [validated, setValidated] = useState<any>(null);
  const [userInfo, setUser] = useState<Contact>(userContact);
  const [evmUserInfo, setEvmUser] = useState<Contact>(evmContact);
  const [network, setNetwork] = useState('mainnet');
  const [evmAddress, setEvmAddress] = useState('');
  const [coinInfo, setCoinInfo] = useState<CoinItem>(empty);
  const [secondAmount, setSecondAmount] = useState('0.0');
  const [isLoading, setLoading] = useState<boolean>(false);
  const [exceed, setExceed] = useState(false);

  const setUserWallet = async () => {
    // const walletList = await storage.get('userWallet');
    setLoading(true);
    const wallet = await usewallet.getMainWallet();
    const network = await usewallet.getNetwork();
    const token = await usewallet.getCurrentCoin();
    setNetwork(network);
    setCurrentCoin(token);
    // userWallet
    await setWallet(wallet);
    const evmWallet = await usewallet.getEvmWallet();
    setEvmAddress(evmWallet.address);
    const coinList = await usewallet.getCoinList()
    setCoinList(coinList);
    const tokenResult = await usewallet.openapi.getTokenInfo(token, network);
    const coinInfo = coinList.find(coin =>
      coin && coin.unit.toLowerCase() === tokenResult!.symbol.toLowerCase()
    );
    setCoinInfo(coinInfo!);

    const info = await usewallet.getUserInfo(false);
    userContact.address = withPrefix(wallet) || '';
    userContact.avatar = info.avatar;
    userContact.contact_name = info.username;
    setUser(userContact);

    evmContact.address = withPrefix(evmWallet.address) || '';
    evmContact.avatar = evmWallet.icon;
    evmContact.contact_name = evmWallet.name;
    setEvmUser(evmContact);

    // const result = await usewallet.openapi.fetchTokenList(network);
    setLoading(false);
    return;
  };

  const moveToken = async () => {
    setLoading(true);
    usewallet.withdrawFlowEvm(amount, userInfo.address).then(async (createRes) => {
      usewallet.listenTransaction(createRes, true, 'Transfer to EVM complete', `Your have moved ${amount} Flow to your EVM address ${evmAddress}. \nClick to view this transaction.`);
      await usewallet.setDashIndex(0);

      setLoading(false);
      props.handleCloseIconClicked();
    }).catch((err) => {
      console.log(err);
      setLoading(false);
    });
  };

  const bridgeToken = async () => {
    setLoading(true);
    const tokenResult = await wallet.openapi.getTokenInfo(currentCoin, network);

    usewallet.bridgeToFlow(tokenResult!['flowIdentifier'], amount, tokenResult).then(async (createRes) => {
      usewallet.listenTransaction(createRes, true, 'Transfer to EVM complete', `Your have moved ${amount} Flow to your EVM address ${evmAddress}. \nClick to view this transaction.`);
      await usewallet.setDashIndex(0);

      setLoading(false);
      props.handleCloseIconClicked();
    }).catch((err) => {
      console.log(err);
      setLoading(false);
    });
  };


  const handleCoinInfo = async () => {
    if (coinList.length > 0) {
      const coinInfo = coinList.find(coin => coin.unit.toLowerCase() === currentCoin.toLowerCase());
      setCoinInfo(coinInfo!);
    }
  };


  const handleMove = async () => {
    if (currentCoin.toLowerCase() === 'flow') {
      moveToken();
    } else {
      bridgeToken();
    }
  };


  useEffect(() => {
    setUserWallet();
  }, [])

  useEffect(() => {
    handleCoinInfo();
  }, [currentCoin])


  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1200 !important' }}
      open={props.isConfirmationOpen}
      transitionDuration={300}
      PaperProps={{
        sx: { width: '100%', height: 'auto', background: '#222', borderRadius: '18px 18px 0px 0px' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', px: '16px' }}>
        <Box
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            display: 'flex',
            pb: '6px'
          }}
        >
          <Box sx={{ width: '40px' }}></Box>
          <Box sx={{ pt: '16px' }}>
            <Typography sx={{ fontWeight: '700', fontFamily: 'e-Ukraine', fontSize: '20px' }}>
              {chrome.i18n.getMessage('move_tokens')}
            </Typography>
          </Box>
          <Box sx={{ pt: '14px' }} onClick={props.handleCancelBtnClicked}>
            <IconButton>
              <CloseIcon
                fontSize="medium"
                sx={{ color: 'icon.navi', cursor: 'pointer' }}
              />
            </IconButton>
          </Box>
        </Box>
        {userWallet &&
          <TransferTo
            wallet={evmAddress}
            userInfo={userInfo}
          />
        }
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', my: '-21px', zIndex: '99' }}>
          {isLoading ?
            <Box sx={{ borderRadius: '28px', backgroundColor: '#000', width: '28px', height: '28px' }}>
              <LLSpinner size={28} />
            </Box>
            :
            <Box sx={{ width: '100%', height: '28px', display: 'flex', justifyContent: 'center', }}>
              <Button
                sx={{ minWidth: '28px', borderRadius: '28px', padding: 0, }}
              >
                <IconSwitch color={'#41CC5D'} size={28} style={{ borderRadius: '28px', border: '3px solid #000' }} />
              </Button>
            </Box>
          }
        </Box>
        {evmAddress &&

          <TransferFrom
            wallet={userWallet}
            userInfo={userInfo}
          />
        }
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mx: '18px', mb: '35px', mt: '10px' }}>
        {(coinInfo.unit && coinInfo) &&
          <MoveToken
            coinList={coinList}
            amount={amount}
            setAmount={setAmount}
            secondAmount={secondAmount}
            setSecondAmount={setSecondAmount}
            exceed={exceed}
            setExceed={setExceed}
            coinInfo={coinInfo}
            setCurrentCoin={setCurrentCoin}
          />
        }
      </Box>

      <Box sx={{ display: 'flex', gap: '8px', mx: '18px', mb: '35px', mt: '10px' }}>

        <Button
          onClick={() => { handleMove() }}
          variant="contained"
          color="success"
          size="large"
          sx={{
            height: '48px',
            flexGrow: 1,
            borderRadius: '8px',
            textTransform: 'capitalize',
          }}
          disabled={Number(amount) <= 0 || isLoading}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'bold' }}
            color="text.primary"
          >
            {chrome.i18n.getMessage('Move')}
          </Typography>
        </Button>
      </Box>
    </Drawer>
  );
}


export default MoveFromEvm;