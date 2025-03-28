import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Typography,
  IconButton,
  Divider,
  Button,
  Stack,
  Box,
  Tabs,
  Tab,
  CardMedia,
  Skeleton,
  Card,
  CardContent,
  CardActionArea,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { type UserInfoResponse } from '@/shared/types/network-types';
import IconNext from '@/ui/FRWAssets/svg/nextgray.svg';
import { LLSecondaryButton } from '@/ui/FRWComponent';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet } from 'ui/utils';

import CheckCircleIcon from '../../../../components/iconfont/IconCheckmark';
import IconCopy from '../../../../components/iconfont/IconCopy';

// import '../../Unlock/style.css';

import EditAccount from './EditAccount';
import UnlinkAccount from './UnlinkAccount';

// import fetchRemoteConfig from 'background/utils/remoteConfig';

type ChildAccount = {
  name: string;
  description: string;
  thumbnail: {
    url: string;
  };
};

interface Display {
  name: string;
  squareImage: string;
  mediaType: string;
}

interface AvailableNFT {
  id: string;
  path: string;
  display: Display;
  idList: string[];
}

interface TicketToken {
  id: string;
  balance: string;
}

interface Collection {
  id: string;
  contract_name: string;
  logo?: string;
  address: string;
  name: string;
  total?: number;
  nfts: any[];
}

const extractContractName = (collection) => {
  return collection.split('.')[2];
};

const findObjectByContractName = (contractName, collections) => {
  const extractedContract = extractContractName(contractName);
  const foundObject = collections.find((item) => item.contract_name === extractedContract);
  return foundObject || null;
};

const checkContractAddressInCollections = (nft, activec) => {
  const matchedResult = activec.find((collection) => {
    const parts = nft.split('.');
    const address = `0x${parts[1]}`;
    const contractName = parts[2];
    return collection.address === address && collection.contract_name === contractName;
  });
  return matchedResult;
};

