import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
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
  Typography,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

// import { useHistory } from 'react-router-dom';
import { type ExtendedTokenInfo } from '@/shared/types/coin-types';
import VerifiedIcon from '@/ui/assets/svg/verfied-check.svg';
import IconCreate from '@/ui/components/iconfont/IconCreate';
import TokenItem from '@/ui/components/TokenLists/TokenItem';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useCoins } from 'ui/hooks/useCoinHook';

const ManageToken = () => {
  const history = useHistory();
  const { coins, tokenFilter, updateTokenFilter } = useCoins();
  const { activeAccountType } = useProfiles();
  const [keyword, setKeyword] = useState('');
  const [filteredTokenList, setFilteredTokenList] = useState<ExtendedTokenInfo[]>([]);

  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (coins) {
      setFilteredTokenList(coins);
    }
  }, [coins]);

  const filter = (e1: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const searchWord = e1.target.value.toLowerCase();

    if (searchWord !== '' && coins) {
      const results = coins.filter((token) => {
        return (
          token.name.toLowerCase().includes(searchWord) ||
          token.symbol.toLowerCase().includes(searchWord)
        );
      });
      setFilteredTokenList(results);
    } else {
      setFilteredTokenList(coins ?? []);
    }

    setKeyword(searchWord);
  };

  return (
    <StyledEngineProvider injectFirst>
      <div className="page">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: 'auto',
          }}
        >
          <Grid
            container
            sx={{
              justifyContent: 'start',
              alignItems: 'center',
              px: '8px',
            }}
          >
            <Grid item xs={1}>
              <IconButton onClick={history.goBack}>
                <ArrowBackIcon sx={{ color: 'icon.navi' }} />
              </IconButton>
            </Grid>
            <Grid item xs={10}>
              <Typography variant="h1" align="center" py="14px" fontWeight="bold" fontSize="20px">
                {chrome.i18n.getMessage('Manage_Token')}
              </Typography>
            </Grid>
            {activeAccountType === 'evm' ? (
              <Grid item xs={1} sx={{ pl: 0 }}>
                <IconButton onClick={() => history.push('/dashboard/addcustomevm')}>
                  <IconCreate size={16} color="#787878" />
                </IconButton>
              </Grid>
            ) : (
              <Grid item xs={1} sx={{ pl: 0 }}>
                <IconButton onClick={() => history.push('/dashboard/tokenList')}>
                  <IconCreate size={16} color="#787878" />
                </IconButton>
              </Grid>
            )}
          </Grid>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              padding: '15px',
              borderRadius: '16px',
              gap: '5px',
              margin: '0 18px 22px',
              backgroundColor: 'rgba(255, 255, 255, 0.10)',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Filters
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
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
                {`Hide dust tokens `}
                <Tooltip title="Tokens with less than 0.01$ USD balance">
                  <HelpOutlineRoundedIcon
                    sx={{ color: 'rgba(255, 255, 255, 0.6)', width: '16px', height: '16px' }}
                  />
                </Tooltip>
              </Typography>

              <Switch
                checked={tokenFilter.hideDust}
                onChange={(event) =>
                  updateTokenFilter({ ...tokenFilter, hideDust: event.target.checked })
                }
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
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
                onChange={(event) =>
                  updateTokenFilter({ ...tokenFilter, hideUnverified: event.target.checked })
                }
              />
            </Box>
          </Box>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 600,
              fontSize: '14px',
              margin: '0 18px 10px',
            }}
          >
            Tokens
          </Typography>

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
                padding: '8px',
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
              {(filteredTokenList ? filteredTokenList : []).map((token, index) => (
                <TokenItem
                  token={token}
                  isLoading={isLoading}
                  enabled={coins?.map((item) => item.contractName).includes(token.contractName)}
                  onClick={updateTokenFilter}
                  tokenFilter={tokenFilter}
                  updateTokenFilter={updateTokenFilter}
                  key={index}
                  showSwitch={true}
                />
              ))}
            </List>
          )}
        </Box>
      </div>
    </StyledEngineProvider>
  );
};

export default ManageToken;
