import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, CardMedia } from '@mui/material';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CoinItem } from 'background/service/coinList';
import theme from '../../style/LLTheme';
import { ThemeProvider } from '@mui/material/styles';
import UnstakeAmount from './components/UnstakeAmount'
import { useWallet } from 'ui/utils';
import { withPrefix } from 'ui/utils/address';
import IconSwitch from '../../../components/iconfont/IconSwitch';
import {
  LLSpinner,
} from 'ui/FRWComponent';
import { Contact } from 'background/service/networkModel';
import { Presets } from 'react-component-transition';
import CancelIcon from '../../../components/iconfont/IconClose';
import { LLHeader } from '@/ui/FRWComponent';
import UnstakeConfirm from './components/UnstakeConfirm';



const UnstakePage = () => {
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
  const location = useParams();
  const [userWallet, setWallet] = useState<any>(null);
  const [currentCoin, setCurrentCoin] = useState<string>('flow');
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [exceed, setExceed] = useState(false);
  const [amount, setAmount] = useState<string | undefined>('0');
  const [network, setNetwork] = useState('mainnet');
  const [coinInfo, setCoinInfo] = useState<CoinItem>(empty);
  const [nodeid, setNodeid] = useState<any>(null);
  const [delegateid, setDelegate] = useState<any>(null);
  const [token0, setToken0] = useState<any>(null);
  const [swapTypes, setSwapTypes] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(false);
  
  const [nodeInfo, setNodeinfo] = useState<any>({});
  const [apr, setApr] = useState<any>(0);
  const [errorType, setErrorType] = useState<any>(null);

  const setInputAmount = async (value) => {
    const inputAmount = (nodeInfo.tokensStaked * value).toString()
    setAmount(inputAmount)
  }
  const setUserWallet = async () => {
    const nodeid = location['nodeid'];
    const delegateid = location['delegateid'];
    setNodeid(nodeid)
    setDelegate(delegateid)
    // const walletList = await storage.get('userWallet');
    setLoading(true);
    const token = await usewallet.getCurrentCoin();
    const wallet = await usewallet.getCurrentWallet();
    const network = await usewallet.getNetwork();
    usewallet.delegateStore().then((res) => {
      const nodeinfo = res[nodeid][delegateid];
      console.log(nodeinfo, ' nodeinfo')
      setNodeinfo(nodeinfo)
    }).catch((err)=>{
      console.log(err)
    });
    setNetwork(network);
    setCurrentCoin(token);
    // userWallet
    await setWallet(wallet);
    const coinList = await usewallet.getCoinList()
    const coinInfo = coinList.find(coin => coin.unit.toLowerCase() === 'flow');
    console.log(coinList);

    setCoinInfo(coinInfo!);
    setLoading(false);
    return;
  };
  
  const getApy = async () => {
    const result = await usewallet.getApr();
    setApr(result);
  };


  useEffect(() => {
    getApy();
    setUserWallet();
    setToken0(flowToken);
  },[])


  return (
    <div className="page">
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <LLHeader title="Unstake Amount" help={false} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap:'10px',  px: '16px'}}>
            <Box>
              {/* <Box sx={{zIndex: 999, backgroundColor: '#121212'}}>
                <LLContactCard contact={location.state.contact} hideCloseButton={false} isSend={true}/>
              </Box> */}
            </Box>
            {coinInfo.unit && 
              <UnstakeAmount
                token={token0}
                amount={amount} 
                nodeInfo={nodeInfo}
                setAmount={setAmount}
                setSwapTypes={setSwapTypes}
                setError={()=> {
                  setErrorType(Error.Exceed);
                }}
                removeError={()=> {
                  setErrorType(null);
                }}
                coinInfo={coinInfo}
              />
            }
          </Box>
          <Box sx={{display:'flex',padding:'0 22px'}}>
            <Box sx={{display:'flex',justifyContent:'space-between',padding:'19px 14px 16px', width:'100%',backgroundColor:'#121212', borderRadius:'0 0 12px 12px',marginTop:'-3px'}}>
              <Box>
                <Button
                  onClick={() => {setInputAmount(0.3)}}
                  variant="contained"
                  size="large"
                  sx={{
                    height: '33px',
                    flexGrow: 1,
                    borderRadius: '16px',
                    backgroundColor:'rgba(96,194,147, 0.16)',
                    color:'#60C293',
                    width:'90px',
                    textTransform: 'capitalize',
                    '&:hover': {
                      backgroundColor: 'rgba(96,194,147, 0.06)',
                    },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ color:'#60C293', fontWeight: 'normal' }}
                  > 
                    30%
                  </Typography>
                </Button>
              </Box>
              <Box>
                <Button
                  onClick={() => {setInputAmount(0.5)}}
                  variant="contained"
                  size="large"
                  sx={{
                    height: '33px',
                    width:'90px',
                    flexGrow: 1,
                    borderRadius: '16px',
                    backgroundColor:'rgba(96,194,147, 0.16)',
                    color:'#60C293',
                    textTransform: 'capitalize',
                    '&:hover': {
                      backgroundColor: 'rgba(96,194,147, 0.06)',
                    },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ color:'#60C293', fontWeight: 'normal' }}
                  > 
                    50%
                  </Typography>
                </Button>
              </Box>
              <Box>
                <Button
                  onClick={() => {setInputAmount(1)}}
                  variant="contained"
                  size="large"
                  sx={{
                    height: '33px',
                    width:'90px',
                    backgroundColor:'rgba(96,194,147, 0.16)',
                    color:'#60C293',
                    flexGrow: 1,
                    borderRadius: '16px',
                    textTransform: 'capitalize',
                    '&:hover': {
                      backgroundColor: 'rgba(96,194,147, 0.06)',
                    },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ color:'#60C293', fontWeight: 'normal' }}
                  > 
                    Max
                  </Typography>
                </Button>
              </Box>
            </Box>
          </Box>
          <Box sx={{height:'16px'}}/>
          <Box sx={{display: 'flex', borderRadius:'12px', flexDirection:'column', backgroundColor:'#121212', mx: '18px', mb: '35px', mt:'10px', padding:'18px'}}>
            <Box sx={{display: 'flex',justifyContent:'space-between'}}>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'start',
                  fontSize: '14px',
                  color:'#e6e6e6'
                }}>
                Rate
              </Typography>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'end',
                  fontSize: '14px',
                  color:'#e6e6e6'
                }}>
                {apr * 100}%
              </Typography>
            </Box>
            <Box sx={{width:'100%', backgroundColor:'#333333', height:'1px',margin:'8px 0'}}></Box>
            <Box sx={{display: 'flex',justifyContent:'space-between'}}>
              <Typography variant="body1"           
                sx={{
                  alignSelf: 'start',
                  fontSize: '14px',
                  color:'#e6e6e6'
                }}>
                Est. annual reward
              </Typography>
              <Box>
                <Typography variant="body1"           
                  sx={{
                    fontSize: '14px',
                    color:'#e6e6e6',
                    textAlign:'right', 
                  }}>
                  {(Number(amount) * apr).toFixed(2)} flow
                </Typography>
                <Typography variant="body1"           
                  sx={{
                    fontSize: '12px',
                    color:'#e6e6e6',
                    display:'inline',
                    textAlign:'right', 
                  }}> 
                  ≈ ${parseFloat((coinInfo.price * (Number(amount) * apr)).toFixed(2)).toLocaleString('en-US')}
                  <Typography sx={{color:'#5E5E5E', display:'inline', textAlign:'right', fontSize:'12px'}}> USD</Typography>
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{display: 'flex', gap:'8px', mx: '18px', mb: '35px', mt:'10px'}}>

            <Button
              onClick={() => {setConfirmationOpen(true)}}
              variant="contained"
              size="large"
              sx={{
                backgroundColor:'#60C293',
                height: '48px',
                flexGrow: 1,
                borderRadius: '8px',
                textTransform: 'capitalize',
              }}
              disabled={Number(amount) <= 0 || errorType || isLoading}
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
          <UnstakeConfirm
            isConfirmationOpen={isConfirmationOpen}
            data={{ amount: amount, coinInfo: coinInfo, nodeInfo: nodeInfo, apr: apr, nodeid: nodeid, delegateid:delegateid,}}
            handleCloseIconClicked={() => setConfirmationOpen(false)}
            handleCancelBtnClicked={() => setConfirmationOpen(false)}
            handleAddBtnClicked={() => {
              setConfirmationOpen(false);
            }}
          />


        </Box>
      </ThemeProvider>
    </div>
  );
}


export default UnstakePage;