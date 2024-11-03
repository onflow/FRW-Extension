import React, { useEffect, useState } from 'react';
import { Stack, Box, Typography, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useWallet } from 'ui/utils';
import { UserInfoResponse } from 'background/service/networkModel';
import IconCheck from 'ui/assets/check.svg';
import Link from 'ui/FRWAssets/svg/link.svg';

const useStyles = makeStyles({
  IconCheck: {
    display: 'inline',
    backgroundColor:'#00E075',
    borderRadius:'20px',
    width:'14px',
    height:'14px',
    padding:'3px',
    color:'#000'
  }
});

export const LinkingBlock = ({ image, accountTitle, userInfo }) => {
  const classes = useStyles();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', margin: '18px', gap: '12px' }}>
      <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
        <Stack direction="column" spacing="12px" sx={{ justifyContent: 'space-between',width:'100%' }}>
          <Typography sx={{ textAlign: 'center', fontSize: '20px', color: '#E6E6E6', fontWeight: 'bold', width: '100%' }}>{chrome.i18n.getMessage('Account_Linking')}</Typography>
          <Box sx={{display:'grid', gridTemplateColumns: '1fr 1fr 1fr', justifyContent:'center', alignItems: 'stretch'}}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img style={{ height: '60px', width: '60px', borderRadius: '30px', backgroundColor: 'text.secondary', objectFit: 'cover' }} src={image} />
              <Typography sx={{ fontSize: '14px', color: '#E6E6E6', fontWeight: 'bold', width: '100%', pt: '4px', textAlign: 'center' }}>{accountTitle}</Typography>
            </Box>
            <img style={{width:'108px'}} src={Link}/>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {userInfo && <img style={{ height: '60px', width: '60px', borderRadius: '30px', backgroundColor: 'text.secondary', objectFit: 'cover' }} src={userInfo.avatar} />}
              <Typography sx={{ fontSize: '14px', color: '#E6E6E6', fontWeight: 'bold', width: '100%', pt: '4px', textAlign: 'center' }}>{userInfo?.nickname}</Typography>
            </Box>

          </Box>
        </Stack>
      </Box>
      <Divider />

      <Box sx={{ borderRadius: '12px', overflow: 'hidden', width: '100%', display: 'table' }}>
        <Typography sx={{ fontSize: '14px', textTransform: 'uppercase', color: '#5E5E5E' }}>{chrome.i18n.getMessage('This_App_would_like_to')}</Typography>
        <Typography sx={{ fontSize: '14px', color: '#FFFFFF',marginTop:'4px' }}><img className={classes.IconCheck} src={IconCheck} /> Delegate dApp account to your Flow Wallet</Typography>
        <Typography sx={{ fontSize: '14px', color: '#FFFFFF',marginTop:'8px' }}><img className={classes.IconCheck} src={IconCheck} /> Flow Wallet will manage linked account </Typography>
      </Box>

    </Box>
  );
};

