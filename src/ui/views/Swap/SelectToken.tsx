import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import {
  Box,
  Typography,
  Drawer,
  Stack,
  Grid,
  CardMedia,
  IconButton,
  Button,
  InputAdornment,
  Input,
  Avatar,
  CircularProgress,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LLSpinner,
} from 'ui/FRWComponent';
import { useWallet } from 'ui/utils';
import { LLProfile } from 'ui/FRWComponent';
import IconNext from 'ui/FRWAssets/svg/next.svg';
import IconSwitch from '../../../components/iconfont/IconSwitch';
import eventBus from '@/eventBus';
import InfoIcon from '@mui/icons-material/Info';
import { Presets } from 'react-component-transition';
import SearchIcon from '@mui/icons-material/Search';
import { makeStyles } from '@mui/styles';
import { IconCheckmark, IconPlus } from '../../../components/iconfont';

interface TransferConfirmationProps {
  isConfirmationOpen: boolean;
  data: any;
  handleCloseIconClicked: () => void;
  updateCoinInfo: (token: any) => void;
}
const useStyles = makeStyles((theme) => ({
  page: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  inputWrapper: {
    padding: '0',
    marginBottom: '12px',
    width: '100%',
  },
  inputBox: {
    minHeight: '56px',
    // borderRadius: theme.spacing(2),
    backgroundColor: '#282828',
    zIndex: '999',
    // width: '100%',
    borderRadius: '16px',
    boxSizing: 'border-box',
    // margin: '2px 18px 10px 18px',
    width: '100%',
    padding: '0px 16px'
  },
  listWrapper: {
    flexGrow: 1,
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: 'column',
  },
}));

const SelectToken = (props: TransferConfirmationProps) => {
  const wallet = useWallet();
  const classes = useStyles();
  const history = useHistory();
  const [token0, setToken0] = useState(null);
  const [token1, setToken1] = useState(null);
  

  const setToken = async () => {
    if (props.data.token0) {
      setToken0(props.data.token0.contract_name)
    }
    if (props.data.token1) {
      setToken1(props.data.token1.contract_name)
    }
  }

  const setSelectToken = (token) => {
    props.updateCoinInfo(token);
    props.handleCloseIconClicked();
    return
  }

  useEffect(() => {
    // startCount();
    setToken();
  }, [props.data.token0]);

  useEffect(() => {
    // startCount();
    setToken();
  }, [props.data.token1]);

  const renderContent = () => (
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
        <Grid item xs={1}></Grid>
        <Grid item xs={10}>
          <Typography
            variant="h1"
            align="center"
            py="14px"
            fontWeight="bold"
            fontSize="20px"
          >
              Select Token
          </Typography>
        </Grid>
        <Grid item xs={1}>
          <IconButton onClick={props.handleCloseIconClicked}>
            <CloseIcon
              fontSize="medium"
              sx={{ color: 'icon.navi', cursor: 'pointer' }}
            />
          </IconButton>
        </Grid>
      </Grid>
      <Box sx={{overflow:'scroll'}}>
        <div className={classes.inputWrapper}>
          <Input
            type="search"
            className={classes.inputBox}
            placeholder={chrome.i18n.getMessage('Search__PlaceHolder')}
            autoFocus
            disableUnderline
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon
                  color="primary"
                  sx={{ ml: '10px', my: '5px', fontSize: '24px' }}
                />
              </InputAdornment>
            }
          />
        </div>
        <Box sx={{width:'auto', padding:'10px 100px', display:'flex',alignItems:'center', py:'11px',justifyContent:'space-between'}}>
          {token0 ?
            <img src={props.data.token0.icon} style={{height: '32px', width: '32px', }}/>:
            <Box sx={{width:'24px',height:'24px',borderRadius:'24px',background: 'linear-gradient(191.31deg, #41CC5D 11.11%, #7678ED 92.36%)'}}></Box>
          }
          <IconSwitch color={'#41CC5D'} size={28} style={{borderRadius:'28px', transform: 'rotate(90deg)',border:'3px solid #000'}} />
          {token1 ?
            <img src={props.data.token1.icon} style={{height: '32px', width: '32px',}}/>:
            <Box sx={{width:'24px',height:'24px',borderRadius:'24px',background: 'linear-gradient(191.31deg, #41CC5D 11.11%, #7678ED 92.36%)'}}></Box>
  
          }
        </Box>
        <Box sx={{marginBottom:'10px'}}>
          {
            props.data.tokens.map((coin) => { 
              if (coin.address[props.data.network]) {
                return (
                  
                  <ListItemButton 
                    sx={{mx: '0px', py:'4px', my: '8px', backgroundColor: '#1f1f1f', borderRadius: '16px'}}
                    disabled={coin.contract_name == token0|| coin.contract_name == token1}
                  >
                    <ListItem 
                      disablePadding
                      onClick={()=>setSelectToken(coin)}
                      secondaryAction={ (coin.contract_name == token0|| coin.contract_name == token1) ?
                        <IconButton edge="end" aria-label="delete">
                          <IconCheckmark color='#41CC5D' size={24} />
                        </IconButton> : <div/>
                      }>
                      <ListItemAvatar>
                        <Avatar src={coin.icon}/>
                      </ListItemAvatar>
                      <ListItemText primary={coin.name} secondary={coin.symbol.toUpperCase()} />
                    </ListItem>
                  </ListItemButton>

                // <Button
                //   onClick={()=>setSelectToken(coin)}
                //   sx={{width:'100%', padding:'0',marginBottom:'4px',}}
                //   disabled={coin.contract_name == token0|| coin.contract_name == token1}
                // >
                //   {(coin.contract_name == token0|| coin.contract_name == token1) ?
                //     <Box sx={{
                //       display:'flex',
                //       alignItems:'center', 
                //       backgroundColor:'#282828',
                //       padding:'7px',
                //       borderRadius:'16px',
                //       width:'100%',
                //     }}>
                //       <img src={coin.icon} style={{height: '32px', width: '32px', marginRight:'14px'}}/>
                //       <Box sx={{display:'flex', textAlign:'left',flexDirection:'column',justifyContent:'space-between'}}>
                //         <Typography sx={{fontSize:'14px'}}>{coin.name}</Typography>
                //         <Typography sx={{ color:'#E6E6E6', fontSize: '12px' }}>{coin.symbol}</Typography>
                //       </Box>
                //     </Box>
                //     :
                //     <Box sx={{
                //       display:'flex',
                //       alignItems:'center', 
                //       backgroundColor:'#1F1F1F',
                //       padding:'7px',
                //       borderRadius:'16px',
                //       width:'100%',
                //     }}>
                //       <img src={coin.icon} style={{height: '32px', width: '32px', marginRight:'14px'}}/>
                //       <Box sx={{display:'flex', textAlign:'left',flexDirection:'column',justifyContent:'space-between'}}>
                //         <Typography sx={{fontSize:'14px'}}>{coin.name}</Typography>
                //         <Typography color="text.secondary" sx={{fontSize: '12px' }}>{coin.symbol}</Typography>
                //       </Box>
                //     </Box>
                //   }
                // </Button>
                )
              }
            }
            )
          }
        </Box>
        <Box sx={{flexGrow: 1 }}/>
      </Box>
    </Box>
  );

  return (
    <Drawer
      anchor="bottom"
      open={props.isConfirmationOpen}
      transitionDuration={300}
      PaperProps={{
        sx: { width: '100%', height: '65%', bgcolor: 'background.paper', borderRadius: '18px 18px 0px 0px' },
      }}
    >
      {renderContent()}
    </Drawer>
  );
};

export default SelectToken;