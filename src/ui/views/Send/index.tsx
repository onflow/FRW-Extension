import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
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
import { useTheme, StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import React, { useState, useCallback, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { type Contact } from '@/shared/types/network-types';
import { type WalletAddress } from '@/shared/types/wallet-types';
import { isValidAddress } from '@/shared/utils/address';
import { filterContacts, checkAddressBookContacts } from '@/shared/utils/contact-utils';
import { useContacts } from '@/ui/hooks/useContactHook';
import { useWallet } from '@/ui/utils/WalletContext';

import IconAbout from '../../../components/iconfont/IconAbout';
import AccountsList from '../../FRWComponent/AddressLists/AccountsList';
import AddressBookList from '../../FRWComponent/AddressLists/AddressBookList';
import RecentList from '../../FRWComponent/AddressLists/RecentList';
import SearchList from '../../FRWComponent/AddressLists/SearchList';

export enum SendPageTabOptions {
  Recent = 'Recent',
  AddressBook = 'AddressBook',
  Accounts = 'Accounts',
}

const useStyles = makeStyles((_theme) => ({
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
    padding: '0px 16px',
  },
  listWrapper: {
    flexGrow: 1,
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: 'column',
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

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

const SendAddress = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();

  const { recentContacts, addressBookContacts } = useContacts();

  const wallet = useWallet();

  const [tabValue, setTabValue] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('');
  const [searched, setSearched] = useState<boolean>(false);
  const [searchContacts, setSearchContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const { id: token } = useParams<{ id: string }>();

  useEffect(() => {
    // Update filtered contacts when the search key changes
    const newFilteredContacts =
      searchKey !== '' ? filterContacts(searchKey, addressBookContacts) : addressBookContacts;
    setFilteredContacts(newFilteredContacts);
  }, [searchKey, addressBookContacts]);

  const searchAll = useCallback(async () => {
    try {
      setSearching(true);
      setIsLoading(true);
      const contacts = await wallet.searchByUsername(searchKey);

      setSearchContacts(checkAddressBookContacts(contacts, addressBookContacts));
    } catch (error) {
      console.error('Error searching for username', error);
    } finally {
      setSearched(true);
      setIsLoading(false);
    }
  }, [searchKey, wallet, addressBookContacts]);

  const checkKey = useCallback(
    async (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (e.code === 'Enter') {
        searchAll();
      }
    },
    [searchAll]
  );

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
    const trimmedSearchTerm = keyword.trim();
    if (isValidAddress(trimmedSearchTerm)) {
      const address = trimmedSearchTerm as WalletAddress;
      handleTransactionRedirect(address);
    }
  };

  const handleTransactionRedirect = useCallback(
    (address: string) => {
      if (isValidAddress(address)) {
        // Check if there was a token in the search params
        const pathname = `/dashboard/token/${token}/send/${address}`;
        history.push({
          pathname,
        });
      } else {
        console.error('Invalid address', address);
      }
    },
    [history, token]
  );
  // Handle the click of a contact
  const handleContactClick = useCallback(
    (contact: Contact) => {
      handleTransactionRedirect(contact.address);
    },
    [handleTransactionRedirect]
  );

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
            <Typography variant="h1" align="center" py="14px" fontWeight="bold" fontSize="20px">
              {chrome.i18n.getMessage('Send_to')}
            </Typography>
          </Grid>
          <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={() => window.open('https://usewallet.flow.com/contact', '_blank')}>
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
                <SearchIcon color="primary" sx={{ ml: '10px', my: '5px', fontSize: '24px' }} />
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
              <TabPanel value={tabValue} index={0} dir={theme.direction}>
                <RecentList
                  filteredContacts={recentContacts}
                  isLoading={isLoading}
                  handleClick={handleContactClick}
                />
              </TabPanel>
              <TabPanel value={tabValue} index={1} dir={theme.direction}>
                <AddressBookList
                  filteredContacts={filteredContacts}
                  isLoading={isLoading}
                  handleClick={handleContactClick}
                />
              </TabPanel>
              <TabPanel value={tabValue} index={2} dir={theme.direction}>
                <AccountsList handleClick={handleContactClick} />
              </TabPanel>
            </Box>
          </div>
        ) : (
          <div>
            {!searched && (
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
                  <Typography sx={{ display: 'inline' }} component="span" variant="body2">
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
            )}

            {!searched && filteredContacts.length > 0 && (
              <AddressBookList
                filteredContacts={filteredContacts}
                isLoading={isLoading}
                handleClick={handleContactClick}
              />
            )}

            {searched && !searchContacts.length && (
              <ListItem sx={{ backgroundColor: '#000000' }}>
                <ListItemAvatar sx={{ marginRight: '8px', minWidth: '20px' }}>
                  <IconAbout size={20} color="#E54040" />
                </ListItemAvatar>
                <ListItemText>
                  <Typography
                    sx={{ display: 'inline', fontSize: '14px' }}
                    component="span"
                    color="#BABABA"
                  >
                    {chrome.i18n.getMessage(
                      'Sorry_we_could_not_find_any_accounts_Please_try_again'
                    )}
                  </Typography>
                </ListItemText>
              </ListItem>
            )}
            {searched && searchContacts.length > 0 && (
              <SearchList
                searchContacts={searchContacts}
                isLoading={isLoading}
                handleClick={handleContactClick}
              />
            )}
          </div>
        )}
      </div>
    </StyledEngineProvider>
  );
};

export default SendAddress;
