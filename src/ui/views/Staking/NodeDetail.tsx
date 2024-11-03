import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, IconButton, ButtonBase } from '@mui/material';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CoinItem } from 'background/service/coinList';
import theme from '../../style/LLTheme';
import { ThemeProvider } from '@mui/material/styles';
import StakeAmount from './components/StakeAmount'
import { useWallet } from 'ui/utils';
import { withPrefix } from 'ui/utils/address';
import IconChevronRight from '../../../components/iconfont/IconChevronRight';
import nodeList from './nodeList.json';


const NodeDetail = () => {
  
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
  
  const history = useHistory();
  const location = useParams();
  const [userWallet, setWallet] = useState<any>(null);
  const [currentCoin, setCurrentCoin] = useState<string>('flow');
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  
  const [nodeInfo, setNodeinfo] = useState<any>({});
  const [network, setNetwork] = useState('mainnet');
  const [coinInfo, setCoinInfo] = useState<CoinItem>(empty);
  const [nodeid, setNodeid] = useState<any>(null);
  const [delegateid, setDelegate] = useState<any>(null);
  const [epchStart, setEpochStart] = useState<any>('');
  const [isLoading, setLoading] = useState<boolean>(false);
  const [epoch, setEpoch] = useState<any>('');
  const [apr, setApr] = useState<any>(0);
  const [diff, setDiff] = useState<any>(0);
  const [errorType, setErrorType] = useState<any>(null);
  const [current, setCurrent] = useState<any>(nodeList);

  const setUserWallet = async () => {
    const nodeid = location['nodeid'];
    const delegateid = location['delegateid'];
    setNodeid(nodeid)
    setDelegate(delegateid)
    const currentNode = nodeList.filter((node) => {
      return node.id == nodeid;
    })
    setCurrent(currentNode[0]);
    // const walletList = await storage.get('userWallet');
    setLoading(true);
    usewallet.delegateStore().then((res) => {
      const nodeinfo = res[nodeid][delegateid];
      console.log(nodeinfo, ' nodeinfo')
      setNodeinfo(nodeinfo)
    }).catch((err)=>{
      console.log(err)
    });
    const token = await usewallet.getCurrentCoin();
    const wallet = await usewallet.getCurrentWallet();
    const network = await usewallet.getNetwork();
    setNetwork(network);
    setCurrentCoin(token);
    // userWallet
    await setWallet(wallet);
    const coinList = await usewallet.getCoinList()
    const coinInfo = coinList.find(coin => coin.unit.toLowerCase() === 'flow');

    setCoinInfo(coinInfo!);
    setLoading(false);
    const currentDate = new Date();

    const d = getEndDate();
    const epochDate = d.toISOString().split('T')[0]

    const e = getDate();
    const epochStart = e.toISOString().split('T')[0];

    const diffTime = currentDate.getDate() - e.getDate();
    const diffDays = Math.ceil(diffTime); 
    setEpoch(epochDate);
    setDiff(diffDays);
    setEpochStart(epochStart);

    return;
  };

  const getDate = () => {
    const date = new Date();
    const day = date.getDay();
    const prevDate = new Date();
    if(date.getDay() <= 3){
      prevDate.setDate(date.getDate()- (day -3) - 7);
    }
    else{
      prevDate.setDate(date.getDate() - (day-3));
    }
    return prevDate;
  }

  const getEndDate = () => {
    const date = new Date();
    const day = date.getDay();
    const prevDate = new Date();
    if(date.getDay() <= 3){
      prevDate.setDate(date.getDate()- (day -3));
    }
    else{
      prevDate.setDate(date.getDate() - (day-3) + 7);
    }
    return prevDate;
  }

  const withdrawReward = () => {
    setLoading(true);

    const amount = nodeInfo.tokensRewarded;
    usewallet.withdrawReward(amount, nodeInfo.nodeID, nodeInfo.delegatorID).then(async (txID)=> {
      usewallet.listenTransaction(txID, true, `${amount}  Flow claimed`, `You have claimed ${amount} Flow from the staking node. \nClick to view this transaction.`, amount);
      await usewallet.setDashIndex(0);
      setLoading(false);
      history.push('/dashboard?activity=1');
    }).catch(() => {
      console.log('failed');
      setLoading(false);
    })
  };

  const withdrawUnstaked = () => {
    setLoading(true);

    const amount = nodeInfo.tokensUnstaked;
    usewallet.withdrawUnstaked(amount, nodeInfo.nodeID, nodeInfo.delegatorID).then(async (txID)=> {
      usewallet.listenTransaction(txID, true, `${amount}  Flow withdrawed`, `You have claimed ${amount} Flow from the staking node. \nClick to view this transaction.`, amount);
      await usewallet.setDashIndex(0);
      setLoading(false);
      history.push('/dashboard?activity=1');
    }).catch(() => {
      console.log('failed');
      setLoading(false);
    })
  };

  const restakeUnstaked = () => {
    setLoading(true);

    const amount = nodeInfo.tokensUnstaked;
    usewallet.restakeUnstaked(amount, nodeInfo.nodeID, nodeInfo.delegatorID).then(async (txID)=> {
      usewallet.listenTransaction(txID, true, `${amount}  Flow staked`, `You have staked ${amount} Flow to the staking node. \nClick to view this transaction.`, amount);
      await usewallet.setDashIndex(0);
      setLoading(false);
      history.push('/dashboard?activity=1');
    }).catch(() => {
      console.log('failed');
      setLoading(false);
    })
  };

  const restakeReward = () => {
    setLoading(true);

    const amount = nodeInfo.tokensRewarded;
    usewallet.restakeReward(amount, nodeInfo.nodeID, nodeInfo.delegatorID).then(async (txID)=> {
      usewallet.listenTransaction(txID, true, `${amount}  Flow staked`, `You have staked ${amount} Flow to the staking node. \nClick to view this transaction.`, amount);
      await usewallet.setDashIndex(0);
      setLoading(false);
      history.push('/dashboard?activity=1');
    }).catch(() => {
      console.log('failed');
      setLoading(false);
    })
  };

  

  const getApy = async () => {
    const result = await usewallet.getApr();
    setApr(result);
  };

  useEffect(() => {
    getApy();
    setUserWallet();
  },[])


  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'auto',backgroundColor:'#000000',px:'18px' }}>
        <Box sx={{display:'flex',justifyContent:'space-between'}}>
          <IconButton onClick={history.goBack}>
            <ArrowBackIcon sx={{ color: 'icon.navi' }} />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex',backgroundColor:'#1a1a1a', flexDirection: 'column', gap:'10px', padding: '14px 18px',marginTop:'26px',borderRadius:'16px',}}>

          <Box sx={{display:'flex', marginTop:'-26px'}}>
            <img src="https://raw.githubusercontent.com/Outblock/Assets/main/ft/flow/logo.png" style={{height: '64px', width: '64px', marginRight:'8px', backgroundColor: '#282828', borderRadius: '64px'}}/>
            <ButtonBase>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(270deg, #282828, #121212)',
                gap: '4px',
                px: '8px',
                py: '4px',
                borderRadius: '8px',
                alignSelf: 'end'
              }}>
                <Typography variant="h6" sx={{ fontWeight: '550' }}>Staked Flow</Typography>
                <IconChevronRight size={20} />
              </Box>
            </ButtonBase>
          </Box>

          <Box sx={{display:'flex'}}>
            <Typography variant="body1"           
              sx={{
                fontSize: '14px',
                color:'#BABABA'
              }}>
          Staked Balance
            </Typography>
          </Box>

          <Box sx={{display:'flex'}}>
            <Typography variant="body1"           
              sx={{
                fontSize: '32px',
                color:'#fff'
              }}>
              ${(nodeInfo.tokensStaked * coinInfo.price).toFixed(2)}
            </Typography>
            
            <Typography variant="body1"           
              sx={{
                fontSize: '16px',
                color:'#5E5E5E',
                lineHeight:'22px',
                marginLeft:'8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              
              }}>
          USD
            </Typography>
          </Box>
          <Box sx={{display:'flex'}}>
            <img src="https://raw.githubusercontent.com/Outblock/Assets/main/ft/flow/logo.png" style={{height: '16px', width: '16px', marginRight:'8px', backgroundColor: '#282828', borderRadius: '18px'}}/>

            <Typography variant="body1"           
              sx={{
                fontSize: '14px',
                color:'#fff',
                verticalAlign: 'middle',
              }}>
              {parseFloat(nodeInfo.tokensStaked).toFixed(2)}
            </Typography>
            <Typography variant="body1"           
              sx={{
                fontSize: '14px',
                color:'#5E5E5E',
                marginLeft:'8px',
                
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',

              }}>
            Flow
            </Typography>
            <Box sx={{width:'1px',height:'23px',backgroundColor:'#4C4C4C',margin:'0 8px'}}></Box>
            <Typography variant="body1"           
              sx={{
                fontSize: '14px',
                color:'#fff',
                verticalAlign: 'middle',
              }}>
              {coinInfo.balance}
            </Typography>
            <Typography variant="body1"           
              sx={{
                fontSize: '14px',
                color:'#5E5E5E',
                marginLeft:'8px',
                
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',

              }}>
            Flow available
            </Typography>
          </Box>
          <Box sx={{width:'100%',height:'1px',backgroundColor:'#333',margin:'8px 0'}}></Box>
          <Box sx={{display:'flex', flexDirection:'column'}}>
            <Typography variant="body1"           
              sx={{
                fontSize: '14px',
                color:'#BABABA',
                verticalAlign: 'middle',
              }}>
          Rewards
            </Typography>
            <Box sx={{display:'flex',}}>
              <Typography variant="body1"           
                sx={{
                  fontWeight:'bold',
                  fontSize: '24px',
                  color:'#fff'
                }}>
                {parseFloat(nodeInfo.tokensRewarded).toFixed(2)}
              </Typography>
              <Typography variant="body1"           
                sx={{
                  fontSize: '16px',
                  color:'#E6E6E6',
                  marginLeft:'8px',
                
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
            Flow
              </Typography>
              <Box sx={{flex:'1'}}></Box>
              {(parseFloat(nodeInfo.tokensRewarded) <= 0 || isLoading) ?
                <Box sx={{display: 'flex',marginRight:'4px',width:'86px',height:'36px',borderRadius:'8px',padding:'8px 20px',flexDirection: 'column', background: '#333', cursor:'pointer'}}>
                  <Typography variant="body1" color="#FFFFFF" sx={{fontWeight: 'medium', fontSize:'12px'}}>RESTAKE</Typography>
                </Box>
                :
                <Box sx={{display: 'flex',marginRight:'4px',width:'auto',height:'36px',borderRadius:'8px',padding:'8px 20px',background: '#41CC5D', cursor:'pointer'}}
                  onClick={restakeReward}
                >
                  <Typography variant="body1" color="#FFFFFF" sx={{fontWeight: 'medium', fontSize:'12px'}}>RESTAKE</Typography>
                </Box>
              }
              {(parseFloat(nodeInfo.tokensRewarded) <= 0 || isLoading) ?
                <Box sx={{display: 'flex',width:'86px',height:'36px',borderRadius:'8px',padding:'8px 20px',flexDirection: 'column', background: '#333', cursor:'pointer'}}>
                  <Typography variant="body1" color="#FFFFFF" sx={{fontWeight: 'medium', fontSize:'12px'}}>CLAIM</Typography>
                </Box>
                :
                <Box sx={{display: 'flex',width:'auto',height:'36px',borderRadius:'8px',padding:'8px 20px', background: '#41CC5D', cursor:'pointer'}}
                  onClick={withdrawReward}
                >
                  <Typography variant="body1" color="#FFFFFF" sx={{fontWeight: 'medium', fontSize:'12px'}}>CLAIM</Typography>
                </Box>
              }
            </Box>
          </Box>
          <Box sx={{width:'100%',height:'1px',backgroundColor:'#333',margin:'8px 0'}}></Box>
          <Box sx={{display:'flex', flexDirection:'column'}}>
            <Typography variant="body1"           
              sx={{
                fontSize: '14px',
                color:'#BABABA',
                verticalAlign: 'middle',
              }}>
          Unstaked
            </Typography>
            <Box sx={{display:'flex',}}>
              <Typography variant="body1"           
                sx={{
                  fontWeight:'bold',
                  fontSize: '24px',
                  color:'#fff'
                }}>
                {parseFloat(nodeInfo.tokensUnstaked).toFixed(2)}
              </Typography>
              <Typography variant="body1"           
                sx={{
                  fontSize: '16px',
                  color:'#E6E6E6',
                  marginLeft:'8px',
                
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
            Flow
              </Typography>
              <Box sx={{flex:'1'}}></Box>
              {(parseFloat(nodeInfo.tokensUnstaked) <= 0 || isLoading) ?
                <Box sx={{display: 'flex',marginRight:'4px',width:'86px',height:'36px',borderRadius:'8px',padding:'8px 20px',flexDirection: 'column', background: '#333', cursor:'pointer'}}>
                  <Typography variant="body1" color="#FFFFFF" sx={{fontWeight: 'medium', fontSize:'12px'}}>RESTAKE</Typography>
                </Box>
                :
                <Box sx={{display: 'flex', marginRight:'4px',width:'auto',height:'36px',borderRadius:'8px',padding:'8px 20px', background: '#41CC5D', cursor:'pointer'}}
                  onClick={restakeUnstaked}
                >
                  <Typography variant="body1" color="#FFFFFF" sx={{fontWeight: 'medium', fontSize:'12px'}}>RESTAKE</Typography>
                </Box>
              }
              {(parseFloat(nodeInfo.tokensUnstaked) <= 0  || isLoading) ?
                <Box sx={{display: 'flex',width:'86px',height:'36px',borderRadius:'8px',padding:'8px 20px',flexDirection: 'column', background: '#333', cursor:'pointer'}}>
                  <Typography variant="body1" color="#FFFFFF" sx={{fontWeight: 'medium', fontSize:'12px'}}>CLAIM</Typography>
                </Box>
                :
                <Box sx={{display: 'flex',width:'auto',height:'36px',borderRadius:'8px',padding:'8px 20px',background: '#41CC5D', cursor:'pointer'}}
                  onClick={withdrawUnstaked}
                >
                  <Typography variant="body1" color="#FFFFFF" sx={{fontWeight: 'medium', fontSize:'12px'}}>CLAIM</Typography>
                </Box>
              }
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection:'column',gap:'10px', backgroundColor:'#1a1a1a', padding: '12px 18px',borderRadius:'16px', my:'16px'}}>
          <Box sx={{display:'flex',gap:'2px',justifyContent:'space-between',backgroundColor:'#000000',borderRadius:'12px', overflow:'hidden' }}>
            {Array.from({length: diff}).map((_item, index) => <Box sx={{backgroundColor:'#41CC5D',height:'8px',flex:'1', borderTopRightRadius: (index === (diff - 1)) && '12px',borderBottomRightRadius: (index === (diff - 1)) && '12px'}}></Box>
            )}
            
            {Array.from({length: (7 - diff)}).map((_item, index) => <Box sx={{backgroundColor:'#000000',height:'8px',flex:'1'}}></Box>)}
          </Box>
          <Box sx={{display:'flex',justifyContent:'space-between'}}>
            <Box>
              <Typography variant="body1" color="#5E5E5E" sx={{fontWeight: 'medium', fontSize:'12px'}}>Epoch Starts</Typography>
              <Typography variant="body1" color="#E6E6E6" sx={{fontWeight: 'medium', fontSize:'14px'}}>{ epchStart }</Typography>
            </Box>
            <Box>
              <Typography variant="body1" color="#5E5E5E" sx={{fontWeight: 'medium', fontSize:'12px'}}>Epoch Ends</Typography>
              <Typography variant="body1" color="#E6E6E6" sx={{fontWeight: 'medium', fontSize:'14px'}}>{ epoch }</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap:'16px',}}>
          <Box sx={{display:'flex',flex:'1',flexDirection:'column', backgroundColor:'#1A1A1A',borderRadius:'16px',padding:'12px 18px'}}>
            <Typography variant="body1" color="#BABABA" sx={{fontWeight: 'medium', fontSize:'14px'}}>Daily Rewards</Typography>
            <Typography variant="body1" color="#f9f9f9" sx={{fontWeight: 'medium', fontSize:'20px'}}>
              {((nodeInfo.tokensStaked * apr)/365).toFixed(2)}</Typography>
          </Box>
          <Box sx={{display:'flex',flex:'1',flexDirection:'column', backgroundColor:'#1A1A1A',borderRadius:'16px',padding:'12px 18px'}}>
            <Typography variant="body1" color="#BABABA" sx={{fontWeight: 'medium', fontSize:'14px'}}>Monthly Reward</Typography>
            <Typography variant="body1" color="#f9f9f9" sx={{fontWeight: 'medium', fontSize:'20px'}}>{((nodeInfo.tokensStaked * apr)/12).toFixed(2)}</Typography>
          </Box>
        </Box>

        
        <Box sx={{display: 'flex', borderRadius:'12px', flexDirection:'column', backgroundColor:'#1a1a1a',  mb: '35px', mt:'16px', padding:'18px'}}>
          <Box sx={{display: 'flex',justifyContent:'space-between'}}>
            <Typography variant="body1"           
              sx={{
                alignSelf: 'start',
                fontSize: '14px',
                color:'#e6e6e6'
              }}>
              Unstaking Amount            

            </Typography>
            <Typography variant="body1"           
              sx={{
                alignSelf: 'end',
                fontSize: '14px',
                color:'#e6e6e6'
              }}>
              {nodeInfo.tokensUnstaking}
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
              Next Epoch
            </Typography>
            <Typography variant="body1"           
              sx={{
                alignSelf: 'end',
                fontSize: '14px',
                color:'#e6e6e6'
              }}>
              {epoch}
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
              Committed Amount          

            </Typography>
            <Typography variant="body1"           
              sx={{
                alignSelf: 'end',
                fontSize: '14px',
                color:'#e6e6e6'
              }}>
              {nodeInfo.tokensCommitted}
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
              Requested To Unstake Amount            

            </Typography>
            <Typography variant="body1"           
              sx={{
                alignSelf: 'end',
                fontSize: '14px',
                color:'#e6e6e6'
              }}>
              {nodeInfo.tokensRequestedToUnstake}
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
              Unstaked Amount            

            </Typography>
            <Typography variant="body1"           
              sx={{
                alignSelf: 'end',
                fontSize: '14px',
                color:'#e6e6e6'
              }}>
              {nodeInfo.tokensUnstaked}
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
              APR
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
              Provider
            </Typography>
            <Typography variant="body1"           
              sx={{
                alignSelf: 'end',
                fontSize: '14px',
                color:'#e6e6e6'
              }}>
              {current.name}
            </Typography>
          </Box>
        </Box>

        <Box sx={{display: 'flex', gap:'12px',mb: '35px', mt:'10px'}}>

          <Button
            // disabled={true}
            onClick={() => 
              history.push({
                pathname: `/dashboard/staking/page/${nodeid}/${delegateid}`})
            }
            variant="contained"
            size="large"
            sx={{
              height: '48px',
              backgroundColor:'#60C293',
              flexGrow: 1,
              borderRadius: '8px',
              textTransform: 'capitalize',
            }}
            // disabled={outAmount <= 0 || Number(amount) <= 0 || errorType || isLoading || token1 == null}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'normal' }}
              color="text.primary"
            > 
              + STAKE
            </Typography>
          </Button>
          <Button
            onClick={() => 
              history.push({
                pathname: `/dashboard/unstake/page/${nodeid}/${delegateid}`})
            }
            variant="contained"
            disabled={isLoading}
            size="large"
            sx={{
              height: '48px',
              flexGrow: 1,
              backgroundColor:'#333333',
              borderRadius: '8px',
              textTransform: 'capitalize',
            }}
            // disabled={outAmount <= 0 || Number(amount) <= 0 || errorType || isLoading || token1 == null}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'normal' }}
              color="text.primary"
            > 
              UNSTAKE
            </Typography>
          </Button>
        </Box>


      </Box>
    </ThemeProvider>
  );
}


export default NodeDetail;