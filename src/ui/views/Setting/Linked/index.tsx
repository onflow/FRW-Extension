import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import IconEnd from '../../../../components/iconfont/IconAVector11Stroke';
import {
  Typography,
  ListItemText,
  ListItemIcon,
  ListItem,
  ListItemButton,
  Box,
} from '@mui/material';
import { useWallet } from 'ui/utils';
// import '../../Unlock/style.css';
import { LLHeader } from '@/ui/FRWComponent';
import EmptyStateImage from 'ui/FRWAssets/image/search_user.png';

type ChildAccount = {
  [key: string]: {
    name: string;
    description: string;
    thumbnail: {
      url: string;
    };
  };
};


const useStyles = makeStyles(() => ({
  logoBox: {
    display: 'flex',
    flexDirection: 'column',
    padding: '18px',
    alignItems: 'center',
  },
  mediaBox: {
    width: '65%',
    margin: '72px auto 16px auto',
    alignItems: 'center',
  },
  logo: {
    width: '84px',
    height: '84px',
    margin: '0 auto',
  },
  iconsBox: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}));

const Linked = () => {
  const classes = useStyles();

  const history = useHistory();
  const usewallet = useWallet();
  const [childAccounts, setChildAccount] = useState<ChildAccount | null>(null);
  const [userWallet, setWallet] = useState<any>(null);

  const fetchUserWallet = async () => {

    // const childresp: ChildAccount = await usewallet.checkUserChildAccount();
    usewallet.checkUserChildAccount().then((res) => {
      setChildAccount(res);
    }).catch((err) => {
      console.log(err)
    })
    const wallet = await usewallet.getUserWallets();
    await setWallet(wallet);
  };


  useEffect(() => {
    fetchUserWallet();
  }, []);
  return (
    <div className="page">

      <LLHeader title={chrome.i18n.getMessage('Linked_Account')} help={false} />
      {childAccounts && (Object.keys(childAccounts).length > 0) &&
        <Typography
          variant="body1"
          component="span"
          color="#787878"
          textAlign="left"
          fontSize={'14px'}
          sx={{ padding: '0 18px' }}
        // color={key === currentWallet ? 'text.nonselect' : 'text.primary'}
        >
          {chrome.i18n.getMessage('Linked_Account')}
        </Typography>
      }
      {childAccounts && (Object.keys(childAccounts).length > 0)  ?
        <Box className={classes.logoBox}>
          {
            Object.keys(childAccounts).map((key) => (
              <ListItem
                key={key}
                disablePadding
                sx={{ mb: 0, backgroundColor: '#292929', borderRadius: '16px', marginBottom: '8px' }}
                component={Link}
                to={`/dashboard/setting/linkeddetail/${key}`}
              >
                <ListItemButton sx={{ mb: 0, padding: '12px 20px', borderRadius: '16px' }}>
                  <ListItemIcon>
                    <img
                      style={{
                        borderRadius: '18px',
                        marginRight: '12px',
                        height: '36px',
                        width: '36px',
                        objectFit: 'cover'
                      }}
                      src={childAccounts[key]?.thumbnail?.url ?? 'https://lilico.app/placeholder-2.0.png'}
                      alt={childAccounts[key]?.name ?? key}
                    />
                  </ListItemIcon>
                  <ListItemText
                    sx={{ display: 'flex', flexDirection: 'column' }}
                    primary={
                      <Typography
                        variant="body1"
                        component="span"
                        color="#fff"
                        fontSize={'14px'}
                      // color={key === currentWallet ? 'text.nonselect' : 'text.primary'}
                      >
                        {childAccounts[key]?.name ?? key}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body1"
                        component="span"
                        color="#808080"
                        fontSize={'12px'}
                      // color={key === currentWallet ? 'text.nonselect' : 'text.primary'}
                      >
                        {key}
                      </Typography>
                    }
                  />
                  <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                    <IconEnd size={12} />
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            ))
          }
        </Box>
        :
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '80%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={EmptyStateImage}
            style={{
              objectFit: 'none',
            }}
          />
          <Typography variant="body1" color="text.secondary">
            {chrome.i18n.getMessage('No_linked')}
          </Typography>
        </Box>
      }

    </div>
  );
};

export default Linked;
