import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, IconButton, CardMedia } from '@mui/material';
// import { useHistory, useLocation } from 'react-router-dom';
// import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CoinItem } from 'background/service/coinList';
import theme from '../../style/LLTheme';
import { ThemeProvider } from '@mui/material/styles';
import TransferAmount from './TransferAmount'
import SwapTarget from './SwapTarget'
import { useWallet } from 'ui/utils';
import { withPrefix } from 'ui/utils/address';
import IconSwitch from '../../../components/iconfont/IconSwitch';
import TransferConfirmation from './TransferConfirmation';
import SelectToken from './SelectToken';
import {
  LLSpinner,
} from 'ui/FRWComponent';
import { Contact } from 'background/service/networkModel';
// import { Presets } from 'react-component-transition';
// import CancelIcon from '../../../components/iconfont/IconClose';
import { LLHeader } from '@/ui/FRWComponent';
// import { TokenListProvider } from 'flow-native-token-registry';

import Increment from '../../FRWAssets/svg/increment.svg';


const Swap = () => {
  enum ENV {
    Mainnet = 'mainnet',
    Testnet = 'testnet'
  }
  enum Error {
    Exceed = 'Insufficient balance',
    Fail = 'Cannot find swap pair'
  }

  // declare enum Strategy {
  //   GitHub = 'GitHub',
  //   Static = 'Static',
  //   CDN = 'CDN'
  // }
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

  const flowToken = {
    'name': 'Flow',
    'address': {
      'mainnet': '0x1654653399040a61',
      'testnet': '0x7e60df042a9c0868',
      'crescendo': '0x7e60df042a9c0868',
    },
    'contract_name': 'FlowToken',
    'storage_path': {
      'balance': '/public/flowTokenBalance',
      'vault': '/storage/flowTokenVault',
      'receiver': '/public/flowTokenReceiver'
    },
    'decimal': 8,
    'icon': 'https://raw.githubusercontent.com/Outblock/Assets/main/ft/flow/logo.png',
    'symbol': 'flow',
    'website': 'https://www.onflow.org'
  }
  const empty: CoinItem = {
    coin: '',
    unit: '',
    balance: 0,
    price: 0,
    change24h: 0,
    total: 0,
    icon:'',
  }
  
  const usewallet = useWallet();
  const [userWallet, setWallet] = useState<any>(null);
  const [currentCoin, setCurrentCoin] = useState<string>('flow');
  const [coinList, setCoinList] = useState<CoinItem[]>([]);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [selectTokenOpen, setSelectToken] = useState(false);
  // const [exceed, setExceed] = useState(false);
  const [amount, setAmount] = useState<string | undefined>('0');
  const [outAmount, setOutAmount] = useState<any>(0);
  // const [validated, setValidated] = useState<any>(null);
  const [userInfo, setUser] = useState<Contact>(userContact);
  const [selectTarget, setSelectTarget] = useState<number>(0);
  const [network, setNetwork] = useState('mainnet');
  const [coinInfo, setCoinInfo] = useState<CoinItem>(empty);
  const [estimateInfo, setEstimateInfo] = useState<any>(null);
  const [token1, setToken1] = useState<any>(null);
  const [token0, setToken0] = useState<any>(null);
  const [tokens, setTokens] = useState<any>([]);
  const [swapTypes, setSwapTypes] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [swapPrice, setPrice] = useState<any>(0);
  const [errorType, setErrorType] = useState<any>(null);

  const setUserWallet = async () => {
    // const walletList = await storage.get('userWallet');
    setLoading(true);
    const token = await usewallet.getCurrentCoin();
    const wallet = await usewallet.getCurrentWallet();
    const network = await usewallet.getNetwork();
    setNetwork(network);
    setCurrentCoin(token);
    // userWallet
    await setWallet(wallet);
    const coinList = await usewallet.getCoinList()
    setCoinList(coinList);
    const coinInfo = coinList.find(coin => coin.unit.toLowerCase() === token.toLowerCase());
    setCoinInfo(coinInfo!);

    const info = await usewallet.getUserInfo(false);
    userContact.address = withPrefix(wallet.address) || '';
    userContact.avatar = info.avatar;
    userContact.contact_name = info.username;
    setUser(userContact);
    // const result = await usewallet.openapi.fetchTokenList(network);
    usewallet.openapi.getAllToken().then((res) => {
      setTokens([...res])
    });
    setLoading(false);
    return;
  };


  const updateCoinInfo =(token) => {
    
    if (selectTarget) {
      setToken1(token)
    } else {
      const coin = coinList.find(coin => coin.unit.toLowerCase() === token.symbol.toLowerCase());
      if (coin){
        setCoinInfo(coin);
        setToken0(token);
      }
    }
    return;
  };

  const switchSide =() => {
    const currentT1 = token1;
    const currentT0 = token0;
    const currentOut = outAmount;
    const currentAmount = amount;
    if (token0 && token1){
      setToken1(currentT0);
      setToken0(currentT1);
      setOutAmount(Number(currentAmount));
      setAmount(currentOut.toString());

      const coin = coinList.find(coin => coin.unit.toLowerCase() === currentT1.symbol.toLowerCase());
      if (coin) {
        setCoinInfo(coin);
      }
    }
    return;
  };

  const setEstimateOut = (outputAmount) => {

    setOutAmount(outputAmount);
    setSwapTypes(1);
  };
  
  const estimateOut = async () => {
    setLoading(true);
    const network = await usewallet.getNetwork();
    if (token0 && token1){
      if (outAmount <= 0) {
        setLoading(false);
        return;
      }
      const token0Address = `A.${token0.address[network].slice(2)}.${token0.contract_name}`
      const token1Address = `A.${token1.address[network].slice(2)}.${token1.contract_name}`
      try {
        const result = await usewallet.openapi.swapOutEstimate(network,token0Address,token1Address,outAmount);
        let price : any = result.data.tokenOutAmount / parseFloat(result.data.tokenInAmount);
        price = (Math.round(price * 1000) / 1000).toFixed(3)
        setPrice(price);
        if (errorType == Error.Fail) {
          setErrorType(null);
        }
        setEstimateInfo(result.data);
        setAmount((Math.round(result.data.tokenInAmount * 1000) / 1000).toFixed(4));
      } catch (err) {
        setLoading(false);
        setErrorType(Error.Fail);
      }
    }
    setLoading(false);
    return;
  }

  const estimate = async() => {
    setLoading(true);
    if (Number(amount) <= 0) {
      setLoading(false);
      return;
    }
    const network = await usewallet.getNetwork();
    if (token0 && token1){
      const token0Address = `A.${token0.address[network].slice(2)}.${token0.contract_name}`
      const token1Address = `A.${token1.address[network].slice(2)}.${token1.contract_name}`
      try {
        const result = await usewallet.openapi.swapEstimate(network,token0Address,token1Address,amount);
        let price : any = result.data.tokenOutAmount / parseFloat(result.data.tokenInAmount);
        price = (Math.round(price * 1000) / 1000).toFixed(3)
        setPrice(price);
        if (errorType == Error.Fail) {
          setErrorType(null);
        }
        setEstimateInfo(result.data);
        setOutAmount((Math.round(result.data.tokenOutAmount * 1000) / 1000).toFixed(4));
        setSwapTypes(0);
      } catch (err) {
        setLoading(false);
        setErrorType(Error.Fail);
      }
    }
    setLoading(false);

  };

  useEffect(() => {
    setUserWallet();
    setToken0(flowToken);
  },[])

  useEffect(() => {
    if (swapTypes) {
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      estimate();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  },[amount])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      estimate();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  },[token1])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      estimate();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  },[token0])

  useEffect(() => {
    if (!swapTypes) {
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      estimateOut();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  },[outAmount])

  return (
    <div className="page">
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <LLHeader title="Swap (Beta)" help={false} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap:'10px',  px: '16px'}}>
            <Box>
              {/* <Box sx={{zIndex: 999, backgroundColor: '#121212'}}>
                <LLContactCard contact={location.state.contact} hideCloseButton={false} isSend={true}/>
              </Box> */}
            </Box>
            {coinInfo.unit && 
              <TransferAmount
                token={token0}
                amount={amount} 
                setAmount={setAmount}
                setSwapTypes={setSwapTypes}
                setError={()=> {
                  setErrorType(Error.Exceed);
                }}
                removeError={()=> {
                  setErrorType(null);
                }}
                coinInfo={coinInfo}
                btnSelect={() => {
                  setSelectToken(true)
                  setSelectTarget(0)
                }}
              />
            }
            <Box sx={{display:'flex', justifyContent:'center', width:'100%', my:'-21px', zIndex:'99'}}>
              {isLoading ?
                <Box sx={{borderRadius:'28px', backgroundColor:'#000',width:'28px',height:'28px'}}>
                  <LLSpinner size={28}/>
                </Box>
                :
                <Box sx={{width:'100%',height:'28px',display:'flex', justifyContent:'center',}}>
                  <Button
                    onClick={()=>switchSide()}
                    sx={{minWidth:'28px',borderRadius:'28px',padding:0,}}
                  >
                    <IconSwitch color={'#41CC5D'} size={28} style={{borderRadius:'28px', border:'3px solid #000'}} />
                  </Button>
                </Box>
              }
            </Box>
            {coinInfo.unit && 
              <SwapTarget 
                token={token1}
                outAmount={outAmount} 
                estimateOut={setEstimateOut}
                btnSelect={() => {
                  setSelectToken(true)
                  setSelectTarget(1)
                }}
              />
            }
          </Box>

          <Box sx={{flexGrow: 1 }}/>
          <Box sx={{display: 'flex', flexDirection:'column', gap:'8px', mx: '18px', mb: '35px', mt:'10px'}}>
            <Box sx={{display: 'flex',justifyContent:'space-between'}}>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'start',
                  fontSize: '12px',
                  color:'#BABABA'
                }}>
                Swap price
              </Typography>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'end',
                  fontSize: '12px',
                  color:'#00EF8B'
                }}>
                {estimateInfo && !isLoading ? `1 ${token0.symbol}  ≈ ${swapPrice} ${token1.symbol}` : '-' }
              </Typography>
            </Box>
            <Box sx={{display: 'flex',justifyContent:'space-between'}}>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'start',
                  fontSize: '12px',
                  color:'#BABABA'
                }}>
                Provider
              </Typography>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'end',
                  fontSize: '12px',
                  color:'#BABABA'
                }}>
                {estimateInfo ? 
                  (
                    <Box sx={{display:'flex',alignItems:'center'}}>
                      <img src={Increment} style={{height: '14px', width: '14px', marginRight:'4px'}}/>
                      Increment.fi
                    </Box>
                  ) 
                  : 
                  '-' 
                }
              </Typography>
            </Box>
            <Box sx={{display: 'flex', justifyContent:'space-between'}}>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'start',
                  fontSize: '12px',
                  color:'#BABABA'
                }}>
                Price Impact
              </Typography>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'end',
                  fontSize: '12px',
                  color:'#00EF8B'
                }}>
                {estimateInfo  && !isLoading ? `-${estimateInfo.priceImpact * 100}%` : '-' }
              </Typography>
            </Box>
            {/* <Box sx={{display: 'flex', justifyContent:'space-between'}}>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'start',
                  fontSize: '12px',
                  color:'#BABABA'
                }}>
                Estimated Fees
              </Typography>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'end',
                  fontSize: '12px',
                  color:'#BABABA'
                }}>
                {estimateInfo  && !isLoading ? estimateInfo.priceImpact : '-' }
              </Typography>
            </Box> */}
          </Box>

          <Box sx={{display: 'flex', gap:'8px', mx: '18px', mb: '35px', mt:'10px'}}>

            <Button
              onClick={() => {setConfirmationOpen(true)}}
              variant="contained"
              color="success"
              size="large"
              sx={{
                height: '48px',
                flexGrow: 1,
                borderRadius: '8px',
                textTransform: 'capitalize',
              }}
              disabled={outAmount <= 0 || Number(amount) <= 0 || errorType || isLoading || token1 == null}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="text.primary"
              > 
                {errorType ? 
                  errorType :
                  chrome.i18n.getMessage('Next')
                }
              </Typography>
            </Button>
          </Box>

          <TransferConfirmation
            isConfirmationOpen={isConfirmationOpen}
            data={{ amount: amount, outamount: outAmount,token0: token0, token1: token1, estimateInfo: estimateInfo, swapPrice:swapPrice, swapTypes:swapTypes}}
            handleCloseIconClicked={() => setConfirmationOpen(false)}
            handleCancelBtnClicked={() => setConfirmationOpen(false)}
            handleAddBtnClicked={() => {
              setConfirmationOpen(false);
            }}
          />

          <SelectToken
            isConfirmationOpen={selectTokenOpen}
            data={{ tokens: tokens, token0: token0, token1:token1, network:network}}
            handleCloseIconClicked={() => setSelectToken(false)}
            updateCoinInfo={updateCoinInfo}
          />

        </Box>
      </ThemeProvider>
    </div>
  );
}


export default Swap;