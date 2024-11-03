import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Button
} from '@mui/material';
import { makeStyles } from '@mui/styles';
// import { useHistory } from 'react-router-dom';
import { useWallet } from 'ui/utils';
import { StyledEngineProvider } from '@mui/material/styles';
import TokenItem from './TokenItem';
import AddTokenConfirmation from './AddTokenConfirmation';
import { LLHeader } from '@/ui/FRWComponent';
import SearchIcon from '@mui/icons-material/Search';
import { TokenInfo } from 'flow-native-token-registry';

const useStyles = makeStyles(() => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    minHeight: '46px',
    zIndex: '999',
    border: '1px solid #5E5E5E',
    borderRadius: '16px',
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
    padding: '10px 13px'
    // marginLeft: 'auto'
  },
  skeletonCard: {
    display: 'flex',
    backgroundColor: '#000000',
    width: '100%',
    height: '72px',
    margin: '12px auto',
    boxShadow: 'none',
    padding: 'auto'
  },
}));

const TokenList = () => {
  const classes = useStyles();
  const wallet = useWallet();
  const [keyword, setKeyword] = useState('')
  const [data, setData] = useState<TokenInfo[]>([])
  const [fitered, setFitered] = useState<TokenInfo[]>([])
  const [enabledList, setEnabledList] = useState<TokenInfo[]>([])
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [filters, setFilter] = useState('all');
  const [filteredCollections, setFilteredCollections] = useState<TokenInfo[]>([]);

  const [isLoading, setLoading] = useState(true);



  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await wallet.openapi.getAllTokenInfo();
      const uniqueTokens = result.filter((token, index, self) =>
        index === self.findIndex((t) => t.symbol.toLowerCase() === token.symbol.toLowerCase())
      );
      setData(uniqueTokens);
      setFitered(uniqueTokens);

      const enabledList = await wallet.openapi.getEnabledTokenList();
      setEnabledList(enabledList)
    } finally {
      setLoading(false)
    }
  }

  const handleTokenClick = (token, isEnabled) => {
    if (!isEnabled) {
      setSelectedToken(token)
      setConfirmationOpen(true)
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filter = (e1) => {
    const word = e1.target.value;

    if (word !== '') {
      const results = data.filter(token => {
        return token.name.toLowerCase().includes(keyword.toLowerCase()) || token.symbol.toLowerCase().includes(keyword);
      });
      setFitered(results);
    } else {
      setFitered(data);
    }

    setKeyword(word);
  };
  const checkStorageStatus = async (token) => {
    const isEnabled = enabledList.map(item => item.contractName).includes(token.contractName);
    return isEnabled;
  };

  const getFilteredCollections = async (fil) => {
    const results = await Promise.all(
      fitered.map(async (ele) => {
        const isEnabled = await checkStorageStatus(ele);
        return { ele, isEnabled };
      })
    );

    const res = results.filter(({ isEnabled }) => {
      if (fil === 'all') return true;
      if (fil === 'enabled') return isEnabled;
      if (fil === 'notEnabled') return !isEnabled;
      return true;
    }).map(({ ele }) => ele);

    console.log('getfiltered ', res);
    
    return res;
  };

  useEffect(() => {
    const fetchFilteredCollections = async () => {
      setLoading(true); // Show loading state
      const collections = await getFilteredCollections(filters); // Assuming 'all' as default filter
      setFilteredCollections(collections);
      setLoading(false); // Remove loading state
    };

    fetchFilteredCollections();
  }, [filters, enabledList, fitered]);

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
            onChange={filter}
            className={classes.inputBox}
            placeholder={chrome.i18n.getMessage('Search_Token')}
            autoFocus
            disableUnderline
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon color="info" sx={{ ml: '10px', my: '5px' }} />
              </InputAdornment>
            }
          />


          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>

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

          {isLoading ?
            <Grid container className={classes.grid}>
              {[...Array(4).keys()].map(key => (
                <Card key={key} sx={{ borderRadius: '12px', backgroundColor: '#000000', padding: '12px' }} className={classes.skeletonCard}>
                  <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                    <CardMedia sx={{
                      width: '48px',
                      height: '48px',
                      justifyContent: 'center',
                    }}><Skeleton variant='circular' width={48} height={48} /></CardMedia>
                    <CardContent sx={{ flex: '1 0 auto', padding: '0 8px' }}>
                      <Skeleton variant='text' width={280} />
                      <Skeleton variant='text' width={150} />
                    </CardContent>
                  </Box>
                </Card>
              ))}
            </Grid>
            :
            <List
              sx={{
                flexGrow: 1,
                overflowY: 'scroll',
                justifyContent: 'space-between',
              }}
            >
              {filteredCollections.map((token, index) => (
                <TokenItem
                  token={token}
                  isLoading={isLoading}
                  enabledList={enabledList}
                  key={index}
                  onClick={handleTokenClick}
                />
              ))}
            </List>
          }
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
