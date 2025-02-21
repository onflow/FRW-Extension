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
} from '@mui/material';
import { useTheme, styled, StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { isEmpty } from 'lodash';
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import SwipeableViews from 'react-swipeable-views';

import { ContactType, type Contact } from '@/shared/types/network-types';
import { withPrefix, isValidEthereumAddress } from '@/shared/utils/address';
import { LLHeader } from '@/ui/FRWComponent';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { type MatchMedia } from '@/ui/utils/url';
import { useWallet } from 'ui/utils';

import IconAbout from '../../../../components/iconfont/IconAbout';
import AccountsList from '../../../FRWComponent/AddressLists/AccountsList';
import AddressBookList from '../../../FRWComponent/AddressLists/AddressBookList';
import RecentList from '../../../FRWComponent/AddressLists/RecentList';
import SearchList from '../../../FRWComponent/AddressLists/SearchList';

import SendNFTConfirmation from './SendNFTConfirmation';

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
    padding: '19px 16px',
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

interface NFTDetailState {
  nft: any;
  media: MatchMedia;
  index: number;
}
const USER_CONTACT = {
  address: '',
  id: 0,
  contact_name: '',
  avatar: '',
  domain: {
    domain_type: 999,
    value: '',
  },
} as unknown as Contact;

const SendToAddress = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const usewallet = useWallet();
  const location = useLocation();
  const { currentWallet } = useProfiles();

  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('');
  const [sortedContacts, setSortedContacts] = useState<Contact[]>([]);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchContacts, setSearchContacts] = useState<any[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [hasNoFilteredContacts, setHasNoFilteredContacts] = useState<boolean>(false);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [userInfo, setUser] = useState<Contact>(USER_CONTACT);
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [nftDetail, setDetail] = useState<any>(null);
  const [media, setMedia] = useState<MatchMedia | null>(null);

  const fetchAddressBook = useCallback(async () => {
    await usewallet.setDashIndex(0);
    try {
      const response = await usewallet.getAddressBook();
      let recent = await usewallet.getRecent();
      if (recent) {
        recent.forEach((c) => {
          if (response) {
            response.forEach((s) => {
              if (c.address === s.address && c.contact_name === s.contact_name) {
                c.contact_type = ContactType.AddressBook;
              }
            });
          }
        });
      } else {
        recent = [];
      }

      if (recent.length < 1) {
        setTabValue(1);
      }
      let sortedContacts: Contact[] = [];
      if (response) {
        sortedContacts = response.sort((a, b) =>
          a.contact_name.toLowerCase().localeCompare(b.contact_name.toLowerCase())
        );
      }

      setRecentContacts(recent);
      setSortedContacts(sortedContacts);
      setFilteredContacts(sortedContacts);
      setIsLoading(false);
    } catch (err) {
      console.log('err: ', err);
    }
  }, [usewallet]);

  useEffect(() => {
    fetchAddressBook();
  }, [fetchAddressBook]);

  const setUserInfo = useCallback(async () => {
    await usewallet.setDashIndex(1);
    const info = await usewallet.getUserInfo(false);
    const activeChild = await usewallet.getActiveWallet();
    const userContact = { ...USER_CONTACT };
    if (activeChild === 'evm') {
      const data = await usewallet.getEvmAddress();
      userContact.address = data;
    } else {
      userContact.address = withPrefix(currentWallet.address) || '';
    }
    userContact.avatar = info.avatar;
    userContact.contact_name = info.username;
    setUser(userContact);
  }, [usewallet, currentWallet]);

  const fetchNFTInfo = useCallback(async () => {
    const state = location.state as NFTDetailState;

    const NFT = state.nft;

    const media = state.media;
    setDetail(NFT);
    setMedia(media);

    const contractList = await usewallet.openapi.getAllNft();
    console.log('contractList ', contractList);
    console.log('NFT ', NFT);
    const filteredCollections = returnFilteredCollections(contractList, NFT);
    console.log('filteredCollections ', filteredCollections);
    if (filteredCollections.length > 0) {
      setContractInfo(filteredCollections[0]);
    }
  }, [usewallet, location.state]);

  const returnFilteredCollections = (contractList, NFT) => {
    return contractList.filter((collection) => collection.name === NFT.collectionName);
  };

  useEffect(() => {
    fetchNFTInfo();
    setUserInfo();
  }, [fetchNFTInfo, setUserInfo]);

  const checkContain = (searchResult: { username: string }) => {
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
    let keyword = keys;
    if (keyword.includes('.')) {
      keyword = keys.substring(0, keys.lastIndexOf('.'));
    }
    switch (searchType) {
      case 0:
        result = await usewallet.openapi.getFindAddress(keyword + '');
        group = '.find';
        keys = keyword + '.find';
        break;
      case 1:
        result = await usewallet.openapi.getFlownsAddress(keyword + '');
        group = '.flowns';
        keys = keyword + '.fn';
        break;
      case 2:
        result = await usewallet.openapi.getFlownsAddress(keyword + '', 'meow');
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
      domainRresult.contact_type = checkContainDomain(keys) ? ContactType.Domain : ContactType.User;
      fArray.push(domainRresult);
      setSearchContacts(fArray);
      setHasNoFilteredContacts(false);
    }
    return;
  };

  const searchUser = async () => {
    const apiResult = await usewallet.openapi.searchUser(searchKey);
    const result = apiResult.data.users;
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
        if (!reg.test(data.address)) {
          address = '0x' + data.address;
        }
        lilicoResult['group'] = 'Flow Wallet user';
        lilicoResult.address = address;
        lilicoResult.contact_name = data.username;
        lilicoResult.domain!.domain_type = 999;
        lilicoResult.avatar = data.avatar;
        lilicoResult.contact_type = checkContain(data) ? 1 : 4;
        fArray.push(lilicoResult);
      });
      setSearchContacts(fArray);
    }
    return;
  };
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
    } finally {
      await searchUser();
    }
    setHasNoFilteredContacts(true);
    setHasNoFilteredContacts(false);
    setSearched(true);
    setIsLoading(false);
  };

  const checkKey = async (e) => {
    if (e.code === 'Enter') {
      searchAll();
    }
  };

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

    const isValidAddress = (address) => {
      const regex = /^(0x)?[a-fA-F0-9]{16,40}$/;
      return regex.test(address);
    };

    const checkAddress = keyword.trim();
    if (isValidAddress(checkAddress)) {
      if (filtered[0]) {
        searchResult = filtered[0];
      } else {
        searchResult.address = withPrefix(keyword) || keyword;
        searchResult.contact_name = withPrefix(checkAddress) || keyword;
        searchResult.avatar = '';
        searchResult.contact_type = ContactType.User;
      }
      setConfirmationOpen(true);
    }

    if (isValidEthereumAddress(checkAddress)) {
      if (filtered[0]) {
        searchResult = filtered[0];
      } else {
        searchResult.address = withPrefix(keyword) || keyword;
        searchResult.contact_name = withPrefix(checkAddress) || keyword;
        searchResult.avatar = '';
        searchResult.contact_type = ContactType.User;
      }
      setConfirmationOpen(true);
    }

    setSearchContacts(filtered);
    if (isEmpty(filtered)) {
      setHasNoFilteredContacts(true);
    } else {
      setHasNoFilteredContacts(false);
    }
  };

  return (
    <StyledEngineProvider injectFirst>
      <div className={`${classes.page} page`}>
        <LLHeader title={chrome.i18n.getMessage('Send_to')} help={true} />
        <div className={classes.inputWrapper}>
          <Input
            type="search"
            className={classes.inputBox}
            placeholder={chrome.i18n.getMessage('Search__Address__or__Flow__domain')}
            autoFocus
            disableUnderline
            endAdornment={
              <InputAdornment position="end">
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
                          fontSize: '12px',
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
                      searchResult = eachgroup;
                      setConfirmationOpen(true);
                    }}
                  />
                </TabPanel>
                <TabPanel value={tabValue} index={1} dir={theme.direction}>
                  <AddressBookList
                    filteredContacts={filteredContacts}
                    isLoading={isLoading}
                    handleClick={(eachgroup) => {
                      searchResult = eachgroup;
                      setConfirmationOpen(true);
                    }}
                  />
                </TabPanel>
                <TabPanel value={tabValue} index={2} dir={theme.direction}>
                  <AccountsList
                    handleClick={(eachgroup) => {
                      searchResult = eachgroup;
                      setConfirmationOpen(true);
                    }}
                  />
                </TabPanel>
              </SwipeableViews>
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
                    {chrome.i18n.getMessage('Search__the__ID')}
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

            {!searched && !hasNoFilteredContacts && (
              <AddressBookList
                filteredContacts={filteredContacts}
                isLoading={isLoading}
                handleClick={(eachgroup) => {
                  searchResult = eachgroup;
                  setConfirmationOpen(true);
                }}
              />
            )}

            {searched && !searchContacts.length && (
              <ListItem sx={{ backgroundColor: '#000000' }}>
                <ListItemAvatar sx={{ marginRight: '8px', minWidth: '20px' }}>
                  {/* <CardMedia sx={{ width:'18px', height:'18px'}} image={empty} />   */}
                  <IconAbout size={20} color="#E54040" />
                </ListItemAvatar>
                <ListItemText>
                  <Typography
                    sx={{ display: 'inline', fontSize: '14px' }}
                    component="span"
                    color="#BABABA"
                  >
                    {chrome.i18n.getMessage('Sorry__we__could__not__find__any__accounts')}
                  </Typography>
                </ListItemText>
              </ListItem>
            )}
            {searched && !hasNoFilteredContacts && (
              <SearchList
                searchContacts={searchContacts}
                isLoading={isLoading}
                handleClick={(eachgroup) => {
                  searchResult = eachgroup;
                  setConfirmationOpen(true);
                }}
              />
            )}
          </div>
        )}
        {isConfirmationOpen && (
          <SendNFTConfirmation
            isConfirmationOpen={isConfirmationOpen}
            data={{
              contact: searchResult,
              userContact: userInfo,
              nft: nftDetail,
              contract: contractInfo,
              media: media,
            }}
            handleCloseIconClicked={() => setConfirmationOpen(false)}
            handleCancelBtnClicked={() => setConfirmationOpen(false)}
            handleAddBtnClicked={() => {
              setConfirmationOpen(false);
            }}
          />
        )}
      </div>
    </StyledEngineProvider>
  );
};

export default SendToAddress;
