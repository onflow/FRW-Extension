import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { ListItem, ListItemButton, ListItemIcon, Typography, Box } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';

import { type WalletType } from '@/shared/types/network-types';
import { type ActiveChildType, type WalletAddress } from '@/shared/types/wallet-types';
import { useWallet } from 'ui/utils';

import IconEnd from '../../../../components/iconfont/IconAVector11Stroke';

interface WalletFunctionProps {
  props_id: number;
  name: string;
  address: WalletAddress;
  icon: string;
  color: string;
  setWallets: (
    walletInfo: WalletType,
    key: ActiveChildType | null,
    index?: number | null
  ) => Promise<void>;
  currentWalletIndex: number;
  currentWallet: WalletType;
  mainAddress: string;
  setExpandAccount: React.Dispatch<React.SetStateAction<boolean>>;
  expandAccount: boolean;
  walletList: WalletType[];
}

const WalletFunction = (props: WalletFunctionProps) => {
  const usewallet = useWallet();
  const [currentBalance, setCurrentBalance] = useState<string | null>(null);

  const walletFlowBalance = useCallback(
    async (address: string) => {
      const balance = await usewallet.getFlowBalance(address);
      return balance || 0;
    },
    [usewallet]
  );

  const toggleExpand = () => {
    props.setExpandAccount((prev) => !prev);
  };

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await walletFlowBalance(props.address);
        setCurrentBalance(balance);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance();
  }, [props.address, walletFlowBalance]);

  return props.address === props.mainAddress || props.expandAccount ? (
    <ListItem
      onClick={() => {
        if (props.address === props.currentWallet['address']) {
          toggleExpand(); // Toggle the list if the current address is clicked
        } else {
          props.setWallets(props.walletList[props.props_id], null, props.props_id); // Set the wallet if it's a different address
        }
      }}
      sx={{ mb: 0, padding: '0', cursor: 'pointer' }}
    >
      <ListItemButton
        sx={{
          my: 0,
          display: 'flex',
          px: '16px',
          py: '8px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {props.icon && (
          <Box
            sx={{
              display: 'flex',
              height: '32px',
              width: '32px',
              borderRadius: '32px',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: props.color,
              marginRight: '12px',
            }}
          >
            <Typography sx={{ fontSize: '20px', fontWeight: '600' }}>{props.icon}</Typography>
          </Box>
        )}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            background: 'none',
          }}
        >
          <Typography
            variant="body1"
            component="span"
            fontWeight={'semi-bold'}
            sx={{ fontSize: '12px' }}
            display="flex"
            color={props.props_id === props.currentWalletIndex ? 'text.title' : 'text.nonselect'}
          >
            {props.name}
            {props.address === props.currentWallet['address'] && (
              <ListItemIcon style={{ display: 'flex', alignItems: 'center' }}>
                <FiberManualRecordIcon
                  style={{
                    fontSize: '10px',
                    color: '#40C900',
                    marginLeft: '10px',
                  }}
                />
              </ListItemIcon>
            )}
          </Typography>
          <Typography
            variant="body1"
            component="span"
            color={'text.nonselect'}
            sx={{ fontSize: '12px', textTransform: 'uppercase' }}
          >
            {currentBalance !== null
              ? `${(Number(currentBalance) / 100000000).toFixed(3)} FLOW`
              : 'Loading...'}
          </Typography>
        </Box>
        <Box sx={{ flex: '1' }}></Box>
        {props.address === props.currentWallet['address'] && props.walletList.length > 1 && (
          <IconEnd
            size={12}
            style={{
              transform: props.expandAccount ? 'rotate(270deg)' : 'rotate(90deg)',
              transition: 'transform 0.3s ease',
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  ) : null;
};

export default WalletFunction;
