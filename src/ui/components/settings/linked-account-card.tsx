import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardMedia,
  IconButton,
  Skeleton,
  Typography,
} from '@mui/material';
import React from 'react';

import { type WalletAccount } from '@/shared/types/wallet-types';
import { LinkIcon } from '@/ui/assets/icons/LinkIcon';
import { EditIcon } from '@/ui/assets/icons/settings/Edit';
import { useNftCatalogCollections } from '@/ui/hooks/useNftHook';
import {
  COLOR_DARKMODE_BACKGROUND_CARDS_1A1A1A,
  COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF,
  COLOR_DARKMODE_TEXT_SECONDARY_B3B3B3,
  COLOR_GREY_ICONS_767676,
} from '@/ui/style/color';
import { formatAddress } from '@/ui/utils';

import { AccountAvatar } from '../account/account-avatar';

type LinkedAccountCardProps = {
  network?: string;
  account?: WalletAccount;
  parentName?: string;
  active?: boolean;
  spinning?: boolean;
  onClick?: () => void;
  onEditClick?: () => void;
  showCard?: boolean;
  isPending?: boolean;
  'data-testid'?: string;
};

export const LinkedAccountCard = ({
  network,
  account,
  parentName,
  active = false,
  spinning = false,
  onClick,
  onEditClick,
  showCard = false,
  isPending = false,
  'data-testid': dataTestId,
}: LinkedAccountCardProps) => {
  const { name, icon, color, address } = account || {
    name: '',
    icon: '',
    color: '',
    address: '',
  };
  const testId = dataTestId || `linked-account-${address}`;

  return (
    <Card
      sx={{
        paddingLeft: showCard ? '8px' : '0',
        paddingRight: showCard ? '16px' : '0',
        paddingTop: showCard ? '10px' : '0',
        paddingBottom: showCard ? '10px' : '0',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: '16px',
        backgroundColor: showCard ? COLOR_DARKMODE_BACKGROUND_CARDS_1A1A1A : 'transparent',
        overflow: 'hidden',
        maxWidth: '500px',
        width: '100%',
      }}
      elevation={showCard ? 1 : 0}
      data-testid={testId}
    >
      <CardActionArea
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          padding: '0px',
          alignItems: 'center',
          overflow: 'hidden',
          paddingTop: showCard ? '0' : '8px',
          paddingBottom: showCard ? '0' : '8px',
        }}
        onClick={onClick}
      >
        <CardMedia sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <AccountAvatar
            network={network}
            emoji={icon}
            color={color}
            active={active}
            spinning={spinning}
            isPending={isPending}
          />
        </CardMedia>
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
          <Typography
            fontStyle="Inter"
            color={COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF}
            fontSize="14px"
            fontWeight="600"
            lineHeight="17px"
            noWrap
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            {name || <Skeleton variant="text" width="50px" />}
          </Typography>
          <Typography
            fontStyle="Inter"
            color={COLOR_DARKMODE_TEXT_SECONDARY_B3B3B3}
            fontSize="12px"
            fontWeight="400"
            lineHeight="17px"
            noWrap
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'row',
              gap: '4px',
            }}
          >
            {parentName ? (
              <>
                <LinkIcon width={16} height={16} color={COLOR_GREY_ICONS_767676} />
                {parentName}
              </>
            ) : (
              <Skeleton variant="text" width="120px" />
            )}
          </Typography>
        </Box>
      </CardActionArea>
      {onEditClick && !isPending && (
        <CardActions sx={{ padding: '0px', marginLeft: 'auto' }}>
          <IconButton onClick={onEditClick} aria-label="Edit linked account" disabled={!address}>
            <EditIcon width={24} height={24} />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
};
