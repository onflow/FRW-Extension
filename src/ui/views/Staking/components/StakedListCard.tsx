import React, {useEffect, useState} from 'react';
import { useWallet } from 'ui/utils';
import{Typography, Box}from '@mui/material';
import { useHistory } from 'react-router-dom';
import nodeList from '../nodeList.json';

const StakedListCard = ({desc, delegate}) => {
  const wallet = useWallet();
  
  const history = useHistory();
  const [current, setCurrent] = useState<any>(nodeList);
  const [loading, setLoading] = useState<any>(false);
  // withdrawReward
  useEffect(() => {
    const currentNode = nodeList.filter((node) => {
      return node.id == delegate.nodeID;
    })
    setCurrent(currentNode[0]);
  },[])

  const withdrawReward = () => {
    setLoading(true)
    const amount = parseFloat(delegate.tokensRewarded).toFixed(8);
    wallet.withdrawReward(amount, delegate.nodeID, delegate.delegatorID).then(async (txID)=> {
      wallet.listenTransaction(txID, true, `${amount}  Flow claimed`, `You have claimed ${amount} Flow from the staking node. \nClick to view this transaction.`, amount);
      await wallet.setDashIndex(0);
      setLoading(false);
      history.push('/dashboard?activity=1');
    }).catch(() => {
      setLoading(false);
    })
  }
  return (
    <Box
      sx={{ width: '100%', 
        backgroundColor: '#1F1F1F', 
        display: 'flex',
        flexDirection:'column',
        borderRadius: '12px',
        padding:'12px 18px',
        overflow:'hidden',
        alignItems: 'center',
        '&:hover': {
          backgroundColor: 'neutral.main'
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          borderRadius: '12px',
          overflow:'hidden',
          width:'100%',
          justifyContent: 'flex-satrt',
          alignItems: 'center',
        }}  
      >
        <Box sx={{marginRight:'12px', paddingLeft:'12px',py:'10px'}}>
          <img src={current.icon} style={{width: '24px', height: '24px', borderRadius: '24px', backgroundColor: '#282828'}}/>
        </Box>
        <Box sx={{py:'10px',display:'flex',}}>
          <Typography variant="body1" sx={{fontSize:'16px',height:'18px',lineHeight:'18px',}}>{current.name}</Typography>
          <Typography variant="body1" sx={{backgroundColor:'rgba(96,194,147,0.12)',fontSize:'12px',color:'#60C293',marginLeft:'6px',borderRadius:'4px',height:'18px',lineHeight:'18px',padding:'0 8px'}}>{desc}%</Typography>
        </Box>
        <Box sx={{flexGrow: 1}}/>
        {loading ?
          <Box sx={{display: 'flex',borderRadius:'16px',padding:'3px 11px',flexDirection: 'column', background: '#333', cursor:'pointer'}}
          >
            <Typography variant="body1" color="#FFFFFF" sx={{fontWeight: 'medium', fontSize:'14px'}}>Loading...</Typography>
          </Box>
          :
          <Box sx={{display: 'flex',borderRadius:'16px',padding:'3px 11px',flexDirection: 'column', backgroundColor: 'success.main', cursor:'pointer'}}
            onClick={withdrawReward}
          >
            <Typography variant="body1" color="#FFFFFF" sx={{fontWeight: 'medium', fontSize:'14px'}}>Claim</Typography>
          </Box>
        }
      </Box>
      <Box
        sx={{
          display: 'flex',
          width:'100%',
          borderRadius: '12px',
          overflow:'hidden',
          justifyContent: 'flex-satrt',
          alignItems: 'center',
          
        }}
        onClick={() => 
          history.push({
            pathname: `/dashboard/staking/node/${delegate.nodeID}/${delegate.delegatorID}`})
        }
      >
        <Box sx={{display: 'flex', padding:'12px 26px 12px 12px',alignItems: 'baseline', height:'100%',flexDirection: 'column',}}>
          <Typography variant="body1" color="#808080" sx={{fontWeight: 'medium', fontSize:'14px'}}>Staked Amount</Typography>
          <Box sx={{display:'flex'}}>
            <Typography variant="body1" sx={{fontSize:'14px',color:'#F9F9F9'}}>{parseFloat(delegate.tokensStaked).toFixed(2)} </Typography>
            <Typography variant="body1" sx={{marginLeft:'4px',fontSize:'10px',lineHeight:'22px',color:'#5E5E5E'}}>Flow </Typography>
          </Box>
        </Box>
        <Box sx={{flexGrow: 1, display:'flex',height:'48px',justifyContent:'center',}}>
          <Box sx={{width:'1px', height:'100%',backgroundColor:'#333'}}></Box>
        </Box>
        <Box sx={{display: 'flex', padding:'10px 26px 10px 12px',alignItems: 'baseline', height:'100%',flexDirection: 'column',}}>
          <Typography variant="body1" color="#808080" sx={{fontWeight: 'medium', fontSize:'14px'}}>Rewards</Typography>
          <Box sx={{display:'flex'}}>
            <Typography variant="body1" sx={{fontSize:'14px',color:'#F9F9F9'}}>{delegate.tokensRewarded} </Typography>
            <Typography variant="body1" sx={{marginLeft:'4px',fontSize:'10px',lineHeight:'22px',color:'#5E5E5E'}}>Flow </Typography>
          </Box>
        </Box>
      </Box>

    </Box>

  );
};

export default StakedListCard;