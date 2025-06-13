import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { ListItem, ListItemButton, ListItemIcon, Typography, Box, Tooltip } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';

import {
  type WalletAccount,
  type ActiveChildType_depreciated,
  type WalletAddress,
} from '@/shared/types/wallet-types';
import AccountAvatar from '@/ui/components/account/account-avatar';
import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';
import { useAccountBalance } from '@/ui/hooks/use-account-hooks';

interface MainAccountsProps {
  props_id: number;
  name: string;
  address: WalletAddress;
  icon: string;
  color: string;
  setWallets: (
    walletInfo: WalletAccount,
    key: ActiveChildType_depreciated | null,
    index?: number | null
  ) => Promise<void>;
  currentWalletIndex: number;
  currentWallet: WalletAccount;
  mainAddress: string;
  setExpandAccount: React.Dispatch<React.SetStateAction<boolean>>;
  expandAccount: boolean;
  walletList: WalletAccount[];
  network: string;
}

const MainAccountsComponent = (props: MainAccountsProps) => {
  const balance = useAccountBalance(props.network, props.address);
  const isBalanceLoading = balance === undefined || balance === null;

  const toggleExpand = () => {
    props.setExpandAccount((prev) => !prev);
  };

  return props.address === props.mainAddress || props.expandAccount ? (
    <>
      <Tooltip title={isBalanceLoading ? 'Loading balance...' : ''} arrow>
        <span>
          <ListItem
            onClick={() => {
              if (props.address === props.currentWallet['address']) {
                toggleExpand();
              } else {
                props.setWallets(props.walletList[props.props_id], null, props.props_id);
              }
            }}
            sx={{ mb: 0, padding: '0', cursor: 'pointer' }}
            disabled={isBalanceLoading}
          >
            <ListItemButton
              data-testid={`main-account-${props.mainAddress}`}
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
                  color={
                    props.props_id === props.currentWalletIndex ? 'text.title' : 'text.nonselect'
                  }
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
                  {isBalanceLoading ? 'Loading...' : `${balance} FLOW`}
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
        </span>
      </Tooltip>
    </>
  ) : null;
};

export default MainAccountsComponent;
