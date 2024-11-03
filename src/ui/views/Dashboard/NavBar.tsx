import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Tab,
  Tabs,
  SvgIcon,
} from '@mui/material';
import IconSetting from '../../../components/iconfont/IconSetting';
import IconWallet from '../../../components/iconfont/IconWallet';
import IconNfts from '../../../components/iconfont/IconNfts';
// import { useWallet } from 'ui/utils';
import staking from 'ui/FRWAssets/svg/staking.svg';
import { useWallet } from 'ui/utils';

const NavBar = ({ value, setValue }) => {
  const wallet = useWallet();
  const [isChild, setIsChild] = useState(false);

  // const wallet = useWallet();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const setTab = (index: number) => {
    setValue(index);
  };

  const fetch = async () => {
    const dashIndex = await wallet.getDashIndex();
    const isChild = await wallet.getActiveWallet();
    if (isChild) {
      setIsChild(true)
    }
    setValue(dashIndex);
  };

  useEffect(() => {
    fetch();
  }, []);

  const colors = ['#41CC5D', '#FFDD32', '#60C293', '#59A1DB']

  return (
    <AppBar position="relative">
      <Tabs
        value={value}
        onChange={handleChange}
        TabIndicatorProps={{
          style: {
            top: 0,
            backgroundColor: colors[value],
          },
        }}
        indicatorColor="primary"
        textColor="inherit"
        variant="fullWidth"
        aria-label="tabs"
        sx={{ backgroundColor: '#282828', minHeight: '56px' }}
      >
        <Tab
          icon={<IconWallet size={20} color={value === 0 ? colors[0] : '#C4C4C4'} />}
          onClick={() => setTab(0)}
          disableRipple={true}
          sx={{ height: '56px' }}
        />
        <Tab
          icon={<IconNfts size={20} color={value === 1 ? colors[1] : '#C4C4C4'} />}
          onClick={() => setTab(1)}
          disableRipple={true}
          sx={{ height: '56px' }}
        />
        {!isChild &&
          <Tab
            icon={
              value === 2 ?
                <SvgIcon sx={{ width: '20px', height: '22px' }} >
                  <path fill="#60C293" d="M0.200012 5.4V7.6C0.200012 8.7 3.60001 10.4 9.00001 10.4C14.4 10.4 17.8 8.8 17.8 7.6V5.4C15.8 6.7 12.4 7.3 9.00001 7.3C5.60001 7.3 2.20001 6.6 0.200012 5.4ZM9.00001 5.5C14.4 5.5 17.8 3.9 17.8 2.7C17.8 1.5 14.4 0 9.00001 0C3.60001 0 0.200012 1.6 0.200012 2.7C0.200012 3.8 3.60001 5.5 9.00001 5.5ZM9.00001 16.9C5.60001 16.9 2.20001 16.3 0.200012 15V17.2C0.200012 18.3 3.60001 19.9 9.00001 19.9C14.4 19.9 17.8 18.3 17.8 17.2V15C15.8 16.3 12.4 16.9 9.00001 16.9ZM9.00001 12.1C5.60001 12.1 2.20001 11.5 0.200012 10.2V12.4C0.200012 13.5 3.60001 15.1 9.00001 15.1C14.4 15.1 17.8 13.5 17.8 12.4V10.2C15.8 11.4 12.4 12.1 9.00001 12.1Z" />
                </SvgIcon> :

                <SvgIcon sx={{ width: '20px', height: '22px' }} >
                  <path fill="#C4C4C4" d="M0.200012 5.4V7.6C0.200012 8.7 3.60001 10.4 9.00001 10.4C14.4 10.4 17.8 8.8 17.8 7.6V5.4C15.8 6.7 12.4 7.3 9.00001 7.3C5.60001 7.3 2.20001 6.6 0.200012 5.4ZM9.00001 5.5C14.4 5.5 17.8 3.9 17.8 2.7C17.8 1.5 14.4 0 9.00001 0C3.60001 0 0.200012 1.6 0.200012 2.7C0.200012 3.8 3.60001 5.5 9.00001 5.5ZM9.00001 16.9C5.60001 16.9 2.20001 16.3 0.200012 15V17.2C0.200012 18.3 3.60001 19.9 9.00001 19.9C14.4 19.9 17.8 18.3 17.8 17.2V15C15.8 16.3 12.4 16.9 9.00001 16.9ZM9.00001 12.1C5.60001 12.1 2.20001 11.5 0.200012 10.2V12.4C0.200012 13.5 3.60001 15.1 9.00001 15.1C14.4 15.1 17.8 13.5 17.8 12.4V10.2C15.8 11.4 12.4 12.1 9.00001 12.1Z" />
                </SvgIcon>

            }
            onClick={() => setTab(2)}
            disableRipple={true}
            sx={{ height: '56px' }}
          />

        }
        <Tab
          icon={<IconSetting size={20} color={value === 3 ? colors[3] : '#C4C4C4'} />}
          onClick={() => setTab(3)}
          disableRipple
          sx={{ height: '56px' }}
        />
      </Tabs>
    </AppBar>
  );
};

export default NavBar;