const LinkedDetail = () => {
  const location = useParams();

  const history = useHistory();
  const usewallet = useWallet();
  const { childAccounts } = useProfiles();
  const [childAccount, setChildAccount] = useState<ChildAccount | null>(null);
  const [unlinking, setUnlinking] = useState<boolean>(false);
  const [active, setIsActive] = useState<boolean>(false);
  const [key, setKey] = useState<string>('');
  const [isEdit, setEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [availableFt, setFt] = useState<TicketToken[]>([]);
  const [availableNft, setNft] = useState<any[]>([]);
  const [availableNftCollection, setAvailableCollections] = useState<any[]>([]);
  const [hideEmpty, setHide] = useState<boolean>(false);
  const [nftCatalog, setCatalog] = useState<any[]>([]);
  const [activeCollection, setActiveCollection] = useState<any>([]);
  const [value, setValue] = useState('one');

  const handleChange = (_, newValue: string) => {
    setValue(newValue);
  };

  const fetchUserWallet = useCallback(async () => {
    try {
      const isChild = await usewallet.getActiveWallet();
      // const flowCoins = fetchRemoteConfig.flowCoins();
      if (isChild) {
        setIsActive(false);
      } else {
        setIsActive(true);
      }
      const key = location['key'];
      setChildAccount(childAccounts[key]);
      setKey(key);
      const catalog = await usewallet.getNftCatalog();

      const parentaddress = await usewallet.getParentAddress();
      if (!parentaddress) {
        throw new Error('Parent address not found');
      }
      const activec = await usewallet.getChildAccountAllowTypes(parentaddress, key!);
      setActiveCollection(activec);
      await setCatalog(catalog);
      const collectionMap: { [key: string]: Collection } = {};

      const nftResult = await usewallet.checkAccessibleNft(parentaddress);
      activec.forEach((active) => {
        const collection = findObjectByContractName(active, catalog);
        if (collection) {
          collectionMap[collection.contract_name] = { ...collection, total: 0, nfts: [] };
        }
      });
      Object.entries(nftResult[key]).forEach((nft) => {
        const someResult = checkContractAddressInCollections(nft[0], Object.values(collectionMap));
        if (someResult) {
          collectionMap[someResult.contract_name].total! += 1;
          collectionMap[someResult.contract_name].nfts!.push(nft);
        }
      });
      if (nftResult) {
        setNft(nftResult);
        const collectionsArray = Object.values(collectionMap);
        setAvailableCollections(collectionsArray);
      }
      const ftResult = await usewallet.checkAccessibleFt(key);
      if (ftResult) {
        setFt(ftResult);
      }

      setLoading(false);
    } catch (error) {
      // Handle any errors that occur during data fetching
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }, [usewallet, location, childAccounts]);

  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);

  const getUserInfo = useCallback(async () => {
    const userResult = await usewallet.getUserInfo(false);
    await setUserInfo(userResult);
  }, [usewallet]);

  const showUnlink = async (condition) => {
    await setUnlinking(condition);
  };

  const toggleEdit = () => {
    setEdit(!isEdit);
  };

  const toggleHide = (event) => {
    event.stopPropagation();
    const prevEmpty = hideEmpty;
    setHide(!prevEmpty);
  };

  const navigateWithState = (data, key) => {
    const state = { nft: data };
    localStorage.setItem('nftLinkedState', JSON.stringify(state));
    const storagePath = data.path.storage_path.split('/')[2];
    if (data.total) {
      history.push({
        pathname: `/dashboard/nested/linked/collectiondetail/${key + '.' + storagePath + '.' + data.total + '.linked'}`,
        state: {
          collection: data,
          ownerAddress: key,
        },
      });
    }
  };

  useEffect(() => {
    getUserInfo();
    fetchUserWallet();
  }, [getUserInfo, fetchUserWallet]);

  const nftContent = () => {
    const filteredNftCollection = availableNftCollection.filter(
      (item) => !hideEmpty || (hideEmpty && item.total && item.total > 0)
    );

    return (
      <Box sx={{ fontSize: '14px', color: '#FFFFFF', marginTop: '8px' }}>
        {filteredNftCollection.length ? (
          filteredNftCollection.map((item, index) => {
            const collectedText = chrome.i18n.getMessage('Collected');

            return (
              <CardActionArea
                sx={{
                  display: 'flex',
                  height: '64px',
                  marginTop: '8px',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  backgroundColor: '#292929',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                key={index}
                // to={{
                //   pathname: `/dashboard/nested/linked/collectiondetail/${key + '.' + item.contract_name + '.' + item.total + '.linked'}`,
                //   state: {
                //     collection: item,
                //     ownerAddress: key,
                //   }
                // }}
                onClick={() => navigateWithState(item, key)}
              >
                <img
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '32px',
                  }}
                  src={item.logo}
                  alt={item.name}
                />
                <Typography
                  sx={{
                    color: '#FFF',
                    fontFamily: 'Inter',
                    fontSize: 14,
                    fontStyle: 'normal',
                    fontWeight: 600,
                    lineHeight: '18px',
                    textTransform: 'capitalize',
                    marginLeft: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '50%',
                    alignItems: 'center',
                  }}
                >
                  {item.name}
                </Typography>
                <Box sx={{ flex: 1 }}></Box>
                <Typography
                  sx={{
                    color: '#BABABA',
                    textAlign: 'right',
                    fontFamily: 'Inter',
                    fontSize: 12,
                    fontStyle: 'normal',
                    fontWeight: 600,
                    lineHeight: '20px',
                    alignItems: 'center',
                  }}
                >
                  {item.total + ' '}
                  {collectedText}
                </Typography>
                <CardMedia
                  sx={{
                    width: '4px',
                    height: '8px',
                    marginLeft: '16px',
                    alignItems: 'center',
                  }}
                  image={IconNext}
                />
              </CardActionArea>
            );
          })
        ) : (
          <Box
            sx={{
              display: 'flex',
              height: '64px',
              marginTop: '8px',
              padding: '8px 20px',
              borderRadius: '16px',
              backgroundColor: '#292929',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '12px',
                color: '#bababa',
                textAlign: 'center',
              }}
            >
              No accessible NFT
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const ftContent = () => (
    <Box sx={{ fontSize: '14px', color: '#FFFFFF', marginTop: '8px' }}>
      {availableFt.map((token, index) => {
        return (
          <Box
            sx={{
              display: 'flex',
              height: '64px',
              marginTop: '8px',
              padding: '16px 20px',
              borderRadius: '16px',
              backgroundColor: '#292929',
              justifyContent: 'space-between',
            }}
            key={index}
          >
            <img
              style={{
                height: '32px',
                width: '32px',
                borderRadius: '32px',
                backgroundColor: 'text.secondary',
                objectFit: 'cover',
                marginRight: '8px',
              }}
              src={'https://lilico.app/placeholder-2.0.png'}
            />
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#fff',
                textAlign: 'right',
                fontFamily: 'Inter',
                fontSize: '14px',
                fontStyle: 'normal',
                fontWeight: 600,
                lineHeight: '20px',
              }}
            >
              {token.id.split('.')[2]}
            </Typography>
            <Box sx={{ flex: 1 }}></Box>
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#BABABA',
                textAlign: 'right',
                fontFamily: 'Inter',
                fontSize: '12px',
                fontStyle: 'normal',
                fontWeight: 600,
                lineHeight: '20px',
              }}
            >
              {parseFloat(token.balance).toFixed(3)} {token.id.split('.')[2]}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          px: '16px',
        }}
      >
        <IconButton>
          <ArrowBackIcon
            fontSize="medium"
            sx={{ color: 'icon.navi', cursor: 'pointer' }}
            onClick={() => history.push('/dashboard')}
          />
        </IconButton>
        <Typography
          variant="h1"
          sx={{
            py: '14px',
            alignSelf: 'center',
            fontSize: '20px',
          }}
        >
          {chrome.i18n.getMessage('Linked_Account')}
        </Typography>
        <IconButton>
          <EditRoundedIcon
            fontSize="medium"
            sx={{ color: 'icon.navi', cursor: 'pointer' }}
            onClick={() => {
              toggleEdit();
            }}
          />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        {/* <img src={logo} alt='logo' className={classes.logo} /> */}
        <Box sx={{ display: 'flex', flexDirection: 'column', padding: '18px', height: '100%' }}>
          <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
            <Stack
              direction="column"
              spacing="12px"
              sx={{ justifyContent: 'space-between', width: '100%' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <img
                    style={{
                      height: '60px',
                      width: '60px',
                      borderRadius: '60px',
                      backgroundColor: 'text.secondary',
                      objectFit: 'cover',
                    }}
                    src={childAccount?.thumbnail?.url ?? 'https://lilico.app/placeholder-2.0.png'}
                  />
                  <Typography
                    sx={{
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginTop: '14px',
                      width: '100%',
                    }}
                    color="text.secondary"
                  >
                    {childAccount?.name ?? chrome.i18n.getMessage('Linked_Account')}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
          <Box sx={{ display: 'block', width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                borderRadius: '16px',
                justifyContent: 'space-between',
                backgroundColor: '#292929',
                padding: '17px 20px',
                alignItems: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#E6E6E6',
                  fontWeight: 'bold',
                  width: '100%',
                }}
              >
                {chrome.i18n.getMessage('Address')}
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#bababa', width: '100%' }}>
                {key}
              </Typography>
              <Button
                variant="text"
                onClick={() => {
                  navigator.clipboard.writeText(key);
                }}
              >
                <IconCopy fill="icon.navi" width="12px" />
              </Button>
            </Box>
          </Box>
          <Divider sx={{ marginY: '24px' }} />

          <Box
            sx={{
              borderRadius: '12px',
              overflow: 'hidden',
              width: '100%',
              display: 'table',
              marginBottom: '44px',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                marginBottom: '14px',
                textTransform: 'capitalize',
                color: '#5E5E5E',
              }}
            >
              {chrome.i18n.getMessage('Description')}
            </Typography>
            <Typography sx={{ fontSize: '14px', color: '#FFFFFF' }}>
              {' '}
              {childAccount?.description ?? 'No Description'}
            </Typography>
          </Box>

          <Box
            sx={{
              borderRadius: '12px',
              overflow: 'hidden',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '44px',
              flexGrow: '1',
            }}
          >
            <Box
              sx={{
                borderRadius: '12px',
                overflow: 'hidden',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                flexGrow: '1',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  textTransform: 'capitalize',
                  color: '#5E5E5E',
                }}
              >
                {chrome.i18n.getMessage('Accessible')}
              </Typography>
              <Box sx={{ flexGrow: '1' }}></Box>
              <CardActionArea sx={{ width: 'auto' }}>
                <FormControlLabel
                  label={
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '12px', color: '#5e5e5e', marginRight: '0px' }}
                    >
                      {chrome.i18n.getMessage('Hide_Empty_collection')}
                    </Typography>
                  }
                  control={
                    <Checkbox
                      size="small"
                      icon={<CircleOutlinedIcon sx={{ width: '16px', height: '16px' }} />}
                      sx={{ paddingLeft: '10px' }}
                      checkedIcon={<CheckCircleIcon color={'#41CC5D'} />}
                      value="mainnet"
                      checked={hideEmpty}
                      onClick={toggleHide}
                    />
                  }
                />
              </CardActionArea>
            </Box>
            <Tabs
              value={value}
              onChange={handleChange}
              textColor="secondary"
              indicatorColor="secondary"
              aria-label="secondary tabs example"
              sx={{
                '.MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              <Tab
                sx={{
                  padding: '4px 16px',
                  flexShrink: 0,
                  borderRadius: 20,
                  background: '#292929',
                  color: '#E6E6E6',
                  fontFamily: 'Inter',
                  fontSize: '12px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: '20px',
                  textTransform: 'capitalize',
                  minHeight: '0px',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(50, 159, 227, 0.16)',
                    color: ' #329FE3',
                  },
                }}
                value="one"
                label="Collectables"
              />
              <Tab
                sx={{
                  padding: '4px 16px',
                  flexShrink: 0,
                  borderRadius: 20,
                  background: '#292929',
                  color: '#E6E6E6',
                  fontFamily: 'Inter',
                  fontSize: '12px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: '20px',
                  textTransform: 'capitalize',
                  marginLeft: '8px',
                  minHeight: '0px',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(50, 159, 227, 0.16)',
                    color: ' #329FE3',
                  },
                }}
                value="two"
                label="Coins"
              />
            </Tabs>
            {loading ? (
              <Box sx={{ marginBottom: '-24px' }}>
                {[...Array(2).keys()].map((key) => (
                  <Card
                    key={key}
                    sx={{ borderRadius: '12px', backgroundColor: '#000000', padding: '0 12px' }}
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
                      <CardContent
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          flex: '1 0 auto',
                          alignItems: 'center',
                        }}
                      >
                        <Skeleton variant="text" width={280} />
                      </CardContent>
                    </Box>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box>{value === 'one' ? nftContent() : ftContent()}</Box>
            )}
          </Box>
          {active && (
            <LLSecondaryButton label={'Unlink'} fullWidth onClick={() => showUnlink(true)} />
          )}
        </Box>
        <UnlinkAccount
          isAddAddressOpen={unlinking}
          handleCloseIconClicked={() => showUnlink(false)}
          handleCancelBtnClicked={() => showUnlink(false)}
          handleAddBtnClicked={() => {
            showUnlink(false);
          }}
          childAccount={childAccount}
          address={key}
          userInfo={userInfo}
        />
        {loading || !childAccount ? (
          // Show a loading indicator or other UI element while data is being fetched
          <div>Loading...</div>
        ) : (
          // Render the EditAccount component when the data is available
          <EditAccount
            isAddAddressOpen={isEdit}
            handleCloseIconClicked={() => setEdit(false)}
            handleCancelBtnClicked={() => setEdit(false)}
            handleAddBtnClicked={() => {
              setEdit(false);
            }}
            childAccount={childAccount}
            address={key}
            userInfo={userInfo}
          />
        )}
      </Box>
    </div>
  );
};

export default LinkedDetail;
