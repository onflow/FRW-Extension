import SearchIcon from '@mui/icons-material/Search';
import {
  List,
  Box,
  Input,
  InputAdornment,
  Card,
  CardMedia,
  Skeleton,
  CardContent,
  Button,
  Switch,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { StyledEngineProvider } from '@mui/material/styles';
import React, { useState, useEffect, useCallback } from 'react';

// import { useNavigate } from 'react-router';
import { type ExtendedTokenInfo } from '@/shared/types/coin-types';
import { LLHeader } from '@/ui/components';
import TokenItem from '@/ui/components/TokenLists/TokenItem';
import { useAllTokenInfo } from '@/ui/hooks/use-coin-hooks';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useCoins } from 'ui/hooks/useCoinHook';
import { useWallet } from 'ui/utils';

import CloseIcon from '../../assets/svg/close-icon.svg';
import VerifiedIcon from '../../assets/svg/verfied-check.svg';

import AddTokenConfirmation from './AddTokenConfirmation';

const TokenList = () => {
  const wallet = useWallet();
  const { coins, tokenFilter, updateTokenFilter } = useCoins();
  const [keyword, setKeyword] = useState('');
  const [tokenInfoList, setTokenInfoList] = useState<ExtendedTokenInfo[]>([]);
  const [filteredTokenList, setFilteredTokenList] = useState<ExtendedTokenInfo[]>([]);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<ExtendedTokenInfo | null>(null);
  const [filters, setFilter] = useState('all');
  const [filteredCollections, setFilteredCollections] = useState<ExtendedTokenInfo[]>([]);

  const [isLoading, setLoading] = useState(true);

  const { network, activeAccountType } = useProfiles();
  const chainType = activeAccountType === 'evm' ? 'evm' : 'flow';
  const allTokenInfo = useAllTokenInfo(network, chainType);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!allTokenInfo) {
        return;
      }
      // Remove duplicate tokens based on symbol
      const uniqueTokens: ExtendedTokenInfo[] = Array.from(
        allTokenInfo
          .reduce((map, token) => {
            const key = token.symbol.toLowerCase();
            // Keep the first occurrence of each symbol
            if (!map.has(key)) {
              map.set(key, token);
            }
            return map;
          }, new Map())
          .values()
      );

      // Set the data and filtered tokens
      setTokenInfoList(uniqueTokens);
      setFilteredTokenList(uniqueTokens);
    } finally {
      setLoading(false);
    }
  }, [allTokenInfo]);

  const handleTokenClick = (token, isEnabled) => {
    if (!isEnabled) {
      setSelectedToken(token);
      setConfirmationOpen(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filter = (e1: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const word = e1.target.value;

    if (word !== '') {
      const results = tokenInfoList.filter((token) => {
        return (
          token.name.toLowerCase().includes(word.toLowerCase()) ||
          token.symbol.toLowerCase().includes(word.toLowerCase())
        );
      });
      setFilteredTokenList(results);
    } else {
      setFilteredTokenList(tokenInfoList);
    }

    setKeyword(word);
  };

  const getFilteredCollections = useCallback(
    (fil: string) => {
      return filteredTokenList.filter((ele) => {
        if (fil === 'all') return true;
        if (fil === 'verified') return ele.isVerified;
        return true;
      });
    },
    [filteredTokenList]
  );

  useEffect(() => {
    setLoading(true);
    const collections = getFilteredCollections(filters);
    setFilteredCollections(collections);
    setLoading(false);
  }, [filters, getFilteredCollections]);

  const handleToggle = () => {
    setFilter((prev) => (prev === 'all' ? 'verified' : 'all'));
    updateTokenFilter({ ...tokenFilter, hideUnverified: !tokenFilter.hideUnverified });
  };
  return (
    <StyledEngineProvider injectFirst>
      <div className="page">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
          }}
        >
          <LLHeader title={chrome.i18n.getMessage('Add_Token')} help={false} />

          <Input
            type="search"
            value={keyword}
            onChange={(e) => filter(e)}
            sx={{
              minHeight: '46px',
              zIndex: '999',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              boxSizing: 'border-box',
              margin: '2px 18px 10px 18px',
              border: 'none',
              color: '#FFFFFF',
              '& input': {
                padding: '8px 16px',
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  opacity: 1,
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
              },
            }}
            placeholder={chrome.i18n.getMessage('Search_Token')}
            autoFocus
            disableUnderline
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon sx={{ ml: '10px', my: '5px', color: 'rgba(255, 255, 255, 0.6)' }} />
              </InputAdornment>
            }
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 18px',
              gap: '10px',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Only show verified tokens
              <img src={VerifiedIcon} alt="Verified" style={{ width: '16px', height: '16px' }} />
            </Typography>
            <Switch
              checked={tokenFilter.hideUnverified}
              onChange={handleToggle}
              color="primary"
              inputProps={{ 'aria-label': 'Toggle Verified' }}
            />
          </Box>

          {isLoading ? (
            <Grid
              container
              sx={{
                width: '100%',
                margin: 0,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignContent: 'flex-start',
                padding: '10px 13px',
              }}
            >
              {[...Array(4).keys()].map((key) => (
                <Card
                  key={key}
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    width: '100%',
                    height: '72px',
                    margin: '12px auto',
                    boxShadow: 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                    <CardMedia
                      sx={{
                        width: '48px',
                        height: '48px',
                        justifyContent: 'center',
                      }}
                    >
                      <Skeleton variant="circular" width={48} height={48} />
                    </CardMedia>
                    <CardContent sx={{ flex: '1 0 auto', padding: '0 8px' }}>
                      <Skeleton variant="text" width={280} />
                      <Skeleton variant="text" width={150} />
                    </CardContent>
                  </Box>
                </Card>
              ))}
            </Grid>
          ) : (
            <List
              sx={{
                flexGrow: 1,
                overflowY: 'scroll',
                justifyContent: 'space-between',
                padding: '0 8px',
              }}
            >
              {filteredCollections.map((token, index) => (
                <TokenItem
                  token={token}
                  isLoading={isLoading}
                  enabled={coins?.map((item) => item.contractName).includes(token.contractName)}
                  key={index}
                  onClick={handleTokenClick}
                  tokenFilter={tokenFilter}
                  updateTokenFilter={handleTokenClick}
                  showSwitch={false}
                />
              ))}
            </List>
          )}
        </Box>

        <AddTokenConfirmation
          isConfirmationOpen={isConfirmationOpen}
          data={selectedToken}
          handleCloseIconClicked={() => setConfirmationOpen(false)}
          handleCancelBtnClicked={() => setConfirmationOpen(false)}
          handleAddBtnClicked={() => {
            setConfirmationOpen(false);
          }}
        />
      </div>
    </StyledEngineProvider>
  );
};

export default TokenList;
