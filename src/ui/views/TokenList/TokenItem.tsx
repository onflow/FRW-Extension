import React, { useState, useEffect } from 'react';
import {
  ListItemText,
  ListItem,
  Avatar,
  ListItemAvatar,
  IconButton,
  CircularProgress,
  ListItemButton,
} from '@mui/material';
// import { makeStyles } from '@mui/styles';
// import { useHistory } from 'react-router-dom';
// import { useWallet } from 'ui/utils';
import IconPlus from '../../../components/iconfont/IconPlus';
import IconCheckmark from '../../../components/iconfont/IconCheckmark';

// const useStyles = makeStyles(() => ({
//   customInputLabel: {
//     '& legend': {
//       visibility: 'visible',
//     },
//   },
//   inputBox: {
//     minHeight: '46px',
//     zIndex: '999',
//     border: '1px solid #5E5E5E',
//     borderRadius: '16px',
//     boxSizing: 'border-box',
//     margin: '2px 18px 10px 18px',
//   },
// }));

const TokenItem = ({token, isLoading, enabledList, onClick}) => {
  const [isEnabled, setEnabled] = useState(false);

  const checkStorageStatus = async () => {
    const isEnabled = enabledList.map(item => item.contractName).includes(token.contractName)
    setEnabled(isEnabled);
  }

  useEffect(()=> {
    checkStorageStatus()
  }, [enabledList])

  const handleClick = () => {
    onClick(token, isEnabled)
  }

  return (
    <ListItemButton sx={{mx: '18px', py:'4px', my: '8px', backgroundColor: '#1f1f1f', borderRadius: '16px'}}>
      <ListItem 
        disablePadding
        onClick={handleClick}
        secondaryAction={
          <IconButton edge="end" aria-label="delete" onClick={handleClick}>
            { isLoading ? <CircularProgress color="primary" size={20} /> : 
              ( isEnabled ? <IconCheckmark color='#41CC5D' size={24} /> : <IconPlus size={20} /> )}
          </IconButton>
        }>
        <ListItemAvatar>
          <Avatar src={token.logoURI}/>
        </ListItemAvatar>
        <ListItemText primary={token.name} secondary={token.symbol.toUpperCase()} />
      </ListItem>
    </ListItemButton>
  );
};

export default TokenItem;

