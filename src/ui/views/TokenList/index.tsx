import SearchIcon from '@mui/icons-material/Search';
import {
  List,
  Box,
  Input,
  InputAdornment,
  Grid,
  Card,
  CardMedia,
  Skeleton,
  CardContent,
  Button,
} from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { type TokenInfo } from 'flow-native-token-registry';
import React, { useState, useEffect, useCallback } from 'react';

// import { useHistory } from 'react-router-dom';
import { LLHeader } from '@/ui/FRWComponent';
import { useWallet } from 'ui/utils';

import AddTokenConfirmation from './AddTokenConfirmation';
import TokenItem from './TokenItem';

const useStyles = makeStyles(() => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    minHeight: '46px',
    zIndex: '999',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    boxSizing: 'border-box',
    margin: '2px 18px 10px 18px',
  },
  grid: {
    width: '100%',
    margin: 0,
    // paddingLeft: '15px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'flex-start',
    padding: '10px 13px',
    // marginLeft: 'auto'
  },
  skeletonCard: {
    display: 'flex',
    backgroundColor: 'transparent',
    width: '100%',
    height: '72px',
    margin: '12px auto',
    boxShadow: 'none',
    padding: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
  },
}));

const TokenList = () => {
  const classes = useStyles();
  const wallet = useWallet();
  const [keyword, setKeyword] = useState('');
  const [tokenInfoList, setTokenInfoList] = useState<TokenInfo[]>([]);
  const [filteredTokenList, setFilteredTokenList] = useState<TokenInfo[]>([]);
  const [enabledTokenList, setEnabledTokenList] = useState<TokenInfo[]>([]);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [filters, setFilter] = useState('all');
  const [filteredCollections, setFilteredCollections] = useState<TokenInfo[]>([]);

  const [isLoading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const rawTokenInfoList = await wallet.openapi.getAllTokenInfo();

      // Remove duplicate tokens based on symbol
      const uniqueTokens = Array.from(
        rawTokenInfoList
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

      const enabledList = await wallet.openapi.getEnabledTokenList();
      setEnabledTokenList(enabledList);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

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
          token.name.toLowerCase().includes(keyword.toLowerCase()) ||
          token.symbol.toLowerCase().includes(keyword)
        );
      });
      setFilteredTokenList(results);
    } else {
      setFilteredTokenList(tokenInfoList);
    }

    setKeyword(word);
  };
  const checkStorageStatus = useCallback(
    async (token: TokenInfo) => {
      const isEnabled = enabledTokenList
        .map((item) => item.contractName)
        .includes(token.contractName);
      return isEnabled;
    },
    [enabledTokenList]
  );

  const getFilteredCollections = useCallback(
    async (fil: string) => {
      const results = await Promise.all(
        filteredTokenList.map(async (ele) => {
          const isEnabled = await checkStorageStatus(ele);
          return { ele, isEnabled };
        })
      );

      const res = results
        .filter(({ isEnabled }) => {
          if (fil === 'all') return true;
          if (fil === 'enabled') return isEnabled;
          if (fil === 'notEnabled') return !isEnabled;
          return true;
        })
        .map(({ ele }) => ele);
      return res;
    },
    [filteredTokenList, checkStorageStatus]
  );

  useEffect(() => {
    const fetchFilteredCollections = async () => {
      setLoading(true); // Show loading state
      const collections = await getFilteredCollections(filters); // Assuming 'all' as default filter
      setFilteredCollections(collections);
      setLoading(false); // Remove loading state
    };

    fetchFilteredCollections();
  }, [filters, enabledTokenList, filteredTokenList, getFilteredCollections]);

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
            className={classes.inputBox}
            placeholder={chrome.i18n.getMessage('Search_Token')}
            autoFocus
            disableUnderline
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon sx={{ ml: '10px', my: '5px', color: 'rgba(255, 255, 255, 0.6)' }} />
              </InputAdornment>
            }
            sx={{
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
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
            }}
          >
            {/* Button group for filter options */}
            <Box sx={{ display: 'inline-flex', gap: '10px' }}>
              <Button
                onClick={() => setFilter('all')}
                sx={{
                  display: 'inline-flex',
                  height: '36px',
                  padding: '9px 12px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  flexShrink: 0,
                  borderRadius: '36px',
                  border: `1.5px solid ${filters === 'all' ? '#41CC5D' : '#FFFFFF66'}`,
                  backgroundColor: 'transparent',
                  color: filters === 'all' ? '#41CC5D' : '#FFFFFF66',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#41CC5D',
                  },
                }}
              >
                All
              </Button>
              <Button
                onClick={() => setFilter('enabled')}
                sx={{
                  display: 'inline-flex',
                  height: '36px',
                  padding: '9px 12px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  flexShrink: 0,
                  borderRadius: '36px',
                  border: `1.5px solid ${filters === 'enabled' ? '#41CC5D' : '#FFFFFF66'}`,
                  backgroundColor: 'transparent',
                  color: filters === 'enabled' ? '#41CC5D' : '#FFFFFF66',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#41CC5D',
                  },
                }}
              >
                Enabled
              </Button>
              <Button
                onClick={() => setFilter('notEnabled')}
                sx={{
                  display: 'inline-flex',
                  height: '36px',
                  padding: '9px 12px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  flexShrink: 0,
                  borderRadius: '36px',
                  border: `1.5px solid ${filters === 'notEnabled' ? '#41CC5D' : '#FFFFFF66'}`,
                  backgroundColor: 'transparent',
                  color: filters === 'notEnabled' ? '#41CC5D' : '#FFFFFF66',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#41CC5D',
                  },
                }}
              >
                Not Enabled
              </Button>
            </Box>
          </Box>

          {isLoading ? (
            <Grid container className={classes.grid}>
              {[...Array(4).keys()].map((key) => (
                <Card
                  key={key}
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                  className={classes.skeletonCard}
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
                  enabled={enabledTokenList
                    .map((item) => item.contractName)
                    .includes(token.contractName)}
                  key={index}
                  onClick={handleTokenClick}
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
