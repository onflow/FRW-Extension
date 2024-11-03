import React, { useState, useEffect } from 'react';
import {
  Box,
  InputBase,
  Tab,
  Tabs,
  Typography,
  InputAdornment,
  Input,
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useWallet } from 'ui/utils';
import { useTheme, styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import SearchIcon from '@mui/icons-material/Search';
import { useHistory } from 'react-router-dom';
import AddressBookList from './AddressBookList';
import AccountsList from './AccountsList';
import SearchList from './SearchList';
import RecentList from './RecentList';
import { Contact } from 'background/service/networkModel';
import { isEmpty } from 'lodash';
import { makeStyles } from '@mui/styles';
import { StyledEngineProvider } from '@mui/material/styles';
import { withPrefix, isValidEthereumAddress } from '@/ui/utils/address';
import SwipeableViews from 'react-swipeable-views';
import IconAbout from '../../../components/iconfont/IconAbout';

export enum SendPageTabOptions {
  Recent = 'Recent',
  AddressBook = 'AddressBook',
  Accounts = 'Accounts',
}

const useStyles = makeStyles((theme) => ({
  page: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  inputWrapper: {
    paddingLeft: '18px',
    paddingRight: '18px',
    width: '100%',
  },
  inputBox: {
    minHeight: '56px',
    // borderRadius: theme.spacing(2),
    backgroundColor: '#282828',
    zIndex: '999',
    // width: '100%',
    borderRadius: '16px',
    boxSizing: 'border-box',
    // margin: '2px 18px 10px 18px',
    width: '100%',
    padding: '0px 16px'
  },
  listWrapper: {
    flexGrow: 1,
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: 'column',
  },
}));

const ArrowBackIconWrapper = styled('div')(() => ({
  paddingLeft: '10px',
  width: '100%',
  position: 'absolute',
  cursor: 'pointer',
}));

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  margin: '0px 18px 24px 18px',
  height: '56px',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: (theme.palette as any).icon.navi,
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(2),
    paddingLeft: theme.spacing(8),
    width: '100%',
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

let searchResult = {
  address: '',
  contact_name: '',
  avatar: '',
  domain: {
    domain_type: 0,
    value: '',
  },
} as Contact;

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`accounts-tabpanel-${index}`}
      aria-labelledby={`accounts-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `accounts-tab-${index}`,
    'aria-controls': `accounts-tabpanel-${index}`,
  };
};

const Send = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const wallet = useWallet();

  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('');
  const [sortedContacts, setSortedContacts] = useState<Contact[]>([]);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchContacts, setSearchContacts] = useState<any[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [hasNoFilteredContacts, setHasNoFilteredContacts] =
    useState<boolean>(false);

  const fetchAddressBook = async () => {
    await wallet.setDashIndex(0);
    try {
      const response = await wallet.getAddressBook();
      let recent = await wallet.getRecent();
      console.log('recent ', recent, response)
      if (recent) {
        recent.forEach((c) => {
          if (response) {
            response.forEach((s) => {
              if (c.address === s.address && c.contact_name === s.contact_name) {
                c.type = 1;
              }
            })

          }
        })
      } else {
        recent = [];
      }


      if (recent.length < 1) {
        setTabValue(1)
      }
      let sortedContacts = [] 
      if (response) {
        sortedContacts = response.sort((a, b) =>
          a.contact_name.toLowerCase().localeCompare(b.contact_name.toLowerCase())
        );
      }

      console.log('sortedContacts ', sortedContacts)

      setRecentContacts(recent);
      setSortedContacts(sortedContacts);
      setFilteredContacts(sortedContacts);
      setIsLoading(false);
    } catch (err) {
      console.log('err: ', err);
    }
  };

  useEffect(() => {
    fetchAddressBook();
  }, []);

  const checkContain = (searchResult: Contact) => {
    if (sortedContacts.some((e) => e.contact_name === searchResult.username)) {
      return true;
    }
    return false;
  };

  const checkContainDomain = (searchResult: string) => {
    if (sortedContacts.some((e) => e.domain?.value === searchResult)) {
      return true;
    }
    return false;
  };

  const checkDomain = async (searchType: number, keys = searchKey) => {
    const fArray = searchContacts;
    let result = '';
    let group = '';
    let keyword = keys
    if (keyword.includes('.')) {
      keyword = keys.substring(0, keys.lastIndexOf('.'));
    }
    switch (searchType) {
      case 0:
        result = await wallet.openapi.getFindAddress(keyword + '');
        group = '.find';
        keys = keyword + '.find';
        break;
      case 1:
        result = await wallet.openapi.getFlownsAddress(keyword + '');
        group = '.flowns';
        keys = keyword + '.fn';
        break;
      case 2:
        result = await wallet.openapi.getFlownsAddress(keyword + '', 'meow');
        group = '.meow';
        keys = keyword + '.meow';
        break;
    }
    const domainRresult = {
      address: '',
      contact_name: '',
      avatar: '',
      domain: {
        domain_type: 0,
        value: '',
      },
    } as Contact;
    if (result) {
      domainRresult['group'] = group;
      domainRresult.address = result;
      domainRresult.contact_name = keys;
      domainRresult.domain!.domain_type = searchType;
      domainRresult.domain!.value = keys;
      domainRresult.type! = checkContainDomain(keys) ? 2 : 4;
      fArray.push(domainRresult);
      setSearchContacts(fArray);
      setHasNoFilteredContacts(false);
    }
    return;
  };

  const searchUser = async () => {
    let result = await wallet.openapi.searchUser(searchKey);
    result = result.data.users;
    const fArray = searchContacts;
    const reg = /^((0x))/g;
    const lilicoResult = {
      address: '',
      contact_name: '',
      avatar: '',
      domain: {
        domain_type: 0,
        value: '',
      },
    } as Contact;
    if (result) {
      result.map((data) => {
        let address = data.address;
        if (!reg.test(data.address)) { address = '0x' + data.address; }
        lilicoResult['group'] = 'Flow Wallet user';
        lilicoResult.address = address;
        lilicoResult.contact_name = data.username;
        lilicoResult.domain!.domain_type = 999;
        lilicoResult.avatar = data.avatar;
        lilicoResult.type! = checkContain(data) ? 1 : 4;
        fArray.push(lilicoResult);
      })
      setSearchContacts(fArray);
    }
    return;
  }
  // const resetSearch = async () => {
  //   const emptya = []
  //   setSearchContacts(emptya);
  // }
  const searchAll = async () => {
    // await resetSearch();
    setSearching(true);
    setIsLoading(true);
    try {
      await checkDomain(0);
      await checkDomain(1);
      await checkDomain(2);
    } catch {
      setHasNoFilteredContacts(true);
    }
    finally {
      await searchUser();
    }
    // await searchUser();
    setHasNoFilteredContacts(false);
    setSearched(true);
    setIsLoading(false);
  };

  const checkKey = async (e) => {
    if (e.code === 'Enter') {
      searchAll();
    }
  }


  const handleFilterAndSearch = async (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setSearched(false);
    const keyword = e.target.value;
    setSearching(true);
    await setSearchKey(keyword);
    if (keyword.length === 0) {
      setSearching(false);
    }

    const filtered = sortedContacts.filter((item) => {
      for (const key in item) {
        if (typeof item[key] === 'string') {
          if (item[key].includes(keyword)) return true;
        }
      }
      if (item.domain?.value.includes(keyword)) return true;
      return false;
    });


    const checkAddress = keyword.trim()
    if (isValidEthereumAddress(checkAddress)) {
      if (filtered[0]) {
        searchResult = filtered[0]
      } else {
        searchResult.address = withPrefix(keyword) || keyword;
        searchResult.contact_name = withPrefix(checkAddress) || keyword;
        searchResult.avatar = '';
        searchResult.type! = 4;
      }
      history.push({
        pathname: '/dashboard/wallet/sendeth',
        state: { contact: searchResult },
      })
      return;
    }

    if (/^(0x)?[a-fA-F0-9]{16}$/.test(checkAddress)) {
      if (filtered[0]) {
        searchResult = filtered[0]
      } else {
        searchResult.address = withPrefix(keyword) || keyword;
        searchResult.contact_name = withPrefix(checkAddress) || keyword;
        searchResult.avatar = '';
        searchResult.type! = 4;
      }
      history.push({
        pathname: '/dashboard/wallet/sendAmount',
        state: { contact: searchResult },
      })
    }

    setSearchContacts(filtered);
    if (isEmpty(filtered)) {
      setHasNoFilteredContacts(true);
      if (keyword.endsWith('.find')) {
        await checkDomain(0, keyword);
        setSearched(true);
      } else if (keyword.endsWith('.fn')) {
        await checkDomain(1, keyword);
        setSearched(true);
      } else if (keyword.endsWith('.meow')) {
        await checkDomain(2, keyword);
        setSearched(true);
      }
    } else {
      setHasNoFilteredContacts(false);
    }
  };

  const handleClick = (eachgroup) => {
    const history = useHistory();

    const isEvmAddress = isValidEthereumAddress(eachgroup.address);

    const pathname = isEvmAddress ? '/dashboard/wallet/sendEth' : '/dashboard/wallet/sendAmount';

    history.push({
      pathname: pathname,
      state: { contact: eachgroup },
    });
  };


  return (
    <StyledEngineProvider injectFirst>
      <div className={`${classes.page} page`}>
        <Grid
          container
          sx={{
            justifyContent: 'start',
            alignItems: 'center',
            px: '8px',
          }}
        >
          <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={() => history.push('/dashboard')}>
              <ArrowBackIcon sx={{ color: 'icon.navi' }} />
            </IconButton>
          </Grid>
          <Grid item xs={10}>
            <Typography
              variant="h1"
              align="center"
              py="14px"
              fontWeight="bold"
              fontSize="20px"
            >
              {chrome.i18n.getMessage('Send_to')}
            </Typography>
          </Grid>
          <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={() => window.open('https://wallet.flow.com/contact', '_blank')}>
              <Tooltip title={chrome.i18n.getMessage('Need__Help')} arrow>
                <HelpOutlineRoundedIcon sx={{ color: 'icon.navi' }} />
              </Tooltip>
            </IconButton>
          </Grid>
        </Grid>
        <div className={classes.inputWrapper}>
          <Input
            type="search"
            className={classes.inputBox}
            placeholder={chrome.i18n.getMessage('Search__PlaceHolder')}
            autoFocus
            disableUnderline
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon
                  color="primary"
                  sx={{ ml: '10px', my: '5px', fontSize: '24px' }}
                />
              </InputAdornment>
            }
            onChange={handleFilterAndSearch}
            onKeyDown={checkKey}
          />
        </div>

        {!searching ? (
          <div className={classes.listWrapper}>
            <Tabs
              value={tabValue}
              sx={{ width: '100%' }}
              onChange={(_, newValue: number) => setTabValue(newValue)}
              TabIndicatorProps={{
                style: {
                  backgroundColor: '#5a5a5a',
                },
              }}
              variant="fullWidth"
              aria-label="accounts tabs"
            >
              {Object.values(SendPageTabOptions).map((option, index) => {
                return (
                  <Tab
                    label={
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{
                          textTransform: 'capitalize',
                          fontSize: '14px',
                          fontWeight: 'semi-bold',
                        }}
                      >
                        {chrome.i18n.getMessage(option)}
                      </Typography>
                    }
                    key={option}
                    style={{ color: '#F9F9F9' }}
                    {...a11yProps(index)}
                  />
                );
              })}
            </Tabs>
            <Box
              sx={{
                width: '100%',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'scroll',
                backgroundColor: '#000000',
                flexGrow: 1,
              }}
            >
              <SwipeableViews
                axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                index={tabValue}
                onChangeIndex={(index: number) => setTabValue(index)}
                style={{ height: '100%', width: '100%' }}
              >
                <TabPanel value={tabValue} index={0} dir={theme.direction}>
                  <RecentList
                    filteredContacts={recentContacts}
                    isLoading={isLoading}
                    handleClick={(eachgroup) => {
                      const isEvmAddress = isValidEthereumAddress(eachgroup.address);

                      const pathname = isEvmAddress ? '/dashboard/wallet/sendeth' : '/dashboard/wallet/sendAmount';

                      history.push({
                        pathname: pathname,
                        state: { contact: eachgroup },
                      });
                    }}
                  />
                </TabPanel>
                <TabPanel value={tabValue} index={1} dir={theme.direction}>
                  <AddressBookList
                    filteredContacts={filteredContacts}
                    isLoading={isLoading}
                    handleClick={(eachgroup) => {
                      const isEvmAddress = isValidEthereumAddress(eachgroup.address);

                      const pathname = isEvmAddress ? '/dashboard/wallet/sendeth' : '/dashboard/wallet/sendAmount';

                      history.push({
                        pathname: pathname,
                        state: { contact: eachgroup },
                      });
                    }}
                  />
                </TabPanel>
                <TabPanel value={tabValue} index={2} dir={theme.direction}>
                  <AccountsList
                    filteredContacts={filteredContacts}
                    isLoading={isLoading}
                    handleClick={(eachgroup) => {
                      const isEvmAddress = isValidEthereumAddress(eachgroup.address);

                      const pathname = isEvmAddress ? '/dashboard/wallet/sendeth' : '/dashboard/wallet/sendAmount';

                      history.push({
                        pathname: pathname,
                        state: { contact: eachgroup },
                      });
                    }}
                  />
                </TabPanel>
              </SwipeableViews>
            </Box>
          </div>
        ) : (
          <div>
            {!searched &&
              <ListItem
                sx={{
                  marginTop: '10px',
                  marginBottom: '10px',
                  paddingTop: '0px',
                  paddingBottom: '0px',
                  cursor: 'pointer',
                }}
                onClick={searchAll}
              >
                <ListItemAvatar>
                  <Avatar sx={{ width: '40px', height: '40px' }} />
                </ListItemAvatar>
                <ListItemText>
                  <Typography
                    sx={{ display: 'inline' }}
                    component="span"
                    variant="body2"
                  >
                    {chrome.i18n.getMessage('Search_the_ID')}
                  </Typography>
                  <Typography
                    sx={{ display: 'inline', textDecoration: 'underline' }}
                    component="span"
                    variant="body2"
                    color="primary"
                  >
                    {searchKey}
                  </Typography>
                </ListItemText>
              </ListItem>
            }

            {(!searched && !hasNoFilteredContacts) &&
              <AddressBookList
                filteredContacts={filteredContacts}
                isLoading={isLoading}
                handleClick={(eachgroup) => {
                  const isEvmAddress = isValidEthereumAddress(eachgroup.address);

                  const pathname = isEvmAddress ? '/dashboard/wallet/sendeth' : '/dashboard/wallet/sendAmount';

                  history.push({
                    pathname: pathname,
                    state: { contact: eachgroup },
                  });
                }}
              />}

            {(searched && !searchContacts.length) &&
              <ListItem sx={{ backgroundColor: '#000000' }}>
                <ListItemAvatar sx={{ marginRight: '8px', minWidth: '20px' }}>
                  {/* <CardMedia sx={{ width:'18px', height:'18px'}} image={empty} />   */}
                  <IconAbout size={20} color='#E54040' />
                </ListItemAvatar>
                <ListItemText>
                  <Typography
                    sx={{ display: 'inline', fontSize: '14px' }}
                    component="span"
                    color="#BABABA"
                  >
                    {chrome.i18n.getMessage('Sorry_we_could_not_find_any_accounts_Please_try_again')}
                  </Typography>
                </ListItemText>
              </ListItem>
            }
            {(searched && !hasNoFilteredContacts) &&
              <SearchList
                searchContacts={searchContacts}
                isLoading={isLoading}
                handleClick={(eachgroup) => {
                  const isEvmAddress = isValidEthereumAddress(eachgroup.address);

                  const pathname = isEvmAddress ? '/dashboard/wallet/sendeth' : '/dashboard/wallet/sendAmount';

                  history.push({
                    pathname: pathname,
                    state: { contact: eachgroup },
                  });
                }}
              />
            }
          </div>
        )}
      </div>
    </StyledEngineProvider>
  );
};

export default Send;
