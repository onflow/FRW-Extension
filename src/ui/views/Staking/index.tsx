import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Typography,
  Box,
  CardMedia,
  Snackbar,
  Alert,
  SnackbarContent,
  Slide
} from '@mui/material';
import { notification } from 'background/webapi';
// import '../../Unlock/style.css';
import { useWallet } from 'ui/utils';
import NoStake from './NoStake';
import HaveStake from './HaveStake';

const Staking = () => {
  const wallet = useWallet();
  const [noStakeOpen, setNoStake] = useState(false);
  const [haveStake, setHave] = useState(true);
  const [setup, setSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [delegate, setDelegate] = useState<any[]>([]);
  const [network, setNetwork] = useState<any>('mainnet');

  const [amount, setAmount] = useState<any>(0);

  const handleClick = async () => {
    const address = await wallet.getCurrentAddress();
    const hasSetup = await wallet.checkStakingSetup(address);
    if (hasSetup) {
      setNoStake(true);
    } else if (amount < 50) {
      notification.create(
        '/',
        'Not enough Flow',
        'A minimum of 50 Flow is required for staking',
      );
      return;
    } else {
      await wallet.setupDelegator(address);
      setLoading(true);
    }
    // setNoStake(true);
    // const result = await wallet.createStake('true');
  };

  const loadNetwork = async () => {
    const result = await wallet.getNetwork();
    setNetwork(result);

    const address = await wallet.getCurrentAddress();
    const setup = await wallet.checkStakingSetup(address);
    setSetup(setup);

    const storageData = await wallet.getCoinList();
    const flowObject = storageData.find(coin => coin.unit.toLowerCase() === 'flow');
    setAmount(flowObject!.balance);
  }

  useEffect(() => {
    console.log('Updated amount: ', amount);
  }, [amount]);

  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setLoading(false);
  };

  const getNodeInfo = async () => {
    const address = await wallet.getCurrentAddress();
    wallet.delegateInfo(address).then((res) => {
      const dres = Object.keys(res).map((key) => [res[key]]);
      let delegates: any[] = []
      dres.map((delegate) => {
        delegate.map((d) => {
          const dv = Object.keys(d).map((k) => d[k])
          delegates = delegates.concat(dv)
          console.log('this is delegates: ', delegates)
        })
      })
      setDelegate(delegates);
    }).catch((err) => {
      console.log(err)
    });
  };

  useEffect(() => {
    getNodeInfo();
    loadNetwork();
  }, [])

  return (
    <Box>
      {(haveStake && delegate.length > 0) ?
        (
          <HaveStake delegate={delegate} />
        ) :
        (
          <NoStake noStakeOpen={noStakeOpen} network={network} hasSetup={setup} loading={loading} handleClick={handleClick} amount={amount} />
        )
      }

      <Snackbar open={loading} autoHideDuration={6000} onClose={handleErrorClose}>
        <Alert onClose={handleErrorClose} variant="filled" severity="warning" sx={{ width: '100%' }}>
          Setup your account, please try again later.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Staking;
